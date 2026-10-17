<script setup lang="ts">
import { gsap } from "gsap";
import { onMounted, onUnmounted, ref } from "vue";
import { useScaleFeedback } from "@/composables/useScaleFeedback";
import { label, loadLabelLanguage } from "@/labels";

defineProps<{ message: string }>();
const emit = defineEmits<{ finished: [choice: boolean] }>();
const scaleFeedback = useScaleFeedback({ hoverScale: 1.25 });

const backdrop = ref<HTMLElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
let animation: gsap.core.Timeline | null = null;
let closing = false;

onMounted(() => {
  void loadLabelLanguage().catch((cause) => console.error("加载确认弹窗语言失败:", cause));
  animation = gsap
    .timeline()
    .fromTo(backdrop.value, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0)
    .fromTo(
      dialog.value,
      { opacity: 0, y: "4vh", scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.42,
        ease: "power3.out",
      },
      0.08,
    );
});

const choose = (choice: boolean) => {
  if (closing) return;
  closing = true;
  animation?.kill();
  animation = gsap
    .timeline({ onComplete: () => emit("finished", choice) })
    .to(
      dialog.value,
      { opacity: 0, y: "-3vh", scale: 0.97, duration: 0.28, ease: "power2.in" },
      0,
    )
    .to(backdrop.value, { opacity: 0, duration: 0.3 }, 0.05);
};

onUnmounted(() => animation?.kill());
</script>

<template>
  <div
    ref="backdrop"
    class="confirmation-backdrop"
  >
    <section
      ref="dialog"
      class="confirmation-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="label('confirmation')"
    >
      <header class="title">
        <h1>{{ label('confirmation') }}</h1>
      </header>
      <div class="message custom-scrollbar">
        <div class="message-content">{{ message }}</div>
      </div>
      <div class="actions">
        <button
          type="button"
          class="choice-button"
          @click="choose(true)"
          @pointerenter="scaleFeedback.handlePointerEnter"
          @pointerleave="scaleFeedback.handlePointerLeave"
          @pointerdown="scaleFeedback.handlePointerDown"
          @pointerup="scaleFeedback.handlePointerUp"
        >
          Yes
        </button>
        <button
          type="button"
          class="choice-button"
          @click="choose(false)"
          @pointerenter="scaleFeedback.handlePointerEnter"
          @pointerleave="scaleFeedback.handlePointerLeave"
          @pointerdown="scaleFeedback.handlePointerDown"
          @pointerup="scaleFeedback.handlePointerUp"
        >
          No
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.confirmation-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vmin;
  box-sizing: border-box;
  background: rgb(0 0 0 / 55%);
  pointer-events: auto;
}

.confirmation-dialog {
  width: 33%;
  max-height: 67%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 2vmin;
  border-radius: 1.25em;
  /* 两个遮罩的视口不同，以各自视口设置局部字号，子元素用 em 跟随。 */
  font-size: 1.8vmin;
  background: var(--theme-page-gradient);
  color: var(--theme-brand);
  box-shadow: 0 1.25em 3em
    color-mix(in srgb, var(--theme-black) 25%, transparent);
}

.message {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 10%;
  text-align: center;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 1.25em;
  line-height: 1.5;
}

.message-content {
  flex: 0 0 auto;
  margin-block: auto;
}

.title,
.actions {
  flex: 0 0 calc(2.5em + 2vmin);
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.title h1 {
  margin: 0;
  font-size: 2em;
}

.actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.5em;
}

.choice-button {
  width: 4.4em;
  height: 2em;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--theme-brand);
  font: inherit;
  font-size: 1.25em;
  font-weight: 600;
  cursor: pointer;
}
</style>
