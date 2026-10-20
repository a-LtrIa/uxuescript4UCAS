<h1 align="center">uXueScript 2.0</h1>

<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" alt="uXueScript Logo">
</p>

<p align="center">
  <strong>简单上手，舒心刷课。</strong><br>
  课程任务自动推进 · AI 辅助答题 · 现代桌面体验 · 独立脚本支持
</p>

<p align="center">
  <a href="https://github.com/unraous/uxuescript/releases/latest"><img src="https://img.shields.io/github/v/release/unraous/uxuescript?style=flat-square&label=Release" alt="Latest release"></a>
  <a href="https://github.com/unraous/uxuescript/stargazers"><img src="https://img.shields.io/github/stars/unraous/uxuescript?style=flat-square" alt="GitHub Stars"></a>
  <img src="https://img.shields.io/badge/Rust-1.97.1-DEA584?style=flat-square&logo=rust&logoColor=white" alt="Rust 1.97.1">
  <img src="https://img.shields.io/badge/Tauri-2.11-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2.11">
  <img src="https://img.shields.io/badge/Vue-3.5-42B883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-GPL--3.0-64748b?style=flat-square" alt="GPL-3.0-only">
  <a href="https://hub.xerj.org/contributors/unraous"><img src="https://hub.xerj.org/contributors/unraous/badge.svg" alt="XERJ Corpus Hub contributor"></a>
</p>

<p align="center">
  <a href="https://github.com/unraous/uxuescript/releases/latest">下载最新版本</a> ·
  <a href="docs/usage/desktop.md">桌面端使用</a> ·
  <a href="docs/usage/ai.md">智能答题</a> ·
  <a href="docs/backend-free.md">无后端模式</a> ·
  <a href="docs/architecture/overview.md">架构概览</a> ·
  <a href="https://github.com/unraous/uxuescript/issues">反馈问题</a>
</p>

---

uXueScript 是基于 **Rust + Tauri 2 + Vue 3** 开发的学习通自动化辅助客户端，支持课程任务自动推进与 AI 辅助答题。课程页面、配置面板与进度展示集中在一个窗口中，搭配多种配色主题和界面动效，让重复的课程操作也能有个舒服的使用体验。

