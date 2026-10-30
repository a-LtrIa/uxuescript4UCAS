const { spawnSync } = require("node:child_process");

const result = spawnSync(
  process.execPath,
  [require.resolve("typescript/lib/tsc"), "--project", "jsconfig.json"],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
