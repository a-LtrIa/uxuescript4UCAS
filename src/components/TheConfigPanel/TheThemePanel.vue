<script setup lang="ts">
import { useScaleFeedback } from "@/composables/useScaleFeedback";
import { commands } from "@/services/cmds";
import { showError } from "@/services/errors";
import { activeTheme, setTheme, themeNames, themes } from "@/theme";
import type { CSSProperties } from "vue";
import type { ThemeName } from "@/theme";

const scaleFeedback = useScaleFeedback({
  hoverScale: 1.1,
  pressScale: 0.9,
  targetSelector: ".theme-name",
});

const themeStyle = (name: ThemeName): CSSProperties => {
  const colors = themes[name];
  return {
    "--button-color": colors.brand,
    "--theme-page-gradient": `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceLight} 100%)`,
  } as CSSProperties;
};

const selectTheme = async (name: ThemeName) => {
  void setTheme(name).catch((cause) =>
    console.error("Failed to broadcast color theme:", cause),
  );
  await commands
    .setTheme(name)
    .catch((cause) => showError("Failed to update theme:", cause));
};
</script>

<template>
  <div class="theme-panel">
    <div class="theme-list custom-scrollbar">
      <button
        v-for="name in themeNames"
        :key="name"
        type="button"
        class="theme-option"
        :style="themeStyle(name)"
        :aria-pressed="activeTheme === name"
        @click="selectTheme(name)"
        @pointerenter="scaleFeedback.handlePointerEnter"
        @pointerleave="scaleFeedback.handlePointerLeave"
        @pointerdown="scaleFeedback.handlePointerDown"
        @pointerup="scaleFeedback.handlePointerUp"
      >
        <span class="theme-name">{{ name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.theme-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}

.theme-option {
  position: relative;
  flex: 0 0 33%;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--button-color);
  background: transparent;
  cursor: pointer;
}

.theme-option::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--theme-page-gradient);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    #000 40%,
    #000 60%,
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    #000 40%,
    #000 60%,
    transparent
  );
  opacity: 0.25;
  clip-path: inset(0 50%);
  transition:
    clip-path 250ms ease,
    opacity 250ms ease;
}

.theme-option:hover::before {
  opacity: 1;
  clip-path: inset(0);
}

.theme-name {
  position: relative;
  font-size: 1.75rem;
  text-transform: capitalize;
}
</style>
