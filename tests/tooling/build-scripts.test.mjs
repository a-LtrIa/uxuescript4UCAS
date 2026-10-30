import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Script } from "node:vm";
import { expect, it } from "vitest";

it("builds a versioned, self-contained userscript", () => {
  const output = mkdtempSync(resolve(tmpdir(), "uxs-scripts-"));
  try {
    execFileSync(process.execPath, ["scripts/build-scripts.mjs", output]);
    const config = JSON.parse(readFileSync("config/build.json", "utf8"));
    expect(readdirSync(output)).toEqual(["uxuescript.user.js"]);
    const userscript = readFileSync(
      resolve(output, "uxuescript.user.js"),
      "utf8",
    );
    const [header, body] = userscript.split("// ==/UserScript==\n\n");
    expect(body).toContain("//#region injected/chaoxing/course.js");
    expect(body).toContain("main();");
    for (const line of [
      `// @version      ${config.version}`,
      "// @name         uXueScript4ucas",
      `// @author       ${config.author}`,
      "// @namespace    https://github.com/a-LtrIa/uxuescript4UCAS",
      "// @homepageURL  https://github.com/a-LtrIa/uxuescript4UCAS",
      "// @supportURL   https://github.com/a-LtrIa/uxuescript4UCAS/issues",
      "// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*",
      "// @match        *://mooc.mooc.ucas.edu.cn/mooc-ans/mycourse/studentstudy*",
      "// @match        *://mooc.mooc.ucas.edu.cn/mooc-ans/screen/file*",
      "// @match        *://pan.mooc.ucas.edu.cn/screen/v2/file_*",
      "// @run-at       document-idle",
      "// @grant        none",
      "// @downloadURL  https://github.com/a-LtrIa/uxuescript4UCAS/releases/latest/download/uxuescript.user.js",
    ])
      expect(header).toContain(`${line}\n`);
    expect(() => new Script(userscript)).not.toThrow();
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
