import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertProductionDeployContext,
  assertProductionReleaseSha,
  collectProductionDeployContext,
} from "./assert-production-deploy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = collectProductionDeployContext(root);
assertProductionDeployContext(context);

const env = {
  ...process.env,
  TOOOLVIBES_RELEASE_SHA: context.sha,
  TOOOLVIBES_RELEASE_NAME:
    process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes GM — MVP v.1.0.0",
  TOOOLVIBES_BUILD_TIMESTAMP:
    process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? new Date().toISOString(),
  CLOUDFLARE_ACCOUNT_ID:
    process.env.CLOUDFLARE_ACCOUNT_ID ?? context.accountId,
};

console.log(`[cloudflare-deploy] worker=${context.workerName}`);
console.log(`[cloudflare-deploy] TOOOLVIBES_RELEASE_SHA=${context.sha}`);

const build = spawnSync("npm", ["run", "build:cloudflare"], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const deploy = spawnSync("npx", ["opennextjs-cloudflare", "deploy"], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

try {
  const release = await assertProductionReleaseSha(context.sha);
  console.log(`[cloudflare-deploy] production /api/release sha=${release.sha}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
