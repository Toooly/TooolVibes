import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWranglerJsonc } from "./assert-production-deploy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  const sha = result.stdout?.trim() ?? "";
  return result.status === 0 && /^[0-9a-f]{40}$/.test(sha) ? sha : "";
}

const sha =
  process.env.TOOOLVIBES_RELEASE_SHA?.trim() ||
  process.env.WORKERS_CI_COMMIT_SHA?.trim() ||
  gitSha();

const wranglerVars = loadWranglerJsonc(root).vars ?? {};
const env = { ...process.env };

if (sha) {
  env.TOOOLVIBES_RELEASE_SHA = sha;
}
env.TOOOLVIBES_RELEASE_NAME =
  env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes GM — MVP v.1.0.0";
env.TOOOLVIBES_BUILD_TIMESTAMP =
  env.TOOOLVIBES_BUILD_TIMESTAMP ?? new Date().toISOString();

for (const key of [
  "NEXT_PUBLIC_TINYADZ_ENABLED",
  "NEXT_PUBLIC_TINYADZ_SITE_ID",
  "NEXT_PUBLIC_TINYADZ_TEST_MODE",
  "NEXT_PUBLIC_TINYADZ_INLINE_WIDGET_ID",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN",
]) {
  const value = wranglerVars[key];
  if (!env[key] && value != null && String(value).trim() !== "") {
    env[key] = String(value);
  }
}

if (sha) {
  console.log(`[next-release-build] TOOOLVIBES_RELEASE_SHA=${sha}`);
}

const build = spawnSync("npx", ["next", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});
process.exit(build.status ?? 1);
