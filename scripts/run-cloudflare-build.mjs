import { readFileSync } from "node:fs";
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
};

delete env.SUPABASE_SERVICE_ROLE_KEY;

console.log(
  `[cloudflare-build] NEXT_PUBLIC_SUPABASE_URL=${env.NEXT_PUBLIC_SUPABASE_URL}`,
);

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
process.exit(patch.status ?? 1);
