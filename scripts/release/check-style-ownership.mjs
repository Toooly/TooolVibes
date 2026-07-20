import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const releaseEntry = "styles/release-entry.ts";
const expectedGlobalImports = [
  "@/app/globals.css",
  "@/styles/vibes-3d-maestoso.css",
  "@/styles/figma-final-polish.css",
];
const importantCeilings = {
  "app/globals.css": 2324,
  "styles/account.css": 0,
  "styles/catalog.css": 0,
  "styles/compare.css": 2,
  "styles/depth-scene.css": 0,
  "styles/figma-final-polish.css": 257,
  "styles/figma-implementation.css": 40,
  "styles/gamification.css": 14,
  "styles/home.css": 0,
  "styles/radar.css": 4,
  "styles/tokens.css": 0,
  "styles/vibes-3d-maestoso.css": 873,
};
const canonicalTokenNames = [
  "tv-bg-base",
  "tv-surface-raised",
  "tv-surface-elevated",
  "tv-ink-primary",
  "tv-ink-secondary",
  "tv-ink-muted-aa",
  "tv-accent-aa",
  "tv-focus-ring",
  "tv-space-1",
  "tv-radius-md",
  "tv-elevation-rest",
  "tv-motion-base",
  "tv-z-overlay",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return walk(relativePath);
    return entry.isFile() ? [relativePath] : [];
  });
}

const errors = [];
const entrySource = read(releaseEntry);
const actualGlobalImports = Array.from(
  entrySource.matchAll(/import\s+["']([^"']+\.css)["'];?/g),
  (match) => match[1],
);

if (JSON.stringify(actualGlobalImports) !== JSON.stringify(expectedGlobalImports)) {
  errors.push(
    `${releaseEntry} import order changed: ${actualGlobalImports.join(" -> ") || "none"}`,
  );
}

for (const relativePath of ["app", "components", "lib", "styles"].flatMap(walk)) {
  if (!/\.(?:ts|tsx|js|jsx|mjs)$/.test(relativePath) || relativePath === releaseEntry) continue;

  const source = read(relativePath);
  for (const stylesheet of expectedGlobalImports) {
    if (source.includes(stylesheet)) {
      errors.push(`${relativePath} imports global stylesheet ${stylesheet}; use ${releaseEntry}`);
    }
  }
}

for (const [relativePath, ceiling] of Object.entries(importantCeilings)) {
  const count = read(relativePath).match(/!important\b/g)?.length ?? 0;
  if (count > ceiling) {
    errors.push(`${relativePath} adds ${count - ceiling} !important declaration(s) above its baseline`);
  }
}

for (const relativePath of ["app", "styles"].flatMap(walk).filter((file) => file.endsWith(".css"))) {
  if (relativePath === "styles/tokens.css") continue;
  const source = read(relativePath);
  for (const tokenName of canonicalTokenNames) {
    if (new RegExp(`--${tokenName}\\s*:`).test(source)) {
      errors.push(`${relativePath} redefines canonical token --${tokenName}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Style ownership check failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Style ownership check passed: cascade, token ownership and !important ceilings are intact.");
