import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TheAPIPanel from "@/components/TheConfigPanel/TheAPIPanel.vue";
import { label } from "@/labels";

const mocks = vi.hoisted(() => ({
  providers: vi.fn(), currentProvider: vi.fn(), healthy: vi.fn(),
  confirm: vi.fn(), error: vi.fn(),
}));
vi.mock("@/services/cmds", () => ({ commands: mocks }));
vi.mock("@/services/errors", () => ({ showError: mocks.error }));

beforeEach(() => {
  mocks.providers.mockResolvedValue([{
    name: "Test Provider", isCustom: false, protocol: "OpenAIChatCompletions",
    baseUrl: "https://example.com", apiKey: null, models: ["test-model"], chosenModel: 0,
  }]);
  mocks.currentProvider.mockResolvedValue("Test Provider");
  mocks.confirm.mockResolvedValue(true);
});

describe("API connection test", () => {
  it("calls healthy, disables repeat clicks and explains success", async () => {
    let resolve!: (value: string) => void;
    mocks.healthy.mockReturnValue(new Promise<string>((done) => { resolve = done; }));
    const wrapper = mount(TheAPIPanel);
    await flushPromises();
    const button = wrapper.get<HTMLButtonElement>(`[aria-label="${label('testConnection')}"]`);
    await button.trigger("click");
    expect(mocks.healthy).toHaveBeenCalledOnce();
    expect(button.element.disabled).toBe(true);
    expect(button.attributes("aria-label")).toBe("Testing...");
    await button.trigger("click");
    expect(mocks.healthy).toHaveBeenCalledOnce();
    resolve("ok");
    await flushPromises();
    expect(mocks.confirm).toHaveBeenCalledWith(
      "Connection successful.\nThe model answered the test question.",
    );
    expect(button.element.disabled).toBe(false);
    expect(button.attributes("aria-label")).toBe(label("testConnection"));
    wrapper.unmount();
  });

  it("shows the exact upstream error and allows another test", async () => {
    mocks.healthy.mockRejectedValue("API 错误 (401): invalid_api_key");
    const wrapper = mount(TheAPIPanel);
    await flushPromises();
    const button = wrapper.get<HTMLButtonElement>(`[aria-label="${label('testConnection')}"]`);
    await button.trigger("click");
    await flushPromises();
    expect(mocks.error).toHaveBeenCalledWith("Connection failed:", "API 错误 (401): invalid_api_key");
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(button.element.disabled).toBe(false);
    wrapper.unmount();
  });
});