> 项目正在快速迭代中。遇到问题，或者希望增加什么功能，欢迎通过 [Issue](https://github.com/unraous/uxuescript/issues) 或[邮件](mailto:unraous@qq.com)告诉作者。也欢迎参与开发、测试和文档维护，一起把项目做得更好。

## 运行预览

<p align="center">
  <img src="docs/assets/overview.webp" alt="uXueScript 运行预览" width="960">
</p>

## 功能与特点

- **课程任务自动推进：** 识别章节目录与任务状态，跳过已完成内容，继续处理视频、PDF、音频和课后题目。视频支持静音、倍速设置与互动题处理；PDF 自动滚动阅读页面并等待任务点完成。
- **AI 辅助答题：** 支持单选、多选、判断、填空和简答题，自动生成参考答案并回填。可开启人工核验，在提交前检查或修改答案。
- **模型自由选择：** 内置多家模型供应商，支持自定义 OpenAI 兼容服务和本地模型。按自己的需求选择服务与模型，无需 AI 答题时可以跳过配置。
- **现代桌面体验：** 在同一个窗口中查看课程、调整配置和跟踪进度，支持多种配色主题。无需额外安装脚本管理器、Python、Selenium 或浏览器驱动。
- **后台运行：** 处理页面失焦导致的暂停行为，支持后台运行。
- **双模式运行：** 桌面端提供配置、进度展示和 AI 答题能力；单文件 `core.js` 可直接复制到浏览器控制台，运行已支持的非测验类任务。

## 快速开始

### 方式一：直接运行发行包 (推荐)

1. 前往 [Releases 页面](https://github.com/unraous/uxuescript/releases/latest) 下载对应系统的安装包或便携程序。
2. 按所选包完成安装或直接运行便携程序。
3. 在左侧 **Configuration** 中配置 **Provider**、**Model** 与 **API Key** 并保存（如无需 AI 答题可跳过）。
4. 在右侧内嵌 WebView 中登录学习通，进入目标课程小节。
5. 脚本加载后，在课程区域的客户端确认遮罩中点击 **Yes** 即可开始自动处理，点击 **No** 取消。

Windows 用户可选择 MSI 安装包或便携 EXE；macOS Apple Silicon 用户下载 DMG。

详细操作参见[桌面端使用指南](docs/usage/desktop.md)。

### 方式二：从源码构建

开发环境、启动命令和打包步骤见[开发与构建](docs/development/build.md)。

## 独立脚本

[安装油猴脚本](https://github.com/unraous/uxuescript/releases/latest/download/uxuescript.user.js) · [下载 core.js](https://github.com/unraous/uxuescript/releases/latest/download/core.js) · [查看源码](src-tauri/src/scripts/core.js)

安装油猴脚本后，进入课程学习页面会自动询问是否启动。也可以将 `core.js` 的完整内容复制到课程页面的浏览器控制台执行。两种方式均支持已实现的视频、音频和 PDF 任务，包括可识别的视频内互动题。

独立模式不提供依赖桌面后端的课后测验 AI 答题。操作步骤见[独立脚本说明](docs/backend-free.md)。

## 技术与架构

客户端使用系统 WebView 加载课程页面，通过脚本处理课程任务。Rust 后端负责配置管理、混淆字体还原与模型调用，核心脚本同时支持客户端注入和浏览器独立运行。

题目处理会解析学习通的 `font-cxsecret` 动态混淆字体，通过 TTF 字形轮廓特征匹配还原文本，再交给所选模型生成参考答案。运行环境与职责划分见[架构概览](docs/architecture/overview.md)。

项目源自旧版 [uXuexitongJS](https://github.com/unraous/uxuescript/tree/history)。

也可通过 [DeepWiki](https://deepwiki.com/unraous/uxuescript) 浏览项目解读。

## 使用须知与边界说明

- **平台支持：** 目前主要在 Windows（x64）环境下测试与验证；macOS 与 Linux 平台的支持处于持续完善中。
- **免责声明：** 本项目仅供个人学习、软件工程研究与自动化技术交流，不对使用本工具造成的任何后果承担责任。请遵守相关使用规范，严禁用于任何违规用途。
- **AI 答题局限：** 模型生成的答题结果受模型自身知识与题目类型限制，仅供参考，无法保证正确率。
- **凭据安全：** API Key 保存在本地配置文件中；调用模型服务时，会作为请求认证信息发送到所配置的 API 地址。请仅配置可信服务，不要分享包含密钥的配置文件。

## 文档导航

- [桌面端使用指南](docs/usage/desktop.md)：课程选项、启动与停止、进度查看。
- [智能答题指南](docs/usage/ai.md)：供应商、模型、自定义服务与本地 Ollama 配置。
- [无后端模式说明](docs/backend-free.md)：如何在任意浏览器的开发者控制台直接执行单文件脚本。
- [架构概览](docs/architecture/overview.md)：运行环境、职责边界与关键交互契约。
- [故障排查](docs/troubleshooting.md)：课程启动、模型连接、本地配置与日志位置。
- [开发与构建指南](docs/development/build.md)：环境、配置同步、IPC 生成与打包。
- [测试说明](tests/README.md)：测试分组、执行入口与按需外部联测。
- [发布与镜像](docs/development/release.md)：标签发布、签名、Gitee 同步与失败重试。

## 反馈与贡献

欢迎提交 Issue 与 Pull Request：

- 遇到问题或页面不兼容，请在 [GitHub Issues](https://github.com/unraous/uxuescript/issues) 提交包含复现步骤、课程类型与控制台日志的反馈。
- 联系邮箱：<unraous@qq.com>。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=unraous/uxuescript&type=Date)](https://www.star-history.com/#unraous/uxuescript&Date)

## 开源许可证

本项目核心源代码依据 [GNU GPL v3.0](LICENSE) 许可证开源发布。  
第三方字体、字形特征哈希表与依赖库声明请参阅 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
