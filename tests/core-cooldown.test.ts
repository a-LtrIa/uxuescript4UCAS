import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import coreScript from "../src-tauri/src/scripts/core.js?raw";

function setup(cd: number | null = null, random = 0.5) {
  const fetch = vi.fn();
  const setTimeout = vi.fn(window.setTimeout.bind(window));
  const context = {
    window: { confirm: vi.fn(), setTimeout },
    console: { info: vi.fn(), error: vi.fn() },
    Math: { random: () => random, floor: Math.floor },
    URL,
    fetch,
    api: null as any,
  };
  // Expose locals only in the test VM; the delivered script stays self-contained.
  runInNewContext(coreScript.replace("  main();", `
    config.switchingCd = ${cd};
    globalThis.api = { sleep, switchingCooldown, resolveInteractiveQuizAnswer };
  `), context);
  return { ...context.api, fetch, setTimeout };
}

const quiz = { options: [{ name: "A" }, { name: "B" }, { name: "C" }] };

afterEach(() => vi.useRealTimers());

describe("course cooldown", () => {
  it("does not schedule a timer when disabled", async () => {
    const api = setup();
    await api.switchingCooldown();
    expect(api.setTimeout).not.toHaveBeenCalled();
  });

  it.each([[0, 1500], [0.5, 2000], [1, 2500]])(
    "random value %s waits %s milliseconds", async (random, expected) => {
      vi.useFakeTimers();
      const api = setup(2, random);
      const waiting = api.switchingCooldown();
      expect(api.setTimeout).toHaveBeenCalledWith(expect.any(Function), expected);
      await vi.runAllTimersAsync();
      await waiting;
      const fixed = api.sleep(750);
      expect(api.setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 750);
      await vi.runAllTimersAsync();
      await fixed;
    },
  );

  it.each([null, 2])("validates serially and stops at the first match (CD %s)", async (cd) => {
    vi.useFakeTimers();
    const api = setup(cd);
    let respond!: (value: unknown) => void;
    api.fetch.mockImplementationOnce(() => new Promise((resolve) => { respond = resolve; }));
    api.fetch.mockResolvedValue({ ok: true, json: async () => ({ isRight: true }) });
    const answer = api.resolveInteractiveQuizAnswer("/validate", quiz, "https://example.com");
    await vi.runAllTimersAsync();
    expect(api.fetch).toHaveBeenCalledTimes(1);
    respond({ ok: true, json: async () => ({ isRight: false }) });
    await vi.runAllTimersAsync();
    await expect(answer).resolves.toBe("C");
    expect(api.fetch).toHaveBeenCalledTimes(2);
    expect(api.setTimeout).toHaveBeenCalledTimes(cd === null ? 0 : 2);
  });

  it("reports failure after exhausting candidates", async () => {
    const api = setup();
    api.fetch.mockResolvedValue({ ok: true, json: async () => ({ isRight: false }) });
    await expect(api.resolveInteractiveQuizAnswer("/validate", quiz, "https://example.com"))
      .rejects.toThrow("互动题验证未返回正确答案（候选数：3）");
    expect(api.fetch).toHaveBeenCalledTimes(3);
  });

  it("shuffles validation order while retaining every multiple-choice candidate", async () => {
    const api = setup(null, 0);
    const data = { ...quiz, questionType: "多选题" };
    const original = JSON.stringify(data);
    api.fetch.mockResolvedValue({ ok: true, json: async () => ({ isRight: false }) });
    await expect(api.resolveInteractiveQuizAnswer("/validate", data, "https://example.com"))
      .rejects.toThrow("候选数：7");
    const order = api.fetch.mock.calls.map(([url]: [string]) => new URL(url).searchParams.get("answerContent"));
    const candidates = ["A", "B", "A,B", "C", "A,C", "B,C", "A,B,C"];
    expect(order).not.toEqual(candidates);
    expect([...order].sort()).toEqual([...candidates].sort());
    expect(JSON.stringify(data)).toBe(original);
  });

  it("stops on a failed request", async () => {
    const api = setup();
    api.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(api.resolveInteractiveQuizAnswer("/validate", quiz, "https://example.com"))
      .rejects.toThrow("HTTP 500");
    expect(api.fetch).toHaveBeenCalledTimes(1);
  });
});
