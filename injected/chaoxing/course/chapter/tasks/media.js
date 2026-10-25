/** 设置媒体元素静音。
 * @param {HTMLMediaElement} videoEl 音视频元素。
 * @returns {void}
 */
export const muteVideo = (videoEl) => {
  if (!videoEl) return;
  videoEl.muted = true;
  videoEl.defaultMuted = true;
};

/** 设置并锁定媒体播放倍速。
 * @param {HTMLMediaElement} videoEl 音视频元素。
 * @param {number} targetRate 目标倍速。
 * @returns {void}
 */
export const applySpeed = (videoEl, targetRate) => {
  videoEl.playbackRate = targetRate;
  Object.defineProperty(videoEl, "playbackRate", {
    get: () => targetRate,
    set: () => {},
    configurable: true,
  });
};
