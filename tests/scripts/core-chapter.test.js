import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@injected/chaoxing/course/chapter/tasks.js", () => ({
  handleTab: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("UCAS chapter handling", () => {
  it("processes the chapter frame directly when no tabs exist", async () => {
    vi.stubGlobal("location", { hostname: "mooc.mooc.ucas.edu.cn" });
    vi.resetModules();
    const { emit } = await import("@injected/chaoxing/course/runtime.js");
    const { handleTab } =
      await import("@injected/chaoxing/course/chapter/tasks.js");
    const { wait } = await import("@injected/utils/async.js");
    const { handleChapter } =
      await import("@injected/chaoxing/course/chapter.js");
    vi.spyOn(emit, "tabProgress").mockResolvedValue(undefined);
    const chapterDoc = document.implementation.createHTMLDocument();
    const node = document.createElement("div");
    node.innerHTML = '<span class="posCatalog_name">Unit introduction</span>';
    document.body.appendChild(node);
    const iframeDoc = vi
      .spyOn(wait, "iframeDoc")
      .mockImplementation(async (action) => {
        action?.();
        return chapterDoc;
      });

    await handleChapter(node);

    expect(iframeDoc).toHaveBeenCalledWith(
      expect.any(Function),
      "#iframe",
      document,
      "获取国科大章节主框架超时",
    );
    expect(handleTab).toHaveBeenCalledTimes(1);
    expect(handleTab).toHaveBeenCalledWith(chapterDoc);
    expect(emit.tabProgress).toHaveBeenCalledWith(0, 1);
  });
});
