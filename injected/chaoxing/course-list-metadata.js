import { invoke } from "@injected/utils/backend.js";
const channel = "uxue-course-list-metadata";
/**
 * @param {string} origin
 */
const isChaoxing = (origin) =>
  /^https:\/\/(?:[^./]+\.)*chaoxing\.com$/.test(origin);

/**
 * 按原有字段规则过滤课程元数据，再发送给桌面端保存。
 * @param {{courseId: string, metadata: {title: string, cover: string}}[]} courses 课程列表。
 * @returns {void}
 */
const save = (courses) => {
  for (const { courseId, metadata } of courses) {
    if (
      typeof courseId !== "string" ||
      !/^\d+$/.test(courseId) ||
      typeof metadata?.title !== "string" ||
      !metadata.title ||
      typeof metadata?.cover !== "string" ||
      !metadata.cover
    )
      continue;

    invoke("insert_course_meta_map", {
      courseId,
      metadata: { title: metadata.title, cover: metadata.cover },
    }).catch((error) => console.error("保存课程元数据失败:", error));
  }
};

/**
 * 在顶层窗口处理采集握手和结果消息，沿用原有来源校验。
 * @param {MessageEvent} event 子框架消息。
 * @returns {void}
 */
const receiveCourses = (event) => {
  const data = event.data;
  if (
    data?.channel !== channel ||
    !event.source ||
    event.source === window ||
    !isChaoxing(event.origin)
  )
    return;

  if (data.kind === "ready") {
    /** @type {Window} */ (event.source).postMessage(
      { channel, kind: "collect" },
      event.origin,
    );
  } else if (data.kind === "courses" && Array.isArray(data.courses)) {
    save(data.courses);
  }
};

/**
 * 启动列表发现与增量采集；去重记录及观察器只属于本次采集。
 * @param {string|undefined} topOrigin 子框架获得授权的顶层来源；顶层页面不使用。
 * @returns {void}
 */
const collectCourseMetadata = (topOrigin) => {
  const sent = new Map();
  /** @type {Element | undefined} */
  let region;
  const scan = () => {
    const courses = [];
    const list = region.matches("#courseList")
      ? region
      : region.querySelector("#courseList");
    if (!list) return;
    for (const node of list.querySelectorAll(".course")) {
      const courseId = /** @type {HTMLInputElement|null} */ (
        node.querySelector("input.courseId")
      )?.value;
      const title = node.querySelector(".course-name")?.textContent.trim();
      const cover = /** @type {HTMLImageElement|null} */ (
        node.querySelector(".course-cover img")
      )?.src.replace(/\/star3\/.*?\//, "/star3/origin/");
      if (!courseId || !title || !cover) continue;

      const previous = sent.get(courseId);
      if (previous?.title === title && previous.cover === cover) continue;
      const metadata = { title, cover };
      sent.set(courseId, metadata);
      courses.push({ courseId, metadata });
    }
    if (courses.length) {
      if (window === window.top) save(courses);
      else
        window.top.postMessage(
          { channel, kind: "courses", courses },
          topOrigin,
        );
    }
  };

  const observer = new MutationObserver(scan);
  const discover = () => {
    const next =
      document.querySelector(".course-list-con") ||
      document.querySelector("#courseList");
    if (next === region) return;
    observer.disconnect();
    region = next;
    if (!region) return;
    scan();
    // AJAX 填充、搜索及文件夹切换会修改列表内容，只在课程区域详细监听。
    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["src", "value"],
    });
  };

  // 容器可能延迟插入或整体替换；无关节点变化不触发全页查找和课程扫描。
  const discovery = new MutationObserver((records) => {
    if (region && !region.isConnected) {
      discover();
      return;
    }
    for (const record of records) {
      if (region?.contains(record.target)) continue;
      for (const node of record.addedNodes) {
        const element = /** @type {Element} */ (node);
        if (
          node.nodeType === 1 &&
          (element.matches(".course-list-con, #courseList") ||
            element.querySelector(".course-list-con, #courseList"))
        ) {
          discover();
          return;
        }
      }
    }
  });
  discovery.observe(document.body, { childList: true, subtree: true });
  discover();
};

/**
 * 在超星页面采集课程名称和封面，通过主窗口向 Tauri 保存课程元数据。
 * @returns {void}
 */
export function main() {
  if (!isChaoxing(window.location.origin)) return;
  if (window === window.top) window.addEventListener("message", receiveCourses);

  /** @type {string | undefined} */
  let topOrigin;
  const collect = () => collectCourseMetadata(topOrigin);
  const start = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", collect, { once: true });
    } else {
      collect();
    }
  };

  if (window === window.top) {
    start();
    return;
  }

  /** @param {MessageEvent} event */
  const authorize = (event) => {
    if (
      event.source !== window.top ||
      !isChaoxing(event.origin) ||
      event.data?.channel !== channel ||
      event.data.kind !== "collect"
    )
      return;

    window.removeEventListener("message", authorize);
    topOrigin = event.origin;
    start();
  };
  window.addEventListener("message", authorize);
  // 跨域 iframe 无法读取 top.location，由超星顶层页面授权后才采集。
  window.top.postMessage({ channel, kind: "ready" }, "*");
}
