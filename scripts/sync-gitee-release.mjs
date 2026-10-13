import { spawnSync } from "node:child_process";
import { createWriteStream, openAsBlob } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";

function git(args, cwd, env = process.env) {
  const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  // Git errors can contain authentication details; report the operation without its output.
  if (result.error || result.status !== 0)
    throw new Error(`Git ${args[0]} failed`);
  return result.stdout.trim();
}

export function syncTag({ tag, remote, cwd, user, token }) {
  git(["check-ref-format", `refs/tags/${tag}`], cwd);
  const commit = git(["rev-parse", `refs/tags/${tag}^{commit}`], cwd);
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://gitee.com/.extraheader",
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${Buffer.from(`${user}:${token}`).toString("base64")}`,
  };
  const refs = git(
    ["ls-remote", remote, `refs/tags/${tag}`, `refs/tags/${tag}^{}`],
    cwd,
    env,
  )
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(/\s+/));
  const existing = refs.find(([, ref]) => ref.endsWith("^{}")) ?? refs[0];
  if (existing && existing[0] !== commit)
    throw new Error(
      `Gitee tag ${tag} points to a different commit; refusing to overwrite it`,
    );
  if (!existing)
    git(["push", remote, `refs/tags/${tag}:refs/tags/${tag}`], cwd, env);
  return commit;
}

async function request(url, { token, ...options } = {}, allowMissing = false) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (allowMissing && response.status === 404) return null;
  // Avoid echoing server bodies or URLs that might include credentials.
  if (!response.ok)
    throw new Error(
      `${options.method ?? "GET"} ${new URL(url).pathname}: HTTP ${response.status}`,
    );
  return response;
}

export async function syncRelease({
  githubRepo,
  giteeRepo,
  tag,
  githubToken,
  giteeToken,
  githubApi = "https://api.github.com",
  giteeApi = "https://gitee.com/api/v5",
  cwd = process.cwd(),
  remote = `https://gitee.com/${giteeRepo}.git`,
  synchronizeTag = syncTag,
  log = console.log,
}) {
  for (const repo of [githubRepo, giteeRepo]) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
      throw new Error("Repository must be owner/name");
  }
  if (!giteeToken)
    throw new Error(
      "Set the GITEE_TOKEN repository secret before synchronizing releases",
    );
  const source = await (
    await request(
      `${githubApi}/repos/${githubRepo}/releases/tags/${encodeURIComponent(tag)}`,
      { token: githubToken },
    )
  ).json();
  if (source.draft || source.tag_name !== tag)
    throw new Error(
      "Source must be a published GitHub Release with the requested tag",
    );
  const commit = synchronizeTag({
    tag,
    remote,
    cwd,
    token: giteeToken,
    user: giteeRepo.split("/")[0],
  });
  const base = `${giteeApi}/repos/${giteeRepo}/releases`;
  const api = (url, options = {}, missing = false) =>
    request(url, { token: giteeToken, ...options }, missing);
  const found = await api(`${base}/tags/${encodeURIComponent(tag)}`, {}, true);
  const existing = found ? await found.json() : null;
  const release = await (
    await api(existing ? `${base}/${existing.id}` : base, {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_name: tag,
        name: source.name || tag,
        body: source.body || "",
        target_commitish: commit,
        prerelease: source.prerelease,
      }),
    })
  ).json();
  const attachmentsUrl = `${base}/${release.id}/attach_files`;
  async function attachments() {
    const files = [];
    let pageFiles;
    for (let page = 1; page === 1 || pageFiles.length === 100; page++) {
      pageFiles = await (
        await api(`${attachmentsUrl}?page=${page}&per_page=100`)
      ).json();
      files.push(...pageFiles);
    }
    return files;
  }
  const previous = await attachments();
  const directory = await mkdtemp(join(tmpdir(), "uxs-gitee-release-"));
  try {
    for (const asset of source.assets) {
      // Asset names become local paths, so reject names that escape the temporary directory.
      if (basename(asset.name) !== asset.name || /[\\/]/.test(asset.name))
        throw new Error("Release attachment name must be a filename");
      const file = join(directory, asset.name);
      const download = await request(asset.url, {
        token: githubToken,
        headers: { Accept: "application/octet-stream" },
      });
      await pipeline(Readable.fromWeb(download.body), createWriteStream(file));
      if ((await stat(file)).size !== asset.size)
        throw new Error(`Downloaded attachment size mismatch: ${asset.name}`);
      // Download successfully before removing the old attachment, so failed downloads preserve it.
      for (const old of previous.filter((entry) => entry.name === asset.name))
        await api(`${attachmentsUrl}/${old.id}`, { method: "DELETE" });
      const form = new FormData();
      form.set("file", await openAsBlob(file), asset.name);
      await api(attachmentsUrl, { method: "POST", body: form });
      log(`Uploaded ${asset.name}`);
    }
    const uploaded = await attachments();
    for (const asset of source.assets) {
      const matches = uploaded.filter((file) => file.name === asset.name);
      if (matches.length !== 1 || matches[0].size !== asset.size)
        throw new Error(`Gitee attachment verification failed: ${asset.name}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  const url = `https://gitee.com/${giteeRepo}/releases/tag/${encodeURIComponent(tag)}`;
  log(`Synchronized Release: ${url}`);
  return url;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [githubRepo, tag, giteeRepo, ...extra] = process.argv.slice(2);
  try {
    if (!githubRepo || !tag || !giteeRepo || extra.length)
      throw new Error(
        "Usage: node scripts/sync-gitee-release.mjs <github-owner/repo> <tag> <gitee-owner/repo>",
      );
    await syncRelease({
      githubRepo,
      tag,
      giteeRepo,
      githubToken: process.env.GITHUB_TOKEN,
      giteeToken: process.env.GITEE_TOKEN,
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
