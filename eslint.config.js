import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["injected/**/*.js", "tests/**/*.js", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "id-match": ["error", "^[A-Za-z_$][A-Za-z0-9_$]*$", { properties: true }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../**", "./*/**"],
              message: "跨目录引用使用 @injected/ 别名，同目录可使用相对路径。",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "scripts/**/*.mjs",
      "scripts/**/*.cjs",
      "*.config.mjs",
      "eslint.config.js",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      "no-console": "off",
    },
  },
];
