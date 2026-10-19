# 本地更新测试

所有命令在仓库根目录运行。mock 使用独立的应用标识、MSI 注册表标记和本地更新端点，走与正式版相同的检查、下载与安装流程。

## 弹窗与下载

分别在两个 PowerShell 终端运行：

```powershell
pnpm updater:mock
```

```powershell
$env:UXS_MSI_PROFILE="mock"
pnpm tauri dev
```

默认 `available fixture` 返回固定高版本与签名空 ZIP，用于验证开屏后的更新提示和下载进度。该包不含安装程序，安装预期失败。其他响应：

```powershell
pnpm updater:mock none
pnpm updater:mock bad-signature
```

模拟包会限速以便观察进度，真实安装包内容保持不变。`UXS_UPDATER_PORT` 可覆盖服务器端口；mock 应用默认请求 `35821`，改服务端口不会自动修改应用端点，`0` 仅用于自动化测试分配随机端口。

## MSI 升级

签名需与构建配置公钥配套。设置 `TAURI_SIGNING_PRIVATE_KEY` 和可选密码，或提供已有的 `.secrets/updater.key`，然后运行：

```powershell
pnpm build:updater.mock
```

脚本按 `config/build.json` 的 `updater.mock.versions` 构建两个版本，产物位于 `.local-updater/packages/<版本>/`，每版包含 `update.msi`、`update.msi.sig` 和 `update-version.txt`。脚本结束或失败后会恢复其改写的构建输入与 Cargo.lock。

安装低版本 MSI，再提供高版本。以下目录版本应与本次构建产物一致：

```powershell
pnpm updater:mock available real .local-updater/packages/2.2.10
```

预期：开屏后提示升级，接受后下载并安装；升级完成再次启动，不提示同版本更新。Windows 安装器启动后应用退出。便携程序会转向下载页，不能代替 MSI 安装流程验证。

`real` 目录必须有匹配的更新包、签名和版本文件；也兼容 `update.msi.zip` 与对应 `.sig`。缺失文件会报错，不回退 fixture。服务启动时读取文件，更换包后需重启服务。

只需调试 mock 可执行文件时，可在设置 `UXS_MSI_PROFILE=mock` 的终端运行 `pnpm tauri build --no-bundle`。测试后在该终端移除变量并恢复正式配置：

```powershell
Remove-Item Env:UXS_MSI_PROFILE
pnpm sync:config
```

## 验证边界

覆盖无更新、拒绝更新、签名错误、下载取消与重新下载、真实 MSI 升级。fixture 验证展示和下载，真实包验证安装；两者都不验证 GitHub/Gitee 的实际分发行为。

mock 配置复用共享构建同步机制，修改源与同步规则见[构建指南](../../docs/development/build.md)。
