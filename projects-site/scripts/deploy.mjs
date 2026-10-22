import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const siteKey = config.vars.PROJECTS_TURNSTILE_SITE_KEY;
if (config.name !== "tooolvibes-progetti" || config.vars.SITE_HOST !== "progetti.tooolvibes.eu" || config.routes.length !== 1 || config.routes[0].pattern !== config.vars.SITE_HOST || !config.routes[0].custom_domain) {
  throw new Error("Deployment target does not match the isolated projects site.");
}
if (!siteKey || /^(1x|2x|3x)/.test(siteKey)) {
  throw new Error("Configure a dedicated production Turnstile widget before deploying. Test keys are not permitted.");
}
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
if (git("branch", "--show-current") !== "main" || git("status", "--porcelain", "--", "projects-site").length) {
  throw new Error("Deploy only committed projects-site changes from main.");
}
if (git("ls-remote", "origin", "refs/heads/main").split(/\s/)[0] !== git("rev-parse", "HEAD")) {
  throw new Error("Push and verify main before deploying.");
}
execFileSync(fileURLToPath(new URL("../../node_modules/.bin/wrangler", import.meta.url)), ["deploy", "--config", "projects-site/wrangler.jsonc", "--keep-vars", ...process.argv.slice(2)], { cwd: root, stdio: "inherit" });
