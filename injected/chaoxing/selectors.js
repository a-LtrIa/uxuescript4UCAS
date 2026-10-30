/** 超星课程处理使用的 DOM 与 URL 选择器。 */
export const SELECTORS = {
  courseTree: {
    nodeClass: "div.posCatalog_select",
    nameClass: "span.posCatalog_name",
    titleSelector: ":has(span.posCatalog_title)",
    unfinishedSelector: ":has(.orangeNew)",
  },
  chapter: { tabClass: "div.prev_white" },
  video: {
    tag: "video",
    launchBtnClass: ".vjs-big-play-button",
    timelineClass: ".ans-timelineobjects",
    annotationContinueClass: ".ans-videoannotation .continueLearn",
    quizClass: ".ans-videoquiz",
    quizItemClass: ".tkItem",
    quizTitleClass: ".tkItem_title",
    quizOptionClass: ".ans-videoquiz-opt",
    quizSubmitId: "#videoquiz-submit",
    quizContinueId: "#videoquiz-continue",
  },
  audio: {
    tag: "#audio audio.vjs-tech",
    launchBtnClass: "#audio .vjs-play-control",
  },
  pdf: { iframeId: "#panView" },
  taskPoint: {
    finishedClass: "ans-job-finished",
    containerSelector: ".ans-attach-ct:has(.ans-job-icon)",
    attachmentSelector: ".ans-attach-ct:has(iframe)",
    iframeTag: "iframe",
  },
  frames: {
    blankUrl: "about:blank",
    chapterFrameId: "#iframe",
  },
  urls: {
    video: "/ananas/modules/video/",
    audio: "/ananas/modules/audio/",
    pdf: "/ananas/modules/pdf/",
  },
};
