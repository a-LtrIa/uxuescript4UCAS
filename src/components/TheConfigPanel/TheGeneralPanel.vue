<script setup lang="ts">
import { computed, onMounted } from "vue";
import VSelector from "@/components/base/VSelector.vue";
import {
  label,
  labelLanguage,
  loadLabelLanguage,
  setLabelLanguage,
} from "@/labels";
import { showError } from "@/services/errors";

const languages = ["en", "zh"] as const;
const languageData = computed(() => ({
  label: label("labelLanguage"),
  annotation: label("languageDescription"),
  selectedIndex: languages.indexOf(labelLanguage.value),
  mutable: false,
  items: [
    { label: "English", mutable: false },
    { label: "中文", mutable: false },
  ],
}));
const selectLanguage = (index: number) =>
  setLabelLanguage(languages[index]).catch((cause) =>
    showError("设置标签语言失败:", cause),
  );

onMounted(() =>
  loadLabelLanguage().catch((cause) => showError("加载标签语言失败:", cause)),
);
</script>

<template>
  <div class="general-panel">
    <VSelector
      class="option"
      :data="languageData"
      :methods="{ select: selectLanguage }"
    />
  </div>
</template>

<style scoped>
.general-panel {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.option {
  height: 20%;
}
</style>
