import { defineConfig } from "vitest/config";
import { scriptAliases } from "./scripts/script-aliases.mjs";

export default defineConfig({
  resolve: { alias: scriptAliases },
  test: {
    include: ["tests/**/*.test.{js,mjs}"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    clearMocks: true,
  },
});
