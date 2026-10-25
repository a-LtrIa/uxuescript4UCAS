import { config, cooldown } from "@injected/chaoxing/runtime.js";
import { wait } from "@injected/utils/async.js";
import { invoke, confirm } from "@injected/utils/backend.js";
import {
  extractPayload,
  classifyQuestion,
} from "@injected/chaoxing/questions/extract.js";
import { fillAnswer } from "@injected/chaoxing/questions/fill.js";
import { fillMatching } from "@injected/chaoxing/questions/matching.js";
import { QuestionType } from "@injected/chaoxing/questions/types.js";
import { SELECTORS } from "@injected/chaoxing/selectors.js";
const page =
  /** @type {Window & typeof globalThis & {saveWork(options: {silentSuccess: boolean, success(): void, failure(data: {msg: string}): void}): void}} */ (
    window
  );

/**
 * @param {Element[]} nodes
 * @param {import("./questions/extract.js").Question[]} questions
 * @param {import("../../src/services/cmds").AnswerItem[]} answers
 */
const applyAnswers = async (nodes, questions, answers) => {
  const byNumber = new Map(answers.map((answer) => [answer.index, answer]));

  for (const [index, node] of nodes.entries()) {
    const question = questions[index];
    const answer = byNumber.get(question.id);
    await cooldown();

    if (classifyQuestion(question.kind) === QuestionType.Matching)
      fillMatching(node, question.options, answer.content);
    else await fillAnswer(node, answer.content, SELECTORS.workExam);
  }
};

const saveWork = () =>
  new Promise((resolve, reject) => {
    page.saveWork({
      silentSuccess: true,
      success: () => resolve(undefined),
      failure: (data) => reject(new Error(data.msg)),
    });
  });

/**
 * 确认启动后提取整份作业、请求后端求解、填写并暂存，不自动提交。
 * @returns {Promise<void>}
 */
export const main = async () => {
  if (!invoke) {
    await confirm("未检测到后端，无法自动答题。");
    return;
  }
  try {
    config.switchingCd = (await invoke("options")).switchingCd ?? null;
    if (
      !(await confirm("是否开始作业答题？答案填写完成后将暂存，不会自动提交。"))
    )
      return;
    const form = await wait.element(null, SELECTORS.workExam.form, document);
    const nodes = await wait.elements(null, SELECTORS.workExam.question, form);
    const payload = extractPayload(document, nodes, SELECTORS.workExam);
    console.info(`开始处理作业，共 ${payload.questions.length} 道题`);
    const answers = await invoke("solve_questions", { payload });
    await applyAnswers(nodes, payload.questions, answers);
    await saveWork();
  } catch (error) {
    console.error("作业处理失败", error);
    await confirm(
      `作业处理失败：${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }
  await confirm("答案已填写并暂存，请自行提交。");
};
