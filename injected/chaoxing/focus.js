/**
 * 在当前页面安装焦点与可见性适配，清理相关内联监听并拦截失焦事件传播。
 * @returns {void}
 */
export const preserveFocusState = () => {
  const blockedEvents = [
    "blur",
    "focusout",
    "mouseleave",
    "mouseout",
    "pagehide",
    "visibilitychange",
  ];

  // 1. 清理已有内联监听属性 (DOM Level 0)
  for (const evt of blockedEvents) {
    try {
      /** @type {Window & typeof globalThis & Record<`on${string}`, unknown>} */ (
        window
      )[`on${evt}`] = null;
      /** @type {Document & Record<`on${string}`, unknown>} */ (document)[
        `on${evt}`
      ] = null;
    } catch (e) {
      console.error(`清理 ${evt} 事件监听失败:`, e);
    }
  }

  // 2. 捕获阶段强行掐断事件

  /** @param {Event} e */
  const stopPropagation = (e) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
  };

  for (const evt of blockedEvents) {
    window.addEventListener(evt, stopPropagation, true);
    document.addEventListener(evt, stopPropagation, true);
  }

  // 3. 拦截后续动态 addEventListener
  const originalAdd = window.EventTarget.prototype.addEventListener;
  window.EventTarget.prototype.addEventListener =
    /** @type {EventTarget["addEventListener"]} */ (
      function (type, listener, options) {
        if (blockedEvents.includes(type)) return;
        return originalAdd.call(this, type, listener, options);
      }
    );

  // 4. 伪造 Page Visibility 与 Focus API
  try {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(document, "visibilityState", {
      get: () => "visible",
      configurable: true,
    });
    document.hasFocus = () => true;
  } catch (e) {
    console.error("伪造 Page Visibility 与 Focus API 失败:", e);
  }
};
