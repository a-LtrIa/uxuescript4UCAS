// Vue 的检查器需要 JS 编译器 API，单独使用兼容包，保留项目的 TypeScript 7。
if (!process.argv.includes("-p") && !process.argv.includes("--project")) {
  const { spawnSync } = require("node:child_process");
  const result = spawnSync(
    process.execPath,
    [__filename, "--project", "jsconfig.json", ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
require("vue-tsc").run(require.resolve("typescript/lib/tsc"));
