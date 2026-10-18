# 测试组织

测试沿被测职责组织，公共支持只承担真实复用的运行机制。

- `components/`、`layouts/`、`composables/`、`services/`：对应前端职责。
- `scripts/`：注入脚本的行为；`support/core.ts` 统一加载独立脚本并暴露测试入口。
- `integration/`：跨组件的语言切换行为。
- `tooling/`：配置同步和发布脚本。
- `updater/`：更新模拟服务、用例与手动 MSI 验证工具。

Rust 测试位于各 crate 的 `tests/unit/`，对应原有业务模块。业务文件通过
`#[cfg(test)]` 和 `#[path]` 加载测试文件，使测试继续访问所属模块的私有实现。
这些文件是单元测试模块，不是单独编译的 Cargo 集成测试。
应用的 `tests/unit/support.rs` 和 `support/` 提供 HTTP 模拟与 HTML 解压，固定样本位于 `tests/assets/`。

场景专属的数据、mock 和断言留在用例附近；只服务一个文件的函数不移入公共支持。
测试负责清理自己创建的资源，预期样本只读。

在项目根目录运行 `pnpm test`、`node scripts/typecheck.cjs --noEmit` 和
`cargo test --workspace --locked`。直接运行 Cargo 前先执行 `pnpm sync:config`。
