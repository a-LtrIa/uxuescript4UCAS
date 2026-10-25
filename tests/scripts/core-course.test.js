import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCourse } from "@injected/chaoxing/course/chapters.js";
import { handleChapter } from "@injected/chaoxing/course/chapter/index.js";
import { config } from "@injected/chaoxing/runtime.js";
import { emit } from "@injected/chaoxing/course/runtime.js";

vi.mock("@injected/chaoxing/course/chapter/index.js", () => ({
  handleChapter: vi.fn(),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
/** @param {string[]} states */
function setup(states) {
  const doc = document;
  doc.body.innerHTML = "";
  const chapters = states.map((state, index) => {
    const node = doc.createElement("div");
    node.id = `cur${index}`;
    node.className = "posCatalog_select";
    node.innerHTML = `<span class="posCatalog_name">Chapter ${index}</span>`;
    if (state !== "finished")
      node.appendChild(doc.createElement("i")).className = "orangeNew";
    if (state !== "blocking") node.querySelector("span").onclick = () => {};
    doc.body.appendChild(node);
    return node;
  });
  vi.mocked(handleChapter).mockReset().mockResolvedValue(undefined);
  const disconnect = vi.fn();
  class Observer extends MutationObserver {
    disconnect() {
      disconnect();
      super.disconnect();
    }
  }
  vi.stubGlobal("MutationObserver", Observer);
  config.debugTaskTypes = [];
  const progress = vi
    .spyOn(emit, "chapterProgress")
    .mockResolvedValue(undefined);
  /** @param {number} index */
  const unlock = (index, finished = false) => {
    const node = doc.getElementById(chapters[index].id);
    const title = node.querySelector("span");
    title.setAttribute("onclick", "getTeacherAjax()");
    title.onclick = () => {};
    if (finished) node.querySelector(".orangeNew")?.remove();
    return node;
  };
  return {
    doc,
    chapters,
    config,
    handleChapter: vi.mocked(handleChapter),
    disconnect,
    progress,
    unlock,
    run: () => handleCourse(chapters),
  };
}
describe("course chapter queue", () => {
  it("processes available chapters before appending an unlocked chapter", async () => {
    const page = setup(["pending", "blocking", "pending"]);
    let complete = false;
    const run = page.run().then(() => {
      complete = true;
    });
    await flushPromises();
    expect(page.handleChapter.mock.calls.map(([node]) => node.id)).toEqual([
      "cur0",
      "cur2",
    ]);
    expect(complete).toBe(false);
    const unlocked = page.unlock(1);
    await run;
    expect(page.handleChapter.mock.calls.map(([node]) => node.id)).toEqual([
      "cur0",
      "cur2",
      "cur1",
    ]);
    expect(page.handleChapter).toHaveBeenLastCalledWith(unlocked);
    expect(page.disconnect).toHaveBeenCalledOnce();
  });
  it("queues simultaneous unlocks once, in directory order, while a chapter is running", async () => {
    const page = setup(["pending", "blocking", "blocking", "pending"]);
    /** @type {() => void} */
    let finish;
    page.handleChapter.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const run = page.run();
    await flushPromises();
    page.unlock(2);
    page.unlock(1);
    await flushPromises();
    page.chapters[1].classList.add("posCatalog_active");
    await flushPromises();
    finish();
    await run;
    expect(page.handleChapter.mock.calls.map(([node]) => node.id)).toEqual([
      "cur0",
      "cur3",
      "cur1",
      "cur2",
    ]);
  });
  it("finds an unlocked chapter after its DOM node is replaced", async () => {
    const page = setup(["pending", "blocking"]);
    const run = page.run();
    await flushPromises();
    const replacement = page.chapters[1].cloneNode(true);
    page.chapters[1].replaceWith(replacement);
    page.unlock(1);
    await run;
    expect(page.handleChapter).toHaveBeenCalledTimes(2);
    expect(page.handleChapter).toHaveBeenLastCalledWith(replacement);
  });
  it("finishes when the last blocked chapter unlocks already completed", async () => {
    const page = setup(["pending", "blocking"]);
    const run = page.run();
    await flushPromises();
    page.unlock(1, true);
    await run;
    expect(page.handleChapter).toHaveBeenCalledExactlyOnceWith(
      page.chapters[0],
    );
    expect(page.disconnect).toHaveBeenCalledOnce();
  });
  it("handles a chapter unlocked before course processing starts", async () => {
    const page = setup(["blocking"]);
    page.unlock(0);
    await page.run();
    expect(page.handleChapter).toHaveBeenCalledOnce();
  });
  it("reports progress in processing order as unlocked chapters are appended", async () => {
    const page = setup(["pending", "blocking", "pending"]);
    const run = page.run();
    await flushPromises();
    page.unlock(1);
    await run;
    const indices = page.progress.mock.calls.map(([index]) => index);
    expect(indices).toEqual([0, 1, 2]);
  });
  it("includes completed chapters in debug mode but still waits for locked chapters", async () => {
    const page = setup(["pending", "blocking", "finished"]);
    page.config.debugTaskTypes = ["Video"];
    const run = page.run();
    await flushPromises();
    expect(page.handleChapter.mock.calls.map(([node]) => node.id)).toEqual([
      "cur0",
      "cur2",
    ]);
    page.unlock(1, true);
    await run;
    expect(page.handleChapter.mock.calls.map(([node]) => node.id)).toEqual([
      "cur0",
      "cur2",
      "cur1",
    ]);
    expect(page.disconnect).toHaveBeenCalledOnce();
  });
});
