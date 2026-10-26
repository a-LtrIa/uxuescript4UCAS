import { config } from "@injected/chaoxing/runtime.js";
import { emit, safeRun } from "@injected/chaoxing/course/runtime.js";
import { confirm } from "@injected/utils/backend.js";
import {
  totalChapterList,
  handleCourse,
} from "@injected/chaoxing/course/chapters.js";
import { preserveFocusState } from "@injected/chaoxing/focus.js";

/**
 * 加载配置并确认启动，依次处理课程章节，最后报告完成。
 * @returns {Promise<void>}
 */
export const main = async () => {
  await config.loadFromBackend();

  const speedInfo =
    config.lockSpeed != null ? `${config.lockSpeed}x (已锁定)` : "不锁定";
  const cdInfo =
    config.switchingCd != null ? `${config.switchingCd}秒 (±25%)` : "已关闭";
  const configSummary = `当前配置：[视频倍速: ${speedInfo} | 切换 CD: ${cdInfo} | 自动静音: ${config.muteVideo ? "已开启" : "已关闭"}]`;

  const isConfirmed = await confirm(
    `[使用须知与运行指南]
1. 免责声明：本脚本仅供自动化测试与学习交流使用，请遵守相关法律法规及平台规定。
2. 前置准备：建议关闭浏览器开发者工具(DevTools)，避免触发调试拦截。
3. ${configSummary}
4. 含图片的题目需要当前模型支持视觉输入；否则图片可能被忽略，答案可能不准确。

[操作说明]
• 点击“确定”：立即启动自动化流程。
• 点击“取消”：放弃并退出脚本运行。
• 紧急停止：运行过程中按 F5 刷新页面即可终止脚本。

是否确认开始运行？`,
  );
  if (!isConfirmed) {
    console.info("用户已取消脚本运行");
    await emit.cancelled();
    return;
  }
  preserveFocusState();

  await emit.started();
  await safeRun(() => handleCourse(totalChapterList()), "课程处理失败");
  await emit.finished();
};
