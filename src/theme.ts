import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import { readonly, shallowRef } from "vue";

export const themes = {
  gentian: {
    brand: "#0d58a4",
    surface: "#e8dcc4",
    surfaceLight: "#f0ebe0",
  },
  delphinium: {
    brand: "#31566d",
    surface: "#e8cfb3",
    surfaceLight: "#f4e5d3",
  },
  camellia: {
    brand: "#9c3b45",
    surface: "#d2ddea",
    surfaceLight: "#e8edf3",
  },
  gardenia: {
    brand: "#3e6552",
    surface: "#ead6df",
    surfaceLight: "#f6eaf0",
  },
} as const;

export type ThemeName = keyof typeof themes;
export const defaultTheme: ThemeName = "gentian";
export const themeNames = Object.keys(themes) as ThemeName[];

export interface ThemeColors {
  brand: string;
  surface: string;
  surfaceLight: string;
}

const colorProperties: Record<keyof ThemeColors, string> = {
  brand: "--theme-brand",
  surface: "--theme-surface",
  surfaceLight: "--theme-surface-light",
};

const overrides = shallowRef<Partial<ThemeColors>>({});
export const themeOverrides = readonly(overrides);
const selectedTheme = shallowRef<ThemeName>(defaultTheme);
export const activeTheme = readonly(selectedTheme);

function resolveTheme(name: string): ThemeName {
  return name in themes ? (name as ThemeName) : defaultTheme;
}

function colorsForTheme(name: string): ThemeColors {
  return themes[resolveTheme(name)];
}

function applyOverrides(next: Partial<ThemeColors>) {
  for (const key of Object.keys(colorProperties) as (keyof ThemeColors)[]) {
    const value = next[key];
    if (value === overrides.value[key]) continue;
    if (value === undefined) {
      document.documentElement.style.removeProperty(colorProperties[key]);
    } else {
      document.documentElement.style.setProperty(colorProperties[key], value);
    }
  }
  overrides.value = { ...next };
}

async function syncMask() {
  if (isTauri()) {
    await Promise.all([
      emitTo("mask", "theme-colors-changed", overrides.value),
      emitTo("chaoxing-mask", "theme-colors-changed", overrides.value),
    ]);
  }
}

/** Apply partial color overrides immediately; unspecified colors keep their current values. */
export async function setThemeColors(
  colors: Partial<ThemeColors>,
): Promise<void> {
  applyOverrides({ ...overrides.value, ...colors });
  await syncMask();
}

/** Remove runtime overrides and return to the colors declared in theme.css. */
export async function resetThemeColors(): Promise<void> {
  applyOverrides({});
  await syncMask();
}

/** Apply a named theme in the current WebView and broadcast its colors to the masks. */
export async function setTheme(name: string): Promise<void> {
  const resolved = resolveTheme(name);
  selectedTheme.value = resolved;
  applyOverrides(resolved === defaultTheme ? {} : colorsForTheme(resolved));
  await syncMask();
}

/** Initialize a WebView's palette without broadcasting to other WebViews. */
export function initializeTheme(name: string): void {
  const resolved = resolveTheme(name);
  selectedTheme.value = resolved;
  applyOverrides(resolved === defaultTheme ? {} : colorsForTheme(resolved));
}

/** Keep the separate mask Webview in sync with changes made in the main Webview. */
export function listenForThemeColors(): Promise<UnlistenFn> {
  return listen<Partial<ThemeColors>>("theme-colors-changed", (event) => {
    applyOverrides(event.payload);
  });
}
