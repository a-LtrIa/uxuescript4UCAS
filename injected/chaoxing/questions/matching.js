import { assert } from "@injected/utils/async.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";

/**
 * @param {Element} node
 */
const readGroups = (node) =>
  SELECTORS.workExam.matching.groups.map((selector) =>
    Array.from(node.querySelectorAll(selector), (item) => {
      const label = item.querySelector(SELECTORS.workExam.optionLabel);
      return {
        label: label.textContent.trim().replace(/[.．、]$/, ""),
        value: label.getAttribute("data"),
        text: item
          .querySelector(SELECTORS.workExam.matching.text)
          .textContent.trim(),
      };
    }),
  );

/**
 * 按两组的显示顺序提取“第N组 标识 文字”，不向后端暴露内部 data 值。
 * @param {Element} node 连线题容器。
 * @returns {string[]}
 */
export const extractMatchingOptions = (node) =>
  readGroups(node).flatMap((group, index) =>
    group.map((item) => `第${index + 1}组 ${item.label} ${item.text}`),
  );

/**
 * 将采集时的显示配对映射到当前 DOM，点击下拉选项；支持两遍之间重新排序。
 * @param {Element} node 当前连线题容器。
 * @param {string[]} options 采集时的选项文字与显示标识。
 * @param {string} content `1:G;2:A` 格式的配对。
 * @returns {void}
 */
export const fillMatching = (node, options, content) => {
  const currentGroups = readGroups(node);
  const originalGroups = [new Map(), new Map()];
  for (const option of options) {
    const [, group, label, text] = option.match(/^第([12])组 (\S+) ([\s\S]*)$/);
    // 第二遍可能重新排列选项，用采集时的文字找到当前页面的内部标识。
    const item = currentGroups[Number(group) - 1].find(
      (item) => item.text === text,
    );
    originalGroups[Number(group) - 1].set(label, item.value);
  }

  for (const pair of content.split(";")) {
    const [left, right] = pair.split(":").map((part) => part.trim());
    const leftValue = originalGroups[0].get(left);
    const rightValue = originalGroups[1].get(right);
    const row = /** @type {HTMLElement|null} */ (
      node.querySelector(SELECTORS.workExam.matching.row(leftValue))
    );
    const option = /** @type {HTMLAnchorElement|null} */ (
      row?.querySelector(SELECTORS.workExam.matching.option(rightValue))
    );
    assert(option, `连线题未找到配对 ${left}:${right} 对应的选项`);
    /** @type {HTMLElement} */ (
      row.querySelector(SELECTORS.workExam.matching.dropdown)
    ).click();
    option.click();
  }
};
