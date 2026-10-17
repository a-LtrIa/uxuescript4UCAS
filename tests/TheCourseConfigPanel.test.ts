import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TheCourseConfigPanel from "@/components/TheConfigPanel/TheCourseConfigPanel.vue";

const mocks = vi.hoisted(() => ({ options: vi.fn(), setOptions: vi.fn(), error: vi.fn() }));
vi.mock("@/services/cmds", () => ({ commands: mocks }));
vi.mock("@/services/errors", () => ({ showError: mocks.error }));

beforeEach(() => {
  mocks.options.mockResolvedValue({ muteWebview: true, lockSpeed: 2, switchingCd: 3 });
  mocks.setOptions.mockResolvedValue(undefined);
});

describe("optional course settings", () => {
  it("loads, updates and clears both numeric settings", async () => {
    const wrapper = mount(TheCourseConfigPanel);
    await flushPromises();
    for (const [id, key, initial] of [
      ["playing-speed-input", "lockSpeed", "2"],
      ["switching-cd-input", "switchingCd", "3"],
    ]) {
      const input = wrapper.get<HTMLInputElement>(`#${id}`);
      expect(input.element.value).toBe(initial);
      await input.setValue("1.5");
      expect(mocks.setOptions).toHaveBeenLastCalledWith(expect.objectContaining({ [key]: 1.5 }));
      await input.setValue("");
      expect(mocks.setOptions).toHaveBeenLastCalledWith(expect.objectContaining({ [key]: null }));
    }
    wrapper.unmount();
  });

  it.each(["0", "-1", "abc"])("rejects invalid value %s", async (value) => {
    const wrapper = mount(TheCourseConfigPanel);
    await flushPromises();
    await wrapper.get("#switching-cd-input").setValue(value);
    expect(mocks.setOptions).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalled();
    wrapper.unmount();
  });
});
