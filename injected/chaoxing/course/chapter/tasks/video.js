import { config } from "@injected/chaoxing/runtime.js";
import { confirm } from "@injected/utils/backend.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";
import { handleInteractiveQuiz } from "./interactive.js";
import { muteVideo, applySpeed } from "./media.js";
import { wait, sleep, assert } from "@injected/utils/async.js";

/**
 * 启动视频，应用静音和倍速配置，并处理视频互动题。
 * @param {Document} taskDoc 视频任务点文档。
 * @returns {Promise<void>}
 */
export const handleVideo = async (taskDoc) => {
  console.info("开始处理Video任务点");
  const launchBtn = await wait.element(
    null,
    SELECTORS.video.launchBtnClass,
    taskDoc,
    "未找到视频播放按钮",
  );
  const videoEl = /** @type {HTMLVideoElement} */ (
    await wait.element(null, SELECTORS.video.tag, taskDoc, "未找到视频播放控件")
  );
  if (config.muteVideo) muteVideo(videoEl);

  const isStarted = await wait.until(() => {
    if (videoEl?.currentTime > 0 && !videoEl.paused) return true;
    launchBtn.click();
    return null;
  });
  if (!isStarted) throw new Error("视频多次尝试无法启动播放");

  if (config.lockSpeed != null) applySpeed(videoEl, config.lockSpeed);
  await handleInteractiveQuiz(taskDoc, videoEl);
  console.info("Video任务点处理完成");

  if (config.debugTaskTypes.includes("Video")) {
    await sleep(5000);
    assert(
      await confirm(
        "[DEBUG] Video 任务点处理完成。点击 [确定] 继续，点击 [取消] 中断。",
      ),
      "调试中断：用户取消了 Video 任务点",
    );
  }
};
