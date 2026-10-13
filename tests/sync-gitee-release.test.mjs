// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncRelease, syncTag } from "../scripts/sync-gitee-release.mjs";

let server, base, options, state, directory;
const contents = new Map([
  ["uxs-2.1.4-win-x64.msi", Buffer.from("signed installer")],
  ["uxs-2.1.4-win-x64.msi.sig", Buffer.from("signature")],
  [
    "latest.json",
    Buffer.from(
      '{"url":"https://github.com/unraous/uxuescript/releases/download/v2.1.4/update.msi"}',
    ),
  ],
]);

beforeEach(async () => {
  state = {
    release: null,
    files: [],
    nextId: 1,
    calls: [],
    fail: null,
    badSize: false,
  };
  server = createServer(async (req, res) => {
    const url = new URL(req.url, base);
    const path = url.pathname;
    state.calls.push(`${req.method} ${path}`);
    const reply = (status, data) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    if (state.fail === `${req.method} ${path}`)
      return reply(500, { message: "gitee-secret" });
    if (path.startsWith("/github/")) {
      expect(req.headers.authorization).toBe("Bearer github-secret");
      return reply(200, {
        id: 12,
        tag_name: "v2.1.4",
        name: "Release title",
        body: "Release notes",
        prerelease: false,
        assets: [...contents].map(([name, data]) => ({
          name,
          size: data.length,
          url: `${base}/download/${name}`,
        })),
      });
    }
    if (path.startsWith("/download/")) {
      const data = contents.get(path.slice("/download/".length));
      res.writeHead(200);
      return res.end(data);
    }
    if (req.headers.authorization !== "Bearer gitee-secret")
      return reply(401, { message: "gitee-secret" });
    if (path.endsWith("/tags/v2.1.4"))
      return reply(state.release ? 200 : 404, state.release);
    if (path.endsWith("/attach_files") && req.method === "GET") {
      const page = Number(url.searchParams.get("page"));
      return reply(200, state.files.slice((page - 1) * 100, page * 100));
    }
    if (req.method === "DELETE") {
      state.files = state.files.filter(
        (file) => file.id !== Number(path.split("/").at(-1)),
      );
      return reply(204);
    }
    if (path.endsWith("/attach_files")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = new Request(base, {
        method: "POST",
        headers: { "content-type": req.headers["content-type"] },
        body: Buffer.concat(chunks),
      });
      const file = (await request.formData()).get("file");
      expect(Buffer.from(await file.arrayBuffer())).toEqual(
        contents.get(file.name),
      );
      const uploaded = {
        id: state.nextId++,
        name: file.name,
        size: file.size + (state.badSize ? 1 : 0),
      };
      state.files.push(uploaded);
      return reply(201, uploaded);
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    state.release = { id: 42, ...JSON.parse(Buffer.concat(chunks).toString()) };
    reply(req.method === "POST" ? 201 : 200, state.release);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  options = {
    githubRepo: "unraous/uxuescript",
    giteeRepo: "unraous/uxuescript",
    tag: "v2.1.4",
    githubToken: "github-secret",
    giteeToken: "gitee-secret",
    githubApi: `${base}/github`,
    giteeApi: `${base}/gitee`,
    synchronizeTag: vi.fn(() => "a".repeat(40)),
    log: vi.fn(),
  };
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

describe("Gitee Release synchronization", () => {
  it("creates the release and uploads the original assets and manifest", async () => {
    await syncRelease(options);
    expect(state.release).toMatchObject({
      name: "Release title",
      body: "Release notes",
      target_commitish: "a".repeat(40),
    });
    expect(state.files.map((file) => file.name)).toEqual([...contents.keys()]);
    expect(options.log).toHaveBeenLastCalledWith(
      "Synchronized Release: https://gitee.com/unraous/uxuescript/releases/tag/v2.1.4",
    );
  });

  it("updates metadata, replaces matching assets and retains unrelated attachments on reruns", async () => {
    await syncRelease(options);
    state.release.name = "old title";
    state.files.push({ id: 900, name: "manual-notes.txt", size: 3 });
    const oldIds = state.files.slice(0, 3).map((file) => file.id);
    await syncRelease(options);
    expect(state.calls).toContain(
      "PATCH /gitee/repos/unraous/uxuescript/releases/42",
    );
    expect(state.release.name).toBe("Release title");
    expect(state.files).toHaveLength(4);
    expect(state.files.some((file) => oldIds.includes(file.id))).toBe(false);
    expect(state.files.find((file) => file.id === 900).name).toBe(
      "manual-notes.txt",
    );
  });

  it("paginates attachments before deleting matching names", async () => {
    state.release = { id: 42 };
    state.files = Array.from({ length: 100 }, (_, i) => ({
      id: 1000 + i,
      name: `other-${i}`,
      size: 1,
    }));
    state.files.push({ id: 1200, name: "latest.json", size: 0 });
    await syncRelease(options);
    expect(
      state.files.filter((file) => file.name === "latest.json"),
    ).toHaveLength(1);
    expect(state.files).toHaveLength(103);
  });

  it("reports authentication failure without leaking the token or changing metadata", async () => {
    options.giteeToken = "invalid";
    const error = await syncRelease(options).catch((error) => error);
    expect(error.message).toContain("HTTP 401");
    expect(error.message).not.toContain("gitee-secret");
    expect(error.message).not.toContain("invalid");
    expect(state.release).toBeNull();
    expect(options.log).not.toHaveBeenCalled();
  });

  it("fails before any requests when the Gitee secret is missing", async () => {
    options.giteeToken = undefined;
    await expect(syncRelease(options)).rejects.toThrow("GITEE_TOKEN");
    expect(state.calls).toHaveLength(0);
    expect(options.synchronizeTag).not.toHaveBeenCalled();
  });

  it("preserves an existing attachment if its GitHub download fails", async () => {
    state.release = { id: 42 };
    state.files = [{ id: 200, name: "uxs-2.1.4-win-x64.msi", size: 0 }];
    state.fail = "GET /download/uxs-2.1.4-win-x64.msi";
    await expect(syncRelease(options)).rejects.toThrow("HTTP 500");
    expect(state.files).toEqual([
      { id: 200, name: "uxs-2.1.4-win-x64.msi", size: 0 },
    ]);
    expect(state.calls.some((call) => call.startsWith("DELETE"))).toBe(false);
  });

  it("reports upload failure and succeeds on a later retry", async () => {
    state.fail =
      "POST /gitee/repos/unraous/uxuescript/releases/42/attach_files";
    await expect(syncRelease(options)).rejects.toThrow("HTTP 500");
    expect(state.release).not.toBeNull();
    state.fail = null;
    await syncRelease(options);
    expect(state.files).toHaveLength(3);
  });

  it("rejects an attachment whose remote size differs", async () => {
    state.badSize = true;
    await expect(syncRelease(options)).rejects.toThrow(
      "Gitee attachment verification failed",
    );
  });

  it("stops before modifying Gitee when tag synchronization fails", async () => {
    options.synchronizeTag.mockImplementation(() => {
      throw new Error("different commit");
    });
    await expect(syncRelease(options)).rejects.toThrow("different commit");
    expect(state.calls.some((call) => call.includes("/gitee/"))).toBe(false);
  });
});

describe("tag synchronization", () => {
  it("pushes missing tags and accepts existing lightweight or annotated tags at the same commit", async () => {
    directory = await mkdtemp(join(tmpdir(), "uxs-tag-test-"));
    const cwd = join(directory, "source"),
      remote = join(directory, "remote.git");
    await mkdir(cwd);
    const run = (...args) => {
      const result = spawnSync("git", args, { cwd, encoding: "utf8" });
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };
    run("init");
    run("init", "--bare", remote);
    run("config", "user.name", "test");
    run("config", "user.email", "test@example.invalid");
    run("config", "commit.gpgsign", "false");
    run("config", "tag.gpgsign", "false");
    await writeFile(join(cwd, "file.txt"), "first");
    run("add", ".");
    run("commit", "-m", "first");
    const commit = run("rev-parse", "HEAD");
    for (const tag of ["v1", "v2"]) {
      run("tag", ...(tag === "v2" ? ["-a", "-m", "annotated"] : []), tag);
      const input = { tag, cwd, remote, user: "test", token: "unused-secret" };
      expect(syncTag(input)).toBe(commit);
      expect(syncTag(input)).toBe(commit);
    }
    await writeFile(join(cwd, "file.txt"), "second");
    run("commit", "-am", "second");
    run("tag", "-f", "v1");
    expect(() =>
      syncTag({ tag: "v1", cwd, remote, user: "test", token: "unused-secret" }),
    ).toThrow("different commit");
    expect(run("ls-remote", remote, "refs/tags/v1")).toContain(commit);
  });
});
