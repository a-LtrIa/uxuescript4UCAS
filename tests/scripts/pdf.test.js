import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handlePDFBridge,
  handlePDF,
  handlePDFViewer,
} from "@injected/chaoxing/course/chapter/tasks/pdf.js";
import { wait } from "@injected/utils/async.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PDF task handling", () => {
  it("bridges messages between the task frame and nested PDF viewer", () => {
    const parent = { postMessage: vi.fn() };
    const viewer = { postMessage: vi.fn() };
    const frame = document.createElement("iframe");
    frame.src = "https://pan.mooc.ucas.edu.cn/screen/v2/file_test";
    Object.defineProperty(frame, "contentWindow", { value: viewer });
    document.body.appendChild(frame);
    Object.defineProperty(window, "top", { configurable: true, value: {} });
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: parent,
    });
    const addEventListener = vi.spyOn(window, "addEventListener");

    handlePDFBridge();
    const receive = addEventListener.mock.calls.find(
      ([type]) => type === "message",
    )?.[1];
    expect(parent.postMessage).toHaveBeenLastCalledWith(
      { channel: "uxs-pdf-viewer", kind: "ready" },
      "*",
    );

    window.dispatchEvent(
      new MessageEvent("message", {
        source: /** @type {MessageEventSource} */ (
          /** @type {unknown} */ (parent)
        ),
        data: { channel: "uxs-pdf-viewer", kind: "start" },
      }),
    );
    expect(viewer.postMessage).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent("message", {
        source: /** @type {MessageEventSource} */ (
          /** @type {unknown} */ (viewer)
        ),
        data: { channel: "uxs-pdf-viewer", kind: "ready" },
      }),
    );
    expect(parent.postMessage).toHaveBeenLastCalledWith(
      { channel: "uxs-pdf-viewer", kind: "ready" },
      "*",
    );
    expect(viewer.postMessage).toHaveBeenCalledWith(
      { channel: "uxs-pdf-viewer", kind: "start" },
      "*",
    );

    window.dispatchEvent(
      new MessageEvent("message", {
        source: /** @type {MessageEventSource} */ (
          /** @type {unknown} */ (viewer)
        ),
        data: { channel: "uxs-pdf-viewer", kind: "finished" },
      }),
    );
    expect(parent.postMessage).toHaveBeenLastCalledWith(
      { channel: "uxs-pdf-viewer", kind: "finished" },
      "*",
    );

    if (receive) window.removeEventListener("message", receive, true);
    frame.remove();
  });

  it("scrolls on reader load and acknowledges a late start message", async () => {
    const container = {
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 0,
      scrollTo: vi.fn(),
    };
    container.scrollTo.mockImplementation(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    });
    const pdfDoc = /** @type {Document} */ (
      /** @type {unknown} */ ({
        readyState: "complete",
        scrollingElement: container,
      })
    );

    Object.defineProperty(window, "top", { configurable: true, value: {} });
    const parent = { postMessage: vi.fn() };
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: parent,
    });
    await handlePDFViewer(pdfDoc);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: "smooth",
    });
    expect(parent.postMessage).toHaveBeenCalledWith(
      { channel: "uxs-pdf-viewer", kind: "finished" },
      "*",
    );

    window.dispatchEvent(
      new MessageEvent("message", {
        source: window.parent,
        data: { channel: "uxs-pdf-viewer", kind: "start" },
      }),
    );
    expect(parent.postMessage).toHaveBeenCalledTimes(3);
    expect(parent.postMessage).toHaveBeenLastCalledWith(
      { channel: "uxs-pdf-viewer", kind: "finished" },
      "*",
    );
  });

  it("scrolls a same-origin PDF frame to its final page", async () => {
    const container = {
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 0,
      scrollTo: vi.fn(),
    };
    container.scrollTo.mockImplementation(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    });
    const pdfDoc = { scrollingElement: container };
    const pdfDocument = /** @type {Document} */ (
      /** @type {unknown} */ (pdfDoc)
    );

    const frame = document.createElement("iframe");
    Object.defineProperty(frame, "contentDocument", { value: pdfDocument });
    const taskDoc = document.implementation.createHTMLDocument();
    taskDoc.body.appendChild(frame);
    vi.spyOn(wait, "element").mockResolvedValue(frame);
    vi.spyOn(wait, "iframeDoc").mockResolvedValue(pdfDocument);

    await handlePDF(taskDoc);

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: "smooth",
    });
    expect(container.scrollTop + container.clientHeight).toBe(1000);
  });

  it("requests and waits for a cross-origin PDF viewer", async () => {
    const frame = document.createElement("iframe");
    frame.src = "https://pan.mooc.ucas.edu.cn/screen/v2/file_test";
    Object.defineProperty(frame, "contentDocument", { value: null });
    const taskDoc = document.implementation.createHTMLDocument();
    taskDoc.body.appendChild(frame);
    const postMessage = vi.fn();
    Object.defineProperty(frame, "contentWindow", { value: { postMessage } });
    vi.spyOn(wait, "element").mockResolvedValue(frame);

    const run = handlePDF(taskDoc);
    await Promise.resolve();
    expect(postMessage).toHaveBeenCalledWith(
      { channel: "uxs-pdf-viewer", kind: "start" },
      "*",
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { channel: "uxs-pdf-viewer", kind: "ready" },
      }),
    );
    expect(postMessage).toHaveBeenLastCalledWith(
      { channel: "uxs-pdf-viewer", kind: "start" },
      "*",
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { channel: "uxs-pdf-viewer", kind: "finished" },
      }),
    );
    await expect(run).resolves.toBeUndefined();
  });

  it("uses the viewer protocol when contentDocument is inaccessible despite a same-origin src", async () => {
    const frame = document.createElement("iframe");
    frame.src = `${window.location.origin}/ananas/modules/pdf/index.html`;
    Object.defineProperty(frame, "contentDocument", { value: null });
    const taskDoc = document.implementation.createHTMLDocument();
    taskDoc.body.appendChild(frame);
    const postMessage = vi.fn();
    Object.defineProperty(frame, "contentWindow", { value: { postMessage } });
    vi.spyOn(wait, "element").mockResolvedValue(frame);
    const iframeDoc = vi.spyOn(wait, "iframeDoc").mockResolvedValue(null);

    const run = handlePDF(taskDoc);
    await Promise.resolve();
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { channel: "uxs-pdf-viewer", kind: "ready" },
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { channel: "uxs-pdf-viewer", kind: "finished" },
      }),
    );

    await expect(run).resolves.toBeUndefined();
    expect(iframeDoc).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      { channel: "uxs-pdf-viewer", kind: "start" },
      "*",
    );
  });
});
