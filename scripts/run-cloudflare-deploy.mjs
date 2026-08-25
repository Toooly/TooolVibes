import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha =
  process.env.TOOOLVIBES_RELEASE_SHA ??
  spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();

const env = {
  ...process.env,
  TOOOLVIBES_RELEASE_SHA: sha,
  TOOOLVIBES_RELEASE_NAME:
    process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes V1.0 MVP GM Release",
  TOOOLVIBES_BUILD_TIMESTAMP:
    process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? new Date().toISOString(),
};

const deploy = spawnSync("npx", ["opennextjs-cloudflare", "deploy"], {
  cwd: root,
  env,
  stdio: "inherit",
});
process.exit(deploy.status ?? 1);
