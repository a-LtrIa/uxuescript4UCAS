import { config } from "@injected/chaoxing/runtime.js";
import { confirm } from "@injected/utils/backend.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";
import { wait, sleep, assert } from "@injected/utils/async.js";

/**
 * 等待 PDF 框架并滚动到底部，完成标记由任务调度等待。
 * @param {Document} taskDoc PDF 任务点文档。
 * @returns {Promise<void>}
 */
export const handlePDF = async (taskDoc) => {
  console.info("开始处理PDF任务点");
  const pdfDoc = await wait.iframeDoc(
    null,
    SELECTORS.pdf.iframeId,
    taskDoc,
    "获取 PDF 框架文档超时",
  );
  const container = pdfDoc.documentElement;
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

  if (!isScrolled) throw new Error("多次尝试后 PDF 仍未滚动");
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
