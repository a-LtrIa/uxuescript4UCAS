import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TheInfoPanel from "@/components/TheInfoPanel.vue";
import TheCourseDashboard from "@/components/TheCourseDashboard.vue";
import TheThemePanel from "@/components/TheConfigPanel/TheThemePanel.vue";
import { label, loadLabelLanguage, setLabelLanguage } from "@/labels";
import type { CourseStatus } from "@/services/cmds";

const mocks = vi.hoisted(() => ({
  listen: vi.fn(), emitTo: vi.fn(), setTheme: vi.fn(),
  currentUrl: vi.fn(), queryCourseMeta: vi.fn(),
  general: vi.fn(), setGeneral: vi.fn(),
}));
vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen, emitTo: mocks.emitTo }));
vi.mock("@/services/cmds", () => ({ commands: mocks }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));

let statusHandler: (event: { payload: CourseStatus }) => void;

beforeEach(async () => {
  mocks.general.mockResolvedValue({ labelLanguage: "en" });
  mocks.setGeneral.mockResolvedValue(undefined);
  await loadLabelLanguage();
  vi.useFakeTimers();
  mocks.listen.mockImplementation(async (_name, handler) => {
    statusHandler = handler;
    return vi.fn();
  });
  mocks.emitTo.mockResolvedValue(undefined);
  mocks.setTheme.mockResolvedValue(undefined);
  mocks.currentUrl.mockResolvedValue("https://example.com/?courseId=123");
  mocks.queryCourseMeta.mockResolvedValue({ title: "原始课程名", cover: "" });
});

afterEach(() => vi.useRealTimers());

async function changeLanguage(language: "en" | "zh") {
  await setLabelLanguage(language);
  await flushPromises();
  await vi.advanceTimersByTimeAsync(300);
}

describe("main interface language", () => {
  it("translates flower names without changing the theme command or palette key", async () => {
    const wrapper = mount(TheThemePanel);
    const flowers = () => wrapper.findAll('[role="radio"]');
    expect(flowers().map((item) => item.text())).toContain("Jade Vine");
    await changeLanguage("zh");
    expect(flowers().map((item) => item.text())).toEqual([
      "青嵐", "翠雀", "山茶", "梔子", "鳶尾", "金蕊", "碧蘿",
    ]);
    expect(mocks.setTheme).not.toHaveBeenCalled();
    expect(mocks.emitTo).not.toHaveBeenCalled();
    await wrapper.get("#theme-option-poppy").trigger("click");
    await flushPromises();
    expect(mocks.setTheme).toHaveBeenCalledWith("poppy");
    wrapper.unmount();
  });

  it("translates only the guide title and preserves its body and links", async () => {
    const wrapper = mount(TheInfoPanel);
    expect(wrapper.get("h1").text()).toBe("User Guide");
    const body = wrapper.get(".guide-content").text();
    const links = wrapper.findAll("a").map((item) => item.attributes("href"));
    await changeLanguage("zh");
    expect(wrapper.get("h1").text()).toBe("使用指南");
    expect(wrapper.get(".guide-content").text()).toBe(body);
    expect(wrapper.findAll("a").map((item) => item.attributes("href"))).toEqual(links);
    wrapper.unmount();
  });

  it("translates course placeholders and status while preserving titles and ellipsis", async () => {
    const wrapper = mount(TheCourseDashboard);
    await flushPromises();
    expect(wrapper.get(".placeholder-text").text()).toBe(label("coursePending"));
    await changeLanguage("zh");
    expect(wrapper.get(".placeholder-text").text()).toBe("课程待加载···");
    expect(wrapper.text()).toContain("章节待加载");
    expect(wrapper.text()).toContain("任务点待加载");
    statusHandler({ payload: { kind: "start", payload: null } });
    await flushPromises();
    statusHandler({ payload: {
      kind: "chapter", payload: { title: "原始章节名", index: 0, completed: 0, total: 2 },
    } });
    statusHandler({ payload: { kind: "task", payload: { index: 0, category: "Video" } } });
    await changeLanguage("en");
    expect(wrapper.text()).toContain("原始课程名");
    expect(wrapper.text()).toContain("原始章节名");
    expect(wrapper.text()).toContain("Tab 1, task 1: Video");
    statusHandler({ payload: { kind: "finish", payload: null } });
    await changeLanguage("zh");
    expect(wrapper.text()).toContain(label("tasksFinished"));
    wrapper.unmount();
  });
});
