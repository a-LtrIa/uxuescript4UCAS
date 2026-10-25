import { assert } from "@injected/utils/async.js";
import { extractMatchingOptions } from "./matching.js";
import { QuestionType } from "./types.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";

/**
 * 发送给答题后端的题目，不包含平台内部 ID。
 * @typedef {Object} Question
 * @property {string} id 页面显示题号。
 * @property {string} kind 页面题型名称。
 * @property {string} stem 去除题号和分值后的题目文字。
 * @property {string[]} options 显示标识与选项文字；无选项的题型为空数组。
 */

/**
 * 统一求解请求；字体只用于后端字形解密，不进入模型输入。
 * @typedef {Object} QuestionPayload
 * @property {Question[]} questions 当前页面或汇总后的题目列表。
 * @property {number[]|null} font 内嵌字体字节；没有加密字体时为 null。
 */

/**
 * 单道题提取所需的页面定位规则。
 * @typedef {Object} ExtractionSelectors
 * @property {string} number 显示题号。
 * @property {string} kind 题型名称。
 * @property {string} title 题干容器。
 * @property {string} titleMeta 题干中需要移除的题型及分值。
 * @property {string} optionLabel 选项标识。
 * @property {{options: string, text: string}} choice 选项容器及文字。
 */

/**
 * @param {Node} node
 */
const text = (node) => node.textContent.replace(/\s+/g, " ").trim();

/**
 * 从页面题型文字识别处理类别。
 * @param {string} titleText
 */
export const classifyQuestion = (titleText) => {
  if (titleText.includes("多选")) return QuestionType.MultipleChoice;
  if (titleText.includes("判断")) return QuestionType.Judgment;
  if (titleText.includes("单选")) return QuestionType.SingleChoice;
  if (titleText.includes("填空")) return QuestionType.Completion;
  if (titleText.includes("简答")) return QuestionType.ShortAnswer;
  if (titleText.includes("计算")) return QuestionType.ShortAnswer;
  if (titleText.includes("连线")) return QuestionType.Matching;
  return QuestionType.Other;
};

/**
 * @param {Element} node
 * @param {ExtractionSelectors["choice"]} choice
 * @param {(option: Element, index: number) => string} labelFor
 */
const readChoices = (node, choice, labelFor) =>
  Array.from(node.querySelectorAll(choice.options), (option, index) => {
    const label = labelFor(option, index);
    return `${label} ${text(option.querySelector(choice.text))}`;
  });

/**
 * @param {Element} node
 * @param {ExtractionSelectors} selectors
 */
const extractChoiceOptions = (node, selectors) =>
  readChoices(node, selectors.choice, (option) =>
    option.querySelector(selectors.optionLabel).getAttribute("data"),
  );

/**
 * @param {Element} node
 * @param {ExtractionSelectors} selectors
 */
const extractJudgeOptions = (node, selectors) =>
  readChoices(node, selectors.choice, (_option, index) =>
    String.fromCharCode(65 + index),
  );

/** @type {Partial<Record<ReturnType<typeof classifyQuestion>, (node: Element, selectors: ExtractionSelectors) => string[]>>} */
const optionExtractors = {
  [QuestionType.SingleChoice]: extractChoiceOptions,
  [QuestionType.MultipleChoice]: extractChoiceOptions,
  [QuestionType.Judgment]: extractJudgeOptions,
  [QuestionType.Matching]: extractMatchingOptions,
};

/**
 * 按页面选择器提取单道题，不修改原 DOM，也不处理分页。
 * @param {Element} node 单道题容器。
 * @param {ExtractionSelectors} selectors 页面定位规则。
 * @returns {Question}
 */
export const extractQuestion = (node, selectors) => {
  const kind = text(node.querySelector(selectors.kind)).match(
    /[\u4e00-\u9fff]+题/,
  )[0];
  const title = /** @type {Element|null} */ (
    node.querySelector(selectors.title)?.cloneNode(true)
  );
  assert(title, "未找到题干");
  title.querySelector(selectors.titleMeta)?.remove();
  const number = text(node.querySelector(selectors.number)).match(/^(\d+)/)[1];
  return {
    id: number,
    kind: kind,
    stem: text(title).replace(/^\d+\s*[.．、]\s*/, ""),
    options: optionExtractors[classifyQuestion(kind)]?.(node, selectors) ?? [],
  };
};

/**
 * 读取页面中 font-cxsecret 的内嵌字体，保持原字体字节供后端解密。
 * @param {Document} document 题目所属文档。
 * @returns {number[]|null}
 */
export const extractFont = (document) => {
  const styles = Array.from(
    document.querySelectorAll(SELECTORS.workExam.fontStyles),
    (style) => style.textContent,
  ).join("\n");
  const match = styles.match(
    /@font-face\s*\{[^}]*font-family\s*:\s*['"]font-cxsecret['"][^}]*src\s*:\s*url\(\s*['"]data:application\/font-ttf[^,]*,([^'")]+)['"]\s*\)/,
  );
  return match
    ? Array.from(atob(match[1]), (character) => character.charCodeAt(0))
    : null;
};

/**
 * 将已取得的题目容器和页面字体组成统一请求，整页及逐页采集均可使用。
 * @param {Document} document 题目所属文档。
 * @param {Iterable<Element>} nodes 已取得的题目容器，避免重复查询页面。
 * @param {ExtractionSelectors} selectors 题目内部各字段的 CSS 选择器。
 * @returns {QuestionPayload}
 */
export const extractPayload = (document, nodes, selectors) => ({
  questions: Array.from(nodes, (node) => extractQuestion(node, selectors)),
  font: extractFont(document),
});
