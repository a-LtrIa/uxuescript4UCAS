import { config } from "@injected/chaoxing/runtime.js";
import { confirm } from "@injected/utils/backend.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";
import { wait, sleep, assert } from "@injected/utils/async.js";

const PDF_MESSAGE_CHANNEL = "uxs-pdf-viewer";

/**
 * @typedef {{channel: typeof PDF_MESSAGE_CHANNEL, kind: "ready"|"start"|"finished"}} PDFMessage
 */

/**
 * 滚动 PDF 文档到底部，完成标记由任务调度等待。
 * @param {Document} pdfDoc PDF 阅读器文档。
 * @returns {Promise<void>}
 */
const scrollPDF = async (pdfDoc) => {
  const container = pdfDoc.scrollingElement ?? pdfDoc.documentElement;
  assert(container, "获取 PDF 滚动容器失败");
  const isScrolled = await wait.until(async () => {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
    await sleep(750);
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 10
    ) {
      return true;
    }
    return null;
  });

  assert(isScrolled, "多次尝试后 PDF 仍未滚动");
};

/**
 * 在跨源 PDF iframe 内直接滚动，由课程页通过消息启动。
 * @param {Document} pdfDoc PDF 阅读器文档。
 * @returns {Promise<void>}
 */
export const handlePDFViewer = async (pdfDoc) => {
  console.info("PDF阅读器脚本入口", {
    href: location.origin + location.pathname,
    readyState: pdfDoc.readyState,
    isTop: window.top === window,
  });
  if (window.top === window) return;

  let finished = false;
  let startRequested = false;
  const sendFinished = () =>
    window.parent.postMessage(
      /** @type {PDFMessage} */ ({
        channel: PDF_MESSAGE_CHANNEL,
        kind: "finished",
      }),
      "*",
    );
  /** @param {MessageEvent<PDFMessage>} event */
  const receive = (event) => {
    if (
      event.source !== window.parent ||
      event.data?.channel !== PDF_MESSAGE_CHANNEL ||
      event.data.kind !== "start"
    )
      return;
    startRequested = true;
    if (finished) {
      sendFinished();
      window.removeEventListener("message", receive, true);
    }
  };
  window.addEventListener("message", receive, true);
  window.parent.postMessage(
    /** @type {PDFMessage} */ ({
      channel: PDF_MESSAGE_CHANNEL,
      kind: "ready",
    }),
    "*",
  );
  await scrollPDF(pdfDoc);
  finished = true;
  sendFinished();
  if (startRequested) window.removeEventListener("message", receive, true);
  console.info("PDF阅读器处理完成");
};

/**
 * 在国科大 PDF 中间页与跨源阅读器之间转发任务消息。
 * @returns {void}
 */
export const handlePDFBridge = () => {
  if (window.top === window) return;

  const viewerFrames = () =>
    Array.from(document.querySelectorAll("iframe")).filter((frame) => {
      const url = new URL(frame.src, document.baseURI);
      return (
        url.hostname === "pan.mooc.ucas.edu.cn" &&
        url.pathname.startsWith("/screen/v2/file_")
      );
    });
  let startRequested = false;
  let viewerReady = false;
  /** @param {"start"} kind */
  const postToViewer = (kind) => {
    for (const frame of viewerFrames())
      frame.contentWindow?.postMessage(
        /** @type {PDFMessage} */ ({ channel: PDF_MESSAGE_CHANNEL, kind }),
        "*",
      );
  };
  /** @param {PDFMessage["kind"]} kind */
  const postToParent = (kind) =>
    window.parent.postMessage(
      /** @type {PDFMessage} */ ({ channel: PDF_MESSAGE_CHANNEL, kind }),
      "*",
    );
  /** @param {MessageEvent<PDFMessage>} event */
  const receive = (event) => {
    if (event.data?.channel !== PDF_MESSAGE_CHANNEL) return;
    if (event.source === window.parent && event.data.kind === "start") {
      console.info("[DEBUG-PDF] 中间页收到父页 start");
      startRequested = true;
      if (viewerReady) postToViewer("start");
      return;
    }
    if (!viewerFrames().some((frame) => frame.contentWindow === event.source))
      return;
    console.info("[DEBUG-PDF] 中间页收到阅读器消息", event.data.kind);
    if (event.data.kind === "ready") {
      viewerReady = true;
      postToParent("ready");
      if (startRequested) {
        console.info("[DEBUG-PDF] 中间页转发 start 给阅读器");
        postToViewer("start");
      }
    } else if (event.data.kind === "finished") {
      postToParent("finished");
    }
  };
  console.info("[DEBUG-PDF] 中间页桥接入口");
  window.addEventListener("message", receive, true);
  postToParent("ready");
  console.info("[DEBUG-PDF] 中间页发送 ready");
};

/**
 * 等待 PDF 框架并滚动到底部，完成标记由任务调度等待。
 * @param {Document} taskDoc PDF 任务点文档。
 * @returns {Promise<void>}
 */
export const handlePDF = async (taskDoc) => {
  console.info("开始处理PDF任务点");
  const pdfFrame = /** @type {HTMLIFrameElement|null} */ (
    await wait.element(
      null,
      SELECTORS.pdf.iframeId,
      taskDoc,
      "未找到 PDF 阅读器 iframe",
    )
  );
  console.info("[DEBUG-PDF] 父页获取 PDF iframe", {
    src: pdfFrame.src
      ? new URL(pdfFrame.src, taskDoc.baseURI).origin +
        new URL(pdfFrame.src, taskDoc.baseURI).pathname
      : "about:blank",
    sameOrigin: Boolean(pdfFrame.contentDocument),
  });
  if (!pdfFrame.contentDocument) {
    let finished = false;
    /** @param {MessageEvent<PDFMessage>} event */
    const receive = (event) => {
      if (
        event.source !== pdfFrame.contentWindow ||
        event.data?.channel !== PDF_MESSAGE_CHANNEL
      )
        return;
      console.info("[DEBUG-PDF] 父页收到阅读器消息", event.data.kind);
      if (event.data.kind === "ready") {
        pdfFrame.contentWindow?.postMessage(
          /** @type {PDFMessage} */ ({
            channel: PDF_MESSAGE_CHANNEL,
            kind: "start",
          }),
          "*",
        );
      }
      if (event.data.kind === "finished") finished = true;
    };
    window.addEventListener("message", receive, true);
    console.info("[DEBUG-PDF] 父页发送初始 start");
    pdfFrame.contentWindow?.postMessage(
      /** @type {PDFMessage} */ ({
        channel: PDF_MESSAGE_CHANNEL,
        kind: "start",
      }),
      "*",
    );
    try {
      await wait.until(() => finished, 10000);
      assert(finished, "等待 PDF 阅读器完成超时");
    } finally {
      window.removeEventListener("message", receive, true);
    }
    console.info("PDF任务点处理完成");
    return;
  }
  const pdfDoc = await wait.iframeDoc(
    null,
    SELECTORS.pdf.iframeId,
    taskDoc,
    "获取 PDF 框架文档超时",
  );
  assert(pdfDoc, "获取 PDF 框架文档超时");
  await scrollPDF(pdfDoc);
  console.info("PDF任务点处理完成");

  if (config.debugTaskTypes.includes("PDF")) {
    assert(
      await confirm(
        "[DEBUG] PDF 任务点自动滚动完成。点击 [确定] 继续，点击 [取消] 中断。",
      ),
      "调试中断：用户取消了 PDF 任务点",
    );
  }
};
