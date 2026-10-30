# uXueScript4ucas

一个面向**国科大在线（UCAS Online）**的 Tampermonkey / 油猴脚本，用于自动处理课程中的视频、音频和 PDF 任务点。

本项目基于 [unraous/uXueScript](https://github.com/unraous/uxuescript) 改编，保留原项目作者 `unraous` 的实现与 GPL-3.0 许可，并针对国科大在线网站增加兼容处理。当前仓库只维护油猴脚本、其源码、测试和构建工具。

## 功能

- 支持学习通课程页面 `mooc1.chaoxing.com/mycourse/studentstudy*`。
- 支持国科大在线课程页面 `mooc.mooc.ucas.edu.cn/mooc-ans/mycourse/studentstudy*`。
- 自动播放并处理课程视频、音频任务点。
- 自动处理视频内可识别的互动题，并在批注弹窗出现时继续播放。
- 支持国科大在线 PDF 阅读器 `pan.mooc.ucas.edu.cn` 的跨域页面通信和自动翻页。
- 识别已完成的 PDF 任务点并跳过。
- 当前任务点完成后继续处理后续任务点和章节。

## 安装

1. 在浏览器中安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 打开 [最新版油猴脚本](https://github.com/a-LtrIa/uxuescript4UCAS/releases/latest/download/uxuescript.user.js)。
3. 在 Tampermonkey 中确认安装 `uXueScript4ucas`。
4. 打开国科大在线课程学习页面，刷新页面以加载脚本。

如果 Tampermonkey 没有自动更新，可在管理面板中对 `uXueScript4ucas` 手动检查更新。

## 使用

1. 登录国科大在线并进入目标课程。
2. 点击课程目录中的未完成章节。
3. 脚本弹出确认框后点击“确定”开始处理。
4. PDF 任务点会等待阅读器加载，随后自动滚动到底部；已完成的任务点会直接跳过。
5. 需要中止时刷新当前页面即可。

运行期间请保持课程标签页处于打开状态。脚本依赖实际课程页面的 DOM，因此网站结构调整后可能需要同步更新选择器。

## 开发

需要 Node.js 和 pnpm：

```bash
pnpm install
pnpm build
```

构建产物为：

```text
dist/scripts/uxuescript.user.js
```

可用命令：

```bash
pnpm test       # 运行测试并构建脚本
pnpm typecheck  # 检查 JavaScript 类型
pnpm lint       # ESLint
pnpm format     # Prettier
```

脚本源码位于 [`injected/`](injected/)，构建入口为 [`scripts/build-scripts.mjs`](scripts/build-scripts.mjs)。

## 贡献说明

- 原项目作者：`unraous`，项目地址 [unraous/uXueScript](https://github.com/unraous/uxuescript)。
- 国科大在线适配、测试与发布维护：`altria`。
- GPT 参与了国科大在线页面调查、油猴脚本匹配范围调整、跨域 PDF 通信、PDF 完成状态与章节推进逻辑、测试和 README 整理工作。

## 免责声明

本项目仅用于个人学习、软件工程研究和自动化技术交流。请遵守学校、课程平台及相关法律法规的要求，并对使用本脚本产生的后果自行负责。

## 许可证

本项目沿用上游项目的 [GNU General Public License v3.0](LICENSE)。
