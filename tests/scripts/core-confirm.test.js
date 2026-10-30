import { afterEach, expect, it, vi } from "vitest";

vi.mock("@injected/chaoxing/focus.js", () => ({
  preserveFocusState: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

/** @param {boolean} accepted */
async function setup(accepted) {
  vi.resetModules();
  document.body.innerHTML = "";
  const nativeConfirm = vi.spyOn(window, "confirm").mockReturnValue(accepted);
  vi.spyOn(console, "info").mockImplementation(() => {});
  const { main } = await import("@injected/chaoxing/course.js");
  return { run: main(), nativeConfirm };
}

it("asks with the native confirmation dialog before starting", async () => {
  const page = await setup(false);
  await page.run;
  expect(page.nativeConfirm).toHaveBeenCalledOnce();
  expect(page.nativeConfirm).toHaveBeenCalledWith(
    expect.stringContaining("是否确认开始运行"),
  );
  expect(window.confirm).toBe(page.nativeConfirm);
});

it("returns when the user cancels", async () => {
  const page = await setup(false);
  await page.run;
  expect(page.nativeConfirm).toHaveBeenCalledOnce();
});
