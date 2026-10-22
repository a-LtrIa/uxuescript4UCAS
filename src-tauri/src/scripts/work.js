// @ts-check
(() => {
  "use strict";

  /** @typedef {<T = any>(command: string, args?: Record<string, any>) => Promise<T>} Invoke */
  /** @typedef {{ isReady?: boolean | number, setContent: (html: string) => void }} Editor */
  /** @typedef {{ silentSuccess: boolean, success: () => void, failure: (data: { msg: string }) => void }} SaveOptions */
  /** @type {Window & {
   * __TAURI_INTERNALS__?: { invoke: Invoke },
   * UE?: { getEditor: (id: string) => Editor },
   * saveWork: (options: SaveOptions) => void
   * }} */
  const page = /** @type {any} */ (window);
  const tauriInvoke = page.__TAURI_INTERNALS__?.invoke;
  const confirm = tauriInvoke
    ? (/** @type {string} */ message) => tauriInvoke("confirm", { message })
    : window.confirm.bind(window);

  const SELECTORS = {
    form: "#submitForm",
    question: ".questionLi.singleQuesId",
    title: ".mark_name",
    typeLabel: ".colorShallow",
    option: ".stem_answer .answerBg",
    optionLabel: "span[data]",
    optionText: ".answer_p",
    selected: "span:is(.check_answer, .check_answer_dx)",
    textarea: 'textarea[id^="answer"]',
  };

  /** @type {(ms: number, fluctuationPercent?: number) => Promise<void>} */
  const sleep = (ms, fluctuationPercent = 0) =>
    new Promise((resolve) =>
      window.setTimeout(
        resolve,
        ms * (1 + ((Math.random() * 2 - 1) * fluctuationPercent) / 100),
      ),
    );

  /** @type {(condition: any, message: string) => asserts condition} */
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  class AppConfig {
    /** @type {number | null} */
    switchingCd = null;

    /** @param {NonNullable<typeof tauriInvoke>} invoke */
    async loadFromBackend(invoke) {
      const res = await invoke("options");
      this.switchingCd = res.switchingCd ?? null;
    }
  }
  const config = new AppConfig();

  const switchingCooldown = async () => {
    if (config.switchingCd == null) return;
    await sleep(config.switchingCd * 1000, 25);
  };

  const wait = {
    /** @type {<T>(getter: () => T, timeout?: number, interval?: number) => Promise<T | null>} */
    until: async (getter, timeout = 5000, interval = 250) => {
      const start = performance.now();
      while (performance.now() - start < timeout) {
        const value = await getter();
        if (value) return value;
        await sleep(interval);
      }
      return null;
    },

    /** @type {(selector: string, root: ParentNode) => Promise<HTMLElement[]>} */
    elements: async (selector, root) => {
      const nodes = await wait.until(() => {
        const list = Array.from(root.querySelectorAll(selector));
        return list.length ? list : null;
      });
      assert(nodes?.length, `等待 DOM 元素列表 [${selector}] 超时`);
      return /** @type {HTMLElement[]} */ (nodes);
    },

    /** @type {(selector: string, root: ParentNode) => Promise<HTMLElement>} */
    element: async (selector, root) => {
      const node = await wait.until(() => root.querySelector(selector));
      assert(node, `等待 DOM 节点 [${selector}] 超时`);
      return /** @type {HTMLElement} */ (node);
    },
  };

  /** @typedef {{ 题号: string, 题型: string, 题干: string, 选项: string[] }} Question */
  /** @typedef {{ index: string, content: string }} Answer */

  /** @type {(node: HTMLElement) => Question} */
  const extractQuestion = (node) => {
    const id = /** @type {string} */ (node.getAttribute("data"));
    const kind = /** @type {string} */ (node.getAttribute("typename"));
    const titleNode = /** @type {HTMLElement} */ (
      node.querySelector(SELECTORS.title)
    );
    const title = /** @type {HTMLElement} */ (titleNode.cloneNode(true));
    title.querySelector(SELECTORS.typeLabel)?.remove();
    return {
      题号: id,
      题型: kind,
      题干: (title.textContent ?? "")
        .replace(/^\s*\d+\s*[.．、]\s*/, "")
        .trim(),
      选项: Array.from(
        node.querySelectorAll(SELECTORS.option),
        (option) =>
          `${option.querySelector(SELECTORS.optionLabel)?.getAttribute("data")} ${option.querySelector(SELECTORS.optionText)?.textContent?.trim()}`,
      ),
    };
  };

  /** @type {(node: HTMLElement, content: string) => void} */
  const fillSingle = (node, content) => {
    const value = String(content).trim();
    const option = /** @type {HTMLElement} */ (
      node.querySelector(`span.num_option[data="${value}"]`)
    );
    option.click();
  };

  /** @type {(node: HTMLElement, content: string) => void} */
  const fillMulti = (node, content) => {
    const values = /** @type {string[]} */ (
      String(content).match(/[A-Z0-9]/gi)
    );
    for (const value of values) {
      const option = /** @type {HTMLElement} */ (
        node.querySelector(`span.num_option_dx[data="${value}"]`)
      );
      option.click();
    }
  };

  /** @type {(node: HTMLElement, content: string) => Promise<void>} */
  const fillShort = async (node, content) => {
    const value = String(content).trim();
    const textarea = await wait.element(SELECTORS.textarea, node);
    const editor = await wait.until(() => {
      if (typeof page.UE?.getEditor !== "function") return null;
      const instance = page.UE.getEditor(textarea.id);
      return instance?.isReady ? instance : null;
    });
    assert(editor, "简答题 UEditor 编辑器未就绪");
    editor.setContent(value);
  };

  /** @type {(nodes: HTMLElement[], answers: Answer[]) => Promise<void>} */
  const applyAnswers = async (nodes, answers) => {
    const byId = new Map(answers.map((answer) => [answer.index, answer]));
    const fillers = {
      单选题: fillSingle,
      多选题: fillMulti,
      简答题: fillShort,
    };
    for (const node of nodes) {
      const answer = /** @type {Answer} */ (
        byId.get(/** @type {string} */ (node.getAttribute("data")))
      );
      await switchingCooldown();
      for (const selected of node.querySelectorAll(SELECTORS.selected)) {
        /** @type {HTMLElement} */ (selected).click();
      }
      const kind = /** @type {keyof typeof fillers} */ (
        node.getAttribute("typename")
      );
      await fillers[kind](node, answer.content);
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

  const main = async () => {
    if (!tauriInvoke) {
      await confirm("未检测到后端，无法自动答题。");
      return;
    }
    try {
      await config.loadFromBackend(tauriInvoke);
      if (
        !(await confirm(
          "是否开始作业答题？答案填写完成后将暂存，不会自动提交。",
        ))
      )
        return;
      const form = await wait.element(SELECTORS.form, document);
      const nodes = await wait.elements(SELECTORS.question, form);
      const questions = nodes.map(extractQuestion);
      console.info(`开始处理作业，共 ${questions.length} 道题`);
      const answers = await tauriInvoke("solve_homework", { questions });
      await applyAnswers(nodes, answers);
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

  main();
})();
