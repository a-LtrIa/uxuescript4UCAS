<h1 align="center">uXueScript 2.0</h1>

<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" alt="uXueScript Logo">
</p>

<p align="center">
  <strong>学习通自动化辅助桌面客户端</strong><br>
  课程任务自动推进 · 混淆字体还原 · AI 答题参考 · 独立脚本支持
</p>

<p align="center">
  <a href="https://github.com/unraous/uxuescript/releases/latest"><img src="https://img.shields.io/github/v/release/unraous/uxuescript?style=flat-square&label=Release" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/Rust-1.97.1-DEA584?style=flat-square&logo=rust&logoColor=white" alt="Rust 1.97.1">
  <img src="https://img.shields.io/badge/Tauri-2.11-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2.11">
  <img src="https://img.shields.io/badge/Vue-3.5-42B883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-GPL--3.0-64748b?style=flat-square" alt="GPL-3.0-only">
  <a href="https://deepwiki.com/unraous/uxuescript"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
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

uXueScript 是面向学习通网页版课程的自动化辅助客户端。桌面端基于 **Rust + Tauri 2 + Vue 3** 开发，通过内嵌 WebView 加载课程页面并注入自动化核心脚本，支持在界面中实时同步章节进度；同时内置混淆字体还原与 AI 辅助答题能力，为测验提供参考答案。

项目继承自旧版 [uXuexitongJS](https://github.com/unraous/uxuescript/tree/history)，核心自动化逻辑保留为单文件脚本（`core.js`），支持脱离客户端直接复制到浏览器控制台执行（无后端模式）。

> 项目持续演进中。遇到问题请先更新至最新 Release，并查阅[故障排查](docs/troubleshooting.md)。

## 运行预览

<p align="center">
  <img src="docs/assets/overview.webp" alt="uXueScript 运行预览" width="960">
</p>

## 核心特性

- **桌面运行：** 基于 Tauri 2 构建，无需安装 Python、Selenium 或浏览器驱动。
- **课程任务自动处理：**
  - 自动识别章节目录树与任务点状态，跳过已完成小节，推进未完成任务。
  - 视频任务：支持自动播放、倍速调节、静音与防暂停。
  - PDF 任务：自动滚动内嵌阅读页面至底部，并等待任务点完成标记。
- **混淆字体还原与 AI 答题：**
  - 解析超星 `font-cxsecret` 动态混淆字体，比对 TTF 轮廓特征还原真实题目文本。
  - 支持调用大语言模型生成参考答案，覆盖单选、多选、判断、填空与简答题并自动回填。
- **后台防失焦暂停：**
  - 拦截 `blur`、`visibilitychange` 等页面失焦事件，支持后台挂机运行。
- **双模式运行：**
  - 桌面端：集成 WebView 界面、配置面板与字体/AI 答题后端。
  - 独立脚本：单文件 `core.js`，可直接在任意浏览器控制台运行非测验类任务。

## 快速开始

### 方式一：直接运行发行包 (推荐)

1. 前往 [Releases 页面](https://github.com/unraous/uxuescript/releases/latest) 下载对应系统的安装包或便携程序。
2. 按所选包完成安装或直接运行便携程序。
3. 在左侧 **Configuration** 中配置 **Provider**、**Model** 与 **API Key** 并保存（如无需 AI 答题可跳过）。
4. 在右侧内嵌 WebView 中登录学习通，进入目标课程小节。
5. 脚本加载后，在课程区域的客户端确认遮罩中点击 **Yes** 即可开始自动处理，点击 **No** 取消。

详细操作参见[桌面端使用指南](docs/usage/desktop.md)。

### 方式二：从源码构建

开发环境、启动命令和打包步骤见[开发与构建](docs/development/build.md)。

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

## 开源许可证

本项目核心源代码依据 [GNU GPL v3.0](LICENSE) 许可证开源发布。  
第三方字体、字形特征哈希表与依赖库声明请参阅 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
