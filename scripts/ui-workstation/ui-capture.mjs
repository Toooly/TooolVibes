#!/usr/bin/env node
// Deterministic 390x844-first capture with provenance sidecar.
// Usage: node scripts/ui-workstation/ui-capture.mjs --route / --viewport 390x844 --output artifacts/.../shot.png [--state production] [--server http://localhost:3010] [--post-actions sheet|footer|none]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);
const route = args.route ?? "/";
const [vw, vh] = (args.viewport ?? "390x844").split("x").map(Number);
const output = args.output ?? "artifacts/shot.png";
const state = args.state ?? "production";
const server = (args.server ?? "http://localhost:3010").replace(/\/$/, "");
const postActions = args["post-actions"] ?? "none";

const gitSha = execSync("git rev-parse HEAD").toString().trim();
let runtimeSha = null;
try {
  const rel = await (await fetch(`${server}/api/release`)).json();
  runtimeSha = rel.sha ?? rel.git_sha ?? null;
} catch { runtimeSha = null; }
const serverPid = args.pid ? Number(args.pid) : null;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, colorScheme: "dark", locale: "it-IT" });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
page.setDefaultTimeout(30000);
await page.goto(server + route, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("button", { name: /Rifiuta/i }).click({ timeout: 2500 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(400);
if (postActions === "sheet") {
  await page.getByRole("button", { name: /Valuta|Decidi|Rivedi/i }).first().click({ timeout: 8000 });
  await page.waitForTimeout(800);
}
const scrollY = await page.evaluate(() => window.scrollY);
fs.mkdirSync(path.dirname(output), { recursive: true });
await page.screenshot({ path: output });
const sidecar = {
  git_sha: gitSha, runtime_sha: runtimeSha, route, viewport: `${vw}x${vh}`,
  scrollY, timestamp: new Date().toISOString(), server_pid: serverPid,
  server_port: Number(new URL(server).port), state,
  evidence_type: state === "production" ? "production" : "visual-harness",
  page_errors: pageErrors,
};
fs.writeFileSync(output.replace(/\.png$/, ".json"), JSON.stringify(sidecar, null, 2));
console.log(JSON.stringify({ output, ...sidecar }));
await browser.close();
