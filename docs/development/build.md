# 开发与构建

## 环境

使用根目录 `.node-version` 指定的 Node.js，以及 [CI](../../.github/workflows/ci.yml) 中指定的 pnpm 版本。Rust 使用 stable，项目尚未声明 MSRV；Tauri 版本以项目依赖和锁文件为准。

Windows 还需安装 Microsoft C++ Build Tools（Desktop development with C++ 工作负载）和 WebView2 Evergreen Runtime。仓库的 [Cargo 配置](../../.cargo/config.toml) 指定 `lld-link.exe` 与 `target-cpu=x86-64-v3`，需确保链接器可用；生成的程序要求处理器支持 x86-64-v3。

在仓库根目录安装依赖并启动桌面端：

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

只调试 Vue 页面可运行 `pnpm dev`，但这不会创建 Tauri 窗口，不能验证 IPC、课程 WebView 或本地配置读写。

## 共享构建配置

版本、应用标识、更新端点和安装器共享数据在 [`config/build.json`](../../config/build.json) 维护，由 [`sync-config.mjs`](../../scripts/sync-config.mjs) 同步到 package.json、Cargo.toml、Tauri 配置和 MSI WXS。

这些目标文件仍是可编辑文件，各自维护依赖和非共享配置；共享字段以 `config/build.json` 为准，同步时会被覆盖。前端 dev、test、build 及 `pnpm tauri` 已包含同步步骤，直接运行 Cargo 前先执行：

```powershell
pnpm sync:config
```

## IPC 绑定与权限

这条管线以 Rust 命令声明为输入，与共享构建配置同步分开。命令使用 `#[uxs_commands::command]`；宏收集命令，注册 handler 并同步应用命令 allowlist，TypeScript 绑定导出到 `src/services/cmds.ts`。

修改命令或 DTO 后，在仓库根目录执行：

```powershell
pnpm sync:config
cargo sync-bindings
```

开发模式启动应用也会导出绑定。检查生成差异与本次声明是否一致，不手改绑定和 `commands-*.json`；WebView 能力与远程来源范围仍在 capabilities 中维护。

## 验证与打包

与共享 CI 一致的基础检查：

```powershell
pnpm test
pnpm build
cargo test --workspace --locked
```

前两步会同步构建配置。Rust workspace 测试包含命令宏 crate；默认跳过需要外部服务的用例。测试分组与按需联测见[测试说明](../../tests/README.md)。

生成桌面端发行包：

```powershell
pnpm tauri build
# 仅生成 Windows MSI
pnpm tauri build --bundles msi
```

默认安装包在 `target/release/bundle/`，可执行文件在 `target/release/`；设置 `CARGO_TARGET_DIR` 时以该目录为准。`pnpm build:windows` 在构建后从默认输出目录归档便携 EXE。

正式交付的标签、签名、镜像与安装验证见[发布指南](release.md)。
