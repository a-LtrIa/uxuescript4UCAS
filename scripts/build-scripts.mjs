import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(root, "config/build.json"), "utf8"));
const output = resolve(root, process.argv[2] ?? "dist/scripts");
const source = resolve(root, "src-tauri/src/scripts/core.js");
const homepage = "https://github.com/unraous/uxuescript";
const download = `${homepage}/releases/latest/download/uxuescript.user.js`;

const metadata = `// ==UserScript==
// @name         uXueScript
// @namespace    ${homepage}
// @version      ${config.version}
// @description  学习通视频、音频与 PDF 课程任务自动处理，支持视频内互动题。
// @author       ${config.app.author}
// @license      GPL-3.0-only
// @homepageURL  ${homepage}
// @supportURL   ${homepage}/issues
// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*
// @run-at       document-idle
// @noframes
// @grant        none
// @updateURL    ${download}
// @downloadURL  ${download}
// ==/UserScript==

`;

mkdirSync(output, { recursive: true });
copyFileSync(source, resolve(output, "core.js"));
writeFileSync(
  resolve(output, "uxuescript.user.js"),
  metadata + readFileSync(source, "utf8"),
);
console.log(`Browser scripts ${config.version}: ${output}`);
