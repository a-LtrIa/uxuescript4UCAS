import { config } from "@injected/chaoxing/runtime.js";
import { confirm } from "@injected/utils/confirm.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";
import { chapterNodeStatus } from "./chapters.js";

const noop = async () => {};

/** 课程进度在当前独立脚本中只用于保持章节处理流程一致。 */
export const emit = {
  started: noop,

  /** @type {(index: number, node: Element, list: Element[]) => Promise<void>} */
  chapterProgress: async (index, node, list) => {
    const title =
      node.querySelector(SELECTORS.courseTree.nameClass)?.textContent?.trim() ||
      node.textContent?.trim() ||
      `章节 ${index + 1}`;
    const total = list.length;
    const completed = list.filter(
      (node) => chapterNodeStatus(node) === "Finished",
    ).length;
    console.info(`章节进度：${title} (${completed}/${total})`);
  },

  /** @type {(index: number, total: number) => Promise<void>} */
  tabProgress: async (index, total) => {
    console.info(`页签进度：${index + 1}/${total}`);
  },

  /** @type {(index: number, category: string) => Promise<void>} */
  taskProgress: async (index, category) => {
    console.info(`任务点进度：${index + 1}，类别：${category}`);
  },

  cancelled: noop,

  finished: noop,
};

/**
 * 记录操作错误；普通模式跳过，调试模式由用户选择继续或终止。
 * @param {() => Promise<unknown>} action 要执行的操作。
 * @param {string} errorMessage 操作失败时的业务说明。
 * @returns {Promise<void>}
 */
export const safeRun = async (action, errorMessage) => {
  try {
    await action();
  } catch (e) {
    console.error(errorMessage, e);
    if (config.debugTaskTypes.length) {
      const msg = `[DEBUG 异常]\n提示: ${errorMessage}\n详情: ${e instanceof Error ? e.message : String(e)}\n\n确定：忽略并继续；取消：终止。`;
      if (!(await confirm(msg))) throw e;
    }
  }
};
