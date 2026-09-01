import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export const PRODUCTION_WORKER_NAME = "tooolvibes";
export const PRODUCTION_ACCOUNT_ID = "ffacd11bfafdca87d540a6c5fbe89120";
export const PRODUCTION_RELEASE_URL = "https://tooolvibes.eu/api/release";
const SHA_RE = /^[0-9a-f]{40}$/;

export function loadWranglerJsonc(root) {
  const text = readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  const withoutBlock = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLine = withoutBlock
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return "";
      return line.replace(/(^|[^:])\/\/.*$/, "$1");
    })
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(withoutLine);
}

export function assertProductionDeployContext({
  branch,
  trackedPorcelain,
  head,
  originMain,
  workerName,
  accountId,
  sha,
}) {
  const errors = [];
  if (branch !== "main") {
    errors.push(`branch must be main, got ${branch}`);
  }
  if (String(trackedPorcelain ?? "").trim()) {
    errors.push("tracked working tree is dirty");
  }
  if (!SHA_RE.test(head ?? "")) {
    errors.push("HEAD is not a full 40-character SHA");
  }
  if (!SHA_RE.test(originMain ?? "")) {
    errors.push("origin/main is not a full 40-character SHA");
  }
  if (head !== originMain) {
    errors.push("local HEAD does not match origin/main");
  }
  if (!SHA_RE.test(sha ?? "") || sha !== head) {
    errors.push("release SHA must match local HEAD");
  }
  if (workerName !== PRODUCTION_WORKER_NAME) {
    errors.push(`worker name must be ${PRODUCTION_WORKER_NAME}, got ${workerName}`);
  }
  if (accountId !== PRODUCTION_ACCOUNT_ID) {
    errors.push("wrangler account_id is not the production account");
  }
  if (errors.length > 0) {
    throw new Error(`Production deploy blocked:\n- ${errors.join("\n- ")}`);
  }
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

export function collectProductionDeployContext(root) {
  git(root, ["fetch", "origin", "main"]);
  const wrangler = loadWranglerJsonc(root);
  return {
    branch: git(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
    trackedPorcelain: git(root, [
      "status",
      "--porcelain=v1",
      "--untracked-files=no",
    ]),
    head: git(root, ["rev-parse", "HEAD"]),
    originMain: git(root, ["rev-parse", "origin/main"]),
    workerName: wrangler.name,
    accountId: wrangler.account_id,
    sha: git(root, ["rev-parse", "HEAD"]),
  };
}

export async function assertProductionReleaseSha(expectedSha, {
  url = PRODUCTION_RELEASE_URL,
  attempts = 12,
  delayMs = 2500,
  fetchImpl = fetch,
} = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    const response = await fetchImpl(url, { headers: { accept: "application/json" } });
    last = await response.json();
    if (last?.sha === expectedSha) return last;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(
    `Production /api/release SHA mismatch after deploy (expected ${expectedSha}, got ${last?.sha ?? "unknown"})`,
  );
}
