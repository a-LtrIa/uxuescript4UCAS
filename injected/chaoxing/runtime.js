import { sleep } from "@injected/utils/async.js";

/** 当前脚本上下文共享的运行配置。 */
export const config = {
  muteVideo: true,

  /** @type {number | null} */
  lockSpeed: null,

  /** @type {number | null} */
  switchingCd: null,

  /**
   * 非空时只处理列出的附件类型，不受任务点标识或完成状态限制，也不等待任务点完成标记；处理后确认，异常时弹窗。
   * @type {Array<"Video" | "Audio" | "PDF" | "Other">}
   */
  debugTaskTypes: [],
};

/**
 * 按共享配置等待操作间隔；null 表示关闭，等待时间上下浮动 25%。
 * @returns {Promise<void>}
 */
export const cooldown = async () => {
  if (config.switchingCd != null) await sleep(config.switchingCd * 1000, 25);
};
