# 测试说明

所有命令在仓库根目录运行。基础检查与共享 CI 一致：

```powershell
pnpm test
pnpm build
cargo test --workspace --locked
```

`pnpm build` 包含类型检查和前端生产构建。只需类型检查可运行 `node scripts/typecheck.cjs --noEmit`；直接执行 Cargo 前先运行 `pnpm sync:config`。

## 测试归属

| 位置 | 验证职责 |
| --- | --- |
| `tests/components/`、`layouts/`、`composables/`、`services/` | 前端组件与业务交互 |
| `tests/scripts/` | 注入脚本；`tests/support/core.ts` 统一加载独立脚本 |
| `tests/integration/` | 跨组件语言切换 |
| `tests/tooling/` | 配置同步与发布脚本 |
| `tests/updater/` | 更新模拟服务与[手动安装验证](updater/README.md) |
| 各 Rust crate 的 `tests/unit/` | 所属模块的单元测试，通过 `#[cfg(test)]` 与 `#[path]` 保留私有实现访问 |
| `src-tauri/tests/live/` | 真实模型服务、HTML 联测、Ollama 模型发现及百题计时 |

本地 mock 验证协议与错误处理，不能代替真实服务兼容性验证。Rust workspace 测试包含命令宏 crate，默认不会运行 `#[ignore]` 外部用例。

## 按需外部联测

先查看可用入口，再配置对应服务与凭据（`.env` 或环境变量），只运行所需用例：

```powershell
pnpm sync:config
cargo test -p uxuescript live_tests -- --ignored --list
cargo test -p uxuescript test_solve_bigmodel -- --ignored --nocapture
```

百炼用例为 `test_solve_bailian`，从 `DASHSCOPE_API_KEY` 读取北京地域密钥；以同样方式按需运行。
硅基流动用例为 `test_solve_siliconflow`，从 `SILICONFLOW_API_KEY` 读取中国站密钥。

未实际请求外部服务时，只报告本地验证结果；不要将编译或入口列出成功表述为联测通过。

## 增补测试

测试沿被测职责组织，场景专属数据、mock 和断言留在用例附近。公共支持只收拢真实复用的机制：Rust 的 `src-tauri/tests/unit/support.rs` 与 `support/` 提供 HTTP 模拟、HTML 解压，固定样本在 `src-tauri/tests/assets/`。

测试清理自己创建的资源，预期样本只读。新增本地用例不应删除或替代已有外部联测。
