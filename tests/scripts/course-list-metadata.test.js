import { runInNewContext } from "node:vm";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import script from "../../dist/scripts/embedded/course-list-metadata.js?raw";
const channel = "uxue-course-list-metadata";
const mainOrigin = "https://i.chaoxing.com";
const frameOrigin = "https://mooc2-ans.chaoxing.com";
const card = `<div class="course"><input class="courseId" value="265998423">
  <span class="course-name">军事理论课</span><div class="course-cover">
  <img src="https://p.cldisk.com/star3/d858860c4cef76155b5e62596693ead0/cover.jpg">
  </div></div>`;
/** @type {MutationObserver[]} */
const observers = [];
afterEach(() => {
  for (const observer of observers) observer.disconnect();
  observers.length = 0;
});
/**
 * @typedef {{channel?: string, kind?: string, courses?: {courseId: string, metadata: {title: string, cover: string}}[]}} CourseMessage
 * @typedef {{source: unknown, origin: string, data: CourseMessage}} CourseEvent
 * @typedef {{location: {origin: string}, top: TestWindow, postMessage: import("vitest").Mock<(message: CourseMessage, origin: string) => void>}} TestWindow
 * @param {string} origin
 * @param {TestWindow} [top]
 */
function page(origin, top) {
  /** @type {Set<(event: CourseEvent) => void>} */
  const listeners = new Set();
  const invoke = vi.fn().mockResolvedValue(null);
  /** @type {TestWindow & {addEventListener(type: string, callback: (event: CourseEvent) => void): void, removeEventListener(type: string, callback: (event: CourseEvent) => void): void, __TAURI_INTERNALS__: {invoke: typeof invoke}}} */
  const pageWindow = {
    location: { origin },
    get top() {
      return top ?? pageWindow;
    },
    postMessage: vi.fn(),
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
    __TAURI_INTERNALS__: { invoke },
  };
  const doc = document.implementation.createHTMLDocument();
  /** @type {{target: Node, options: MutationObserverInit}[]} */
  const observations = [];
  Object.defineProperty(doc, "readyState", {
    value: "complete",
    configurable: true,
  });
  class Observer extends MutationObserver {
    /** @param {MutationCallback} callback */
    constructor(callback) {
      super(callback);
      observers.push(this);
    }
    /**
     * @param {Node} target
     * @param {MutationObserverInit} options
     */
    observe(target, options) {
      observations.push({ target, options });
      super.observe(target, options);
    }
  }
  return {
    pageWindow,
    doc,
    invoke,
    observations,
    run: () =>
      runInNewContext(script, {
        window: pageWindow,
        document: doc,
        URL,
        MutationObserver: Observer,
        console,
      }),
    /** @type {(source: unknown, sourceOrigin: string, data: CourseMessage) => void} */
    receive: (source, sourceOrigin, data) => {
      for (const listener of listeners)
        listener({ source, origin: sourceOrigin, data });
    },
  };
}
describe("Chaoxing course metadata", () => {
  it("collects AJAX cards in a cross-origin iframe and saves through the top frame", async () => {
    const root = page("https://mooc1.chaoxing.com");
    const child = page(frameOrigin, root.pageWindow);
    root.run();
    child.run();
    expect(root.pageWindow.postMessage).toHaveBeenCalledWith(
      { channel, kind: "ready" },
      "*",
    );
    root.receive(child.pageWindow, frameOrigin, { channel, kind: "ready" });
    expect(child.pageWindow.postMessage).toHaveBeenCalledWith(
      { channel, kind: "collect" },
      frameOrigin,
    );
    child.receive(root.pageWindow, root.pageWindow.location.origin, {
      channel,
      kind: "collect",
    });
    child.doc.body.innerHTML = `<div id="courseList">${card}</div>`;
    await flushPromises();
    const calls = root.pageWindow.postMessage.mock.calls;
    const message = calls[calls.length - 1];
    expect(message[1]).toBe(root.pageWindow.location.origin);
    root.receive(child.pageWindow, frameOrigin, message[0]);
    expect(root.invoke).toHaveBeenCalledWith("insert_course_meta_map", {
      courseId: "265998423",
      metadata: {
        title: "军事理论课",
        cover: "https://p.cldisk.com/star3/origin/cover.jpg",
      },
    });
    expect(child.invoke).not.toHaveBeenCalled();
    root.pageWindow.postMessage.mockClear();
    child.doc.querySelector(".course").append(child.doc.createElement("i"));
    await flushPromises();
    expect(root.pageWindow.postMessage).not.toHaveBeenCalled();
    child.doc.querySelector(".course-name").textContent = "更新课程名称";
    await flushPromises();
    const update = root.pageWindow.postMessage.mock.calls[0][0];
    if (update.kind !== "courses")
      throw new Error("Expected a course metadata update");
    expect(update.courses[0].metadata.title).toBe("更新课程名称");
  });
  it("does not authorize collection outside Chaoxing or from foreign origins", () => {
    const root = page("https://example.com");
    root.run();
    const source = { postMessage: vi.fn() };
    root.receive(source, frameOrigin, { channel, kind: "ready" });
    expect(source.postMessage).not.toHaveBeenCalled();
    const main = page(mainOrigin);
    main.run();
    main.receive(source, "https://chaoxing.com.example.com", {
      channel,
      kind: "ready",
    });
    expect(source.postMessage).not.toHaveBeenCalled();
    main.receive(source, "https://example.com", {
      channel,
      kind: "courses",
      courses: [],
    });
    expect(main.invoke).not.toHaveBeenCalled();
  });
  it("waits for authorization from the actual top frame and for DOM readiness", async () => {
    const root = page(mainOrigin);
    const child = page(frameOrigin, root.pageWindow);
    Object.defineProperty(child.doc, "readyState", { value: "loading" });
    child.doc.body.innerHTML = `<div id="courseList">${card}</div>`;
    child.run();
    root.pageWindow.postMessage.mockClear();
    child.receive({}, mainOrigin, { channel, kind: "collect" });
    child.receive(root.pageWindow, "http://i.chaoxing.com", {
      channel,
      kind: "collect",
    });
    await flushPromises();
    expect(root.pageWindow.postMessage).not.toHaveBeenCalled();
    child.receive(root.pageWindow, mainOrigin, { channel, kind: "collect" });
    expect(root.pageWindow.postMessage).not.toHaveBeenCalled();
    child.doc.dispatchEvent(new Event("DOMContentLoaded"));
    expect(root.pageWindow.postMessage).toHaveBeenCalledOnce();
  });
  it("collects a top-level list and follows container replacement without repeating metadata", async () => {
    const root = page(frameOrigin);
    root.doc.body.innerHTML = `<div class="course-list-con"><div id="courseList">${card}</div></div>`;
    root.run();
    expect(root.invoke).toHaveBeenCalledOnce();
    const oldRegion = root.doc.querySelector(".course-list-con");
    root.doc.body.innerHTML = `<div class="course-list-con"><div id="courseList">${card}</div></div>`;
    await flushPromises();
    expect(root.invoke).toHaveBeenCalledOnce();
    const image = root.doc.querySelector("img");
    image.src = "https://example.com/new-cover.jpg";
    await flushPromises();
    expect(root.invoke).toHaveBeenCalledTimes(2);
    expect(root.invoke.mock.calls[1][1].metadata.cover).toBe(image.src);
    oldRegion.querySelector(".course-name").textContent = "旧容器变化";
    await flushPromises();
    expect(root.invoke).toHaveBeenCalledTimes(2);
    expect(root.pageWindow.postMessage).not.toHaveBeenCalled();
  });
  it("only observes list details after a delayed empty container appears", async () => {
    const root = page(mainOrigin);
    const query = vi.spyOn(root.doc, "querySelector");
    root.run();
    query.mockClear();
    root.doc.body.innerHTML = "<main><span>无关内容</span></main>";
    await flushPromises();
    expect(query).not.toHaveBeenCalled();
    expect(root.observations).toEqual([
      { target: root.doc.body, options: { childList: true, subtree: true } },
    ]);
    expect(root.invoke).not.toHaveBeenCalled();
    root.doc.body.innerHTML =
      '<div class="course-list-con"><div id="courseList"></div></div>';
    await flushPromises();
    expect(root.invoke).not.toHaveBeenCalled();
    expect(root.observations[1].target).toBe(
      root.doc.querySelector(".course-list-con"),
    );
    root.doc.querySelector("#courseList").innerHTML = card;
    await flushPromises();
    expect(root.invoke).toHaveBeenCalledOnce();
  });
  it("reconnects when a standalone courseList is removed and later reinserted", async () => {
    const root = page(mainOrigin);
    root.doc.body.innerHTML = `<div id="courseList">${card}</div>`;
    root.run();
    root.doc.body.innerHTML = "";
    await flushPromises();
    root.doc.body.innerHTML = `<div id="courseList">${card.replace("军事理论课", "新课程名称")}</div>`;
    await flushPromises();
    expect(root.invoke).toHaveBeenCalledTimes(2);
    expect(root.invoke.mock.calls[1][1].metadata.title).toBe("新课程名称");
  });
});
