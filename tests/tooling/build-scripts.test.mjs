import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Script } from "node:vm";
import { expect, it } from "vitest";

it("packages the bundled core and a versioned, self-contained userscript", () => {
  const output = mkdtempSync(resolve(tmpdir(), "uxs-scripts-"));
  try {
    execFileSync(process.execPath, ["scripts/build-scripts.mjs", output]);
    const config = JSON.parse(readFileSync("config/build.json", "utf8"));
    const source = readFileSync("dist/scripts/core.js");
    const entries = Object.keys(
      JSON.parse(readFileSync("injected/entries.json", "utf8")),
    ).map((name) => `${name}.js`);
    expect(readdirSync(output).sort()).toEqual(
      ["core.js", "embedded", "uxuescript.user.js"].sort(),
    );
    expect(readdirSync(resolve(output, "embedded")).sort()).toEqual(
      entries.sort(),
    );
    for (const entry of entries) {
      const embedded = readFileSync(resolve(output, "embedded", entry), "utf8");
      expect(() => new Script(embedded)).not.toThrow();
    }
    const embeddedCore = readFileSync(
      resolve(output, "embedded/core.js"),
      "utf8",
    );
    expect(Buffer.byteLength(embeddedCore)).toBeLessThan(source.byteLength / 2);
    expect(readFileSync(resolve(output, "core.js"))).toEqual(source);
    const userscript = readFileSync(
      resolve(output, "uxuescript.user.js"),
      "utf8",
    );
    const [header, body] = userscript.split("// ==/UserScript==\n\n");
    expect(body).toBe(source.toString("utf8"));
    for (const line of [
      `// @version      ${config.version}`,
      "// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*",
      "// @run-at       document-idle",
      "// @noframes",
      "// @grant        none",
      "// @downloadURL  https://github.com/unraous/uxuescript/releases/latest/download/uxuescript.user.js",
    ])
      expect(header).toContain(`${line}\n`);
    expect(() => new Script(userscript)).not.toThrow();
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
