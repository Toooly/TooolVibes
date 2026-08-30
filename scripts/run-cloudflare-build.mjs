import { readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerPath = path.join(root, "wrangler.jsonc");

function loadWranglerVars() {
  const text = readFileSync(wranglerPath, "utf8");
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
  return JSON.parse(withoutLine).vars ?? {};
}

const vars = loadWranglerVars();

function applyTinyAdzDotenv(fileName) {
  const file = path.join(root, fileName);
  try {
    const text = readFileSync(file, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      if (!key.startsWith("NEXT_PUBLIC_TINYADZ_")) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional local/prod dotenv
  }
}
applyTinyAdzDotenv(".env.production");
applyTinyAdzDotenv(".env.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN",
];
for (const key of required) {
  if (!vars[key] || String(vars[key]).includes("127.0.0.1")) {
    console.error(`Invalid or missing production public env in wrangler.jsonc: ${key}`);
    process.exit(1);
  }
}

const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: String(vars.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: String(vars.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_SITE_URL: String(vars.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN: String(vars.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN),
  ALLOWED_AUTH_ORIGINS: String(
    vars.ALLOWED_AUTH_ORIGINS ?? vars.NEXT_PUBLIC_SITE_URL,
  ),
  TOOOLVIBES_RELEASE_SHA:
    process.env.TOOOLVIBES_RELEASE_SHA ??
    spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  TOOOLVIBES_RELEASE_NAME:
    process.env.TOOOLVIBES_RELEASE_NAME ?? "TooolVibes V1.0 MVP GM Release",
  TOOOLVIBES_BUILD_TIMESTAMP:
    process.env.TOOOLVIBES_BUILD_TIMESTAMP ?? new Date().toISOString(),
  NEXT_PUBLIC_TINYADZ_ENABLED: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
  NEXT_PUBLIC_TINYADZ_SITE_ID: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
  NEXT_PUBLIC_TINYADZ_TEST_MODE: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
  TOOOLVIBES_COMMUNITY_READ_ENABLED: String(
    vars.TOOOLVIBES_COMMUNITY_READ_ENABLED ?? "0",
  ),
  TOOOLVIBES_COMMUNITY_WRITE_ENABLED: String(
    vars.TOOOLVIBES_COMMUNITY_WRITE_ENABLED ?? "0",
  ),
  TOOOLVIBES_COMMUNITY_REPORT_ENABLED: String(
    vars.TOOOLVIBES_COMMUNITY_REPORT_ENABLED ?? "0",
  ),
};

delete env.SUPABASE_SERVICE_ROLE_KEY;

console.log(
  `[cloudflare-build] NEXT_PUBLIC_SUPABASE_URL=${env.NEXT_PUBLIC_SUPABASE_URL}`,
);

// stale next dev artifacts can produce incompatible manifests for OpenNext
rmSync(path.join(root, ".next"), { recursive: true, force: true });
rmSync(path.join(root, ".open-next"), { recursive: true, force: true });

const build = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const patch = spawnSync("node", ["scripts/patch-opennext-worker.mjs"], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (patch.status !== 0) process.exit(patch.status ?? 1);

const restore = spawnSync("node", ["scripts/release/restore-next-after-open-next.mjs"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});
process.exit(restore.status ?? 1);
