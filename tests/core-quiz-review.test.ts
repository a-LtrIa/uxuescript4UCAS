import { runInNewContext } from "node:vm";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import coreScript from "../src-tauri/src/scripts/core.js?raw";

async function setup(enabled: boolean, confirm: ReturnType<typeof vi.fn<(message?: string) => unknown>>) {
  const submit = vi.fn();
  const setTimeout = vi.fn(window.setTimeout.bind(window));
  const invoke = vi.fn(async (command: string, args?: { message: string }) => {
    if (command === "options") return { quizReview: enabled };
    if (command === "solve_quiz") return [];
    if (command === "confirm") return confirm(args?.message);
  });
  const context = {
    window: { __TAURI_INTERNALS__: { invoke }, setTimeout },
    document: {},
    console: { info: vi.fn(), error: vi.fn() },
    api: null as any,
  };
  runInNewContext(coreScript.replace("  main();", "globalThis.api = { config, wait, handleQuiz };"), context);
  const { config, wait, handleQuiz } = context.api;
  await config.loadFromBackend();
  config.debugTaskTypes = [];
  wait.iframeDoc = vi.fn(async () => ({ documentElement: { outerHTML: "test quiz" } }));
  wait.elements = vi.fn(async () => []);
  wait.element = vi.fn(async (_action, selector) => selector === "a.btnSubmit" ? { click: submit } : {});
  wait.until = vi.fn(async () => true);
  return { run: () => handleQuiz({}), submit, confirm, setTimeout, invoke };
}

afterEach(() => vi.useRealTimers());

describe("manual quiz review", () => {
  it("submits without prompting or waiting when disabled", async () => {
    const page = await setup(false, vi.fn());
    await page.run();
    expect(page.confirm).not.toHaveBeenCalled();
    expect(page.setTimeout).not.toHaveBeenCalled();
    expect(page.submit).toHaveBeenCalledOnce();
  });

  it("waits for Yes before submitting and explains both choices and how to stop", async () => {
    let choose!: (value: boolean) => void;
    const page = await setup(true, vi.fn(() => new Promise<boolean>((resolve) => { choose = resolve; })));
    const run = page.run();
    await flushPromises();
    expect(page.submit).not.toHaveBeenCalled();
    expect(page.confirm).toHaveBeenCalledWith(expect.stringContaining("Yes：立即提交"));
    const message = page.confirm.mock.calls[0][0];
    expect(message).toContain("No：暂不提交");
    expect(message).toContain("30 秒");
    expect(message).toContain("刷新按钮或 Home");
    choose(true);
    await run;
    expect(page.submit).toHaveBeenCalledOnce();
    expect(page.setTimeout).not.toHaveBeenCalled();
  });

  it("allows repeated 30-second reviews without submitting until Yes", async () => {
    vi.useFakeTimers();
    const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
    const page = await setup(true, confirm);
    const run = page.run();
    await flushPromises();
    expect(confirm).toHaveBeenCalledOnce();
    expect(page.submit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(29999);
    expect(confirm).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(page.submit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30000);
    await run;
    expect(confirm).toHaveBeenCalledTimes(3);
    expect(page.setTimeout).toHaveBeenCalledTimes(2);
    expect(page.setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 30000);
    expect(page.submit).toHaveBeenCalledOnce();
  });
});
