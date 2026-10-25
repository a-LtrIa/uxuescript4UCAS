<script setup lang="ts">
import { openUrl } from "@tauri-apps/plugin-opener";
import { showError } from "@/services/errors";
import { label } from "@/labels";
import VRollTransition from "@/components/base/VRollTransition.vue";

const openIssues = async () => {
  try {
    await openUrl("https://github.com/unraous/uxuescript/issues");
  } catch (error) {
    await showError("无法打开 GitHub Issues 页面:", error);
  }
};
</script>

<template>
  <article
    class="guide-panel"
    aria-labelledby="guide-title"
  >
    <h1
      id="guide-title"
      class="title"
    >
      <VRollTransition :value="label('userGuide')" class="title-text" v-slot="{ value }">
        {{ value }}
      </VRollTransition>
    </h1>
    <div class="guide-content custom-scrollbar">
      <section aria-labelledby="guide-steps-title">
        <h2 id="guide-steps-title">操作步骤</h2>
        <ol>
          <li>
            <strong>配置模型：</strong>在 Configuration
            中选择模型供应商与模型，并填写 API Key。
          </li>
          <li>
            <strong>打开学习页面：</strong
            >在右下角登录学习通，进入目标课程章节、作业或受支持的考试答题页。
          </li>
          <li><strong>确认启动：</strong>在弹窗中确认启动。</li>
        </ol>
        <p>
          视频批注出现时会自动点击“继续学习”，无需配置模型。
        </p>
        <p>
          独立作业填写后暂存，考试按页面模式填写或暂存，请自行检查、保存和提交。
          不允许整卷预览时，逐题考试需从第一题开始，且允许自由回看；运行时不要手动跳题。
        </p>
      </section>
      <section aria-labelledby="guide-issues-title">
        <h2 id="guide-issues-title">常见问题</h2>
        <p>
          倍速后任务不完成或不跳转：部分课程按观看时长解锁，请将 Speed Lock
          留空，以原速重试。
        </p>
        <p>
          最小化后视频暂停：部分电脑会冻结课程页，可保持窗口不最小化，用 Alt+Tab
          切换应用。
        </p>
        <p>
          密钥有效仍不答题：若日志出现 429，表示服务限流，可稍后重试或更换模型/供应商。
        </p>
      </section>
      <section aria-labelledby="guide-notes-title">
        <h2 id="guide-notes-title">使用说明</h2>
        <p>
          本项目为开源非营利项目，仅供学习与技术交流。请遵守相关平台规则，使用风险和责任由使用者自行承担。
        </p>
        <p>当前版本仍处于重构与快速迭代阶段，并非长期稳定版本。</p>
        <p>
          作者并非学习通长期用户，测试课程资源有限，部分特殊课程尚未充分验证，可能存在兼容性问题。
        </p>
      </section>
      <section aria-labelledby="guide-feedback-title">
        <h2 id="guide-feedback-title">问题反馈</h2>
        <p>
          遇到问题时，请先更新至最新版本。若问题仍未解决，可在
          <a
            href="https://github.com/unraous/uxuescript/issues"
            @click.prevent="openIssues"
            >GitHub Issues</a
          >
          提交反馈，或通过邮件联系作者：
          <a href="mailto:unraous@qq.com">unraous@qq.com</a>。
        </p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.guide-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  text-align: left;
  -webkit-text-stroke: 0;
  /* 全局字体仅提供常规字重，此处允许合成粗体以呈现标题和步骤层级。 */
  font-synthesis: weight;
}

.title {
  height: 20%;
  width: 100%;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-brand);
}

.title-text {
  width: 100%;
  height: 1.5em;
}

.title-text :deep(.roll-item) {
  justify-content: center;
}

.guide-content {
  height: 60%;
  width: 90%;
  min-height: 0;
  padding: 0 10%;
  color: var(--theme-brand);
  font-size: 1.25rem;
  line-height: 1.5;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  overflow-wrap: anywhere;
  user-select: text;
}

.guide-content section + section {
  margin-top: 1rem;
  padding-top: 1rem;
}

.guide-content h2 {
  margin: 0 0 0.5rem;
  color: var(--theme-brand);
  font-size: inherit;
  font-weight: 700;
  line-height: 1.5;
}

.guide-content strong {
  font-weight: 700;
}

.guide-content ol {
  margin: 0;
  padding-left: 1.5em;
}

.guide-content li + li,
.guide-content p + p {
  margin-top: 0.5rem;
}

.guide-content p {
  margin: 0;
}

.guide-content a {
  color: var(--theme-brand);
  text-underline-offset: 0.15em;
}
</style>
