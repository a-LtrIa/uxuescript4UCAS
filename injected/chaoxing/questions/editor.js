import { wait, assert } from "@injected/utils/async.js";

/**
 * 等待页面已有的 UEditor 就绪后写入内容；超时抛出错误。
 * @param {HTMLTextAreaElement} textarea 编辑器对应的 textarea。
 * @param {string} content 要填写的内容。
 * @returns {Promise<void>}
 */
export async function fillEditor(textarea, content) {
  const page =
    /** @type {Window & {UE?: {getEditor(id: string): {isReady: boolean, setContent(content: string): void} | undefined}}} */ (
      textarea.ownerDocument.defaultView
    );
  const editor = await wait.until(() => {
    const instance = page.UE?.getEditor(textarea.id);
    return instance?.isReady ? instance : null;
  });
  assert(editor, `UEditor 编辑器未就绪: ${textarea.id}`);
  editor.setContent(content);
}
