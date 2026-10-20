import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Script } from "node:vm";
import { expect, it } from "vitest";

it("packages the original core and a versioned, self-contained userscript", () => {
  const output = mkdtempSync(resolve(tmpdir(), "uxs-scripts-"));
  try {
    execFileSync(process.execPath, ["scripts/build-scripts.mjs", output]);
    const config = JSON.parse(readFileSync("config/build.json", "utf8"));
    const source = readFileSync("src-tauri/src/scripts/core.js");
    expect(readdirSync(output).sort()).toEqual(["core.js", "uxuescript.user.js"]);
    expect(readFileSync(resolve(output, "core.js"))).toEqual(source);
    const userscript = readFileSync(resolve(output, "uxuescript.user.js"), "utf8");
    const [header, body] = userscript.split("// ==/UserScript==\n\n");
    expect(body).toBe(source.toString("utf8"));
    expect(header).toContain(`// @version      ${config.version}\n`);
    expect(header).toContain("// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*\n");
    expect(header).toContain("// @run-at       document-idle\n");
    expect(header).toContain("// @noframes\n");
    expect(header).toContain("// @grant        none\n");
    expect(header).toContain("// @downloadURL  https://github.com/unraous/uxuescript/releases/latest/download/uxuescript.user.js\n");
    expect(() => new Script(userscript)).not.toThrow();
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
