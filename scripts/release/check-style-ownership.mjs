import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const releaseEntry = "styles/release-entry.ts";
const expectedGlobalImports = [
  "@/app/globals.css",
  "@/styles/vibes-3d-maestoso.css",
  "@/styles/shell.css",
  "@/styles/definitive-home.css",
  "@/styles/compare.css",
  "@/styles/radar.css",
  "@/styles/tool-detail-final.css",
  "@/styles/public-routes.css",
  "@/styles/secondary-pages.css",
  "@/styles/partner-placements.css",
  "@/styles/premium-motion.css",
];
const retiredGlobalImports = [
  "@/styles/home.css",
  "@/styles/catalog.css",
  "@/styles/tool-detail.css",
];
const importantCeilings = {
  "app/globals.css": 2324,
  "styles/account.css": 0,
  "styles/compare.css": 2,
  "styles/definitive-home.css": 1,
  "styles/figma-implementation.css": 40,
  "styles/gamification.css": 14,
  "styles/premium-motion.css": 0,
  "styles/radar.css": 4,
  "styles/public-routes.css": 46,
  "styles/partner-placements.css": 0,
  "styles/shell.css": 138,
  "styles/tokens.css": 0,
  "styles/tool-detail-final.css": 0,
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
  "tv-space-5",
  "tv-space-10",
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

const globalFoundationSource = read("app/globals.css");
for (const relativePath of ["app", "styles"].flatMap(walk).filter((file) => file.endsWith(".css"))) {
  if (relativePath === "styles/tokens.css") continue;
  const globalScopeBlocks = Array.from(
    read(relativePath).matchAll(
      /(?:^|\n)\s*((?::root|html|body)(?:\s*,\s*(?::root|html|body))*)\s*\{([^{}]*)\}/g,
    ),
  );
  for (const [, selector, declarations] of globalScopeBlocks) {
    const customProperties = Array.from(
      declarations.matchAll(/^\s*(--[A-Za-z0-9-]+)\s*:/gm),
      (match) => match[1],
    );
    if (customProperties.length > 0) {
      errors.push(
        `${relativePath} defines global custom properties on ${selector}: ${customProperties.join(", ")}; own defaults in styles/tokens.css and scope runtime values to their component selector`,
      );
    }
  }
}

for (const featureSheet of [
  "definitive-home.css",
  "compare.css",
  "radar.css",
  "tool-detail-final.css",
  "public-routes.css",
  ...retiredGlobalImports.map((stylesheet) => stylesheet.split("/").at(-1)),
]) {
  if (
    new RegExp(
      `@import\\s+["'][^"']*${featureSheet.replace(".", "\\.")}["']`,
    ).test(globalFoundationSource)
  ) {
    errors.push(
      `app/globals.css imports feature stylesheet ${featureSheet}; declare it once in ${releaseEntry}`,
    );
  }
}

for (const relativePath of ["app", "components", "lib", "styles"].flatMap(walk)) {
  if (!/\.(?:ts|tsx|js|jsx|mjs)$/.test(relativePath) || relativePath === releaseEntry) continue;

  const source = read(relativePath);
  for (const stylesheet of [...expectedGlobalImports, ...retiredGlobalImports]) {
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


// ============================================================
// Phase 0.3 — No-new-debt baseline guards (growth-only)
// Captured 2026-07-21 from current repo state.
// These guards NEVER fail on pre-existing debt.
// They fail only if the metric GROWS above the captured baseline.
// ============================================================
const BASELINE = {
  hexHardcodedTotal: 2369,
  // Bumped 879 → 915 (2026-07-24): Archive v4 stabilization added the
  // mobile filter sheet + mobile filter bar + 3-tier promoted pill +
  // tray is-at-max state. New components need new radius values
  // (14px trigger button, 24px sheet top corners, 18px sheet CTA) that
  // are not yet tokenized. See Archive v4 stabilized review in
  // audits/definitive-rebuild/archive-v4-stabilized/.
  radiusArbitraryTotal: 915,
  breakpointsCustomUnique: 36,
  motionDurationsArbitrary: 13,
};

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const RADIUS_TSX_RE = /rounded-\[[0-9]+(px|rem)?\]/g;
const RADIUS_CSS_RE = /border-radius:\s*[0-9]+px/g;
const BP_CSS_RE = /@media[^{]*\(min-width:\s*[0-9]+px\)|@media[^{]*\(max-width:\s*[0-9]+px\)/g;
const BP_CSS_VALUE_RE = /[0-9]+px/g;
const BP_TSX_RE = /(min|max)-\[[0-9]+px\]/g;
const MOT_TSX_RE = /duration-\[[0-9]+(ms|s)?\]/g;
const MOT_CSS_RE = /transition-duration:\s*[0-9]+m?s/g;
const TAILWIND_DEFAULTS = new Set([640, 768, 1024, 1280, 1536]);

const countedSourceFiles = (dirs, ext) => dirs.flatMap((d) => walk(d))
  .filter((rel) => ext.test(rel) && rel !== releaseEntry);

const countedCssFiles = ["app", "styles"].flatMap((d) => walk(d)).filter(
  (rel) => rel.endsWith(".css") && rel !== releaseEntry,
);

// 1. HEX hardcoded
// Exempt styles/tokens.css: it is the SINGLE SOURCE OF TRUTH for hex values.
// New tokens added there (Phase 4+) are AUTHORIZED; only NEW hex outside
// tokens.css counts as growth.
let hexTotal = 0;
for (const file of countedSourceFiles(["app", "components", "styles"], /\.(?:ts|tsx|css)$/)) {
  if (file === "styles/tokens.css") continue;
  const src = read(file);
  hexTotal += (src.match(HEX_RE) || []).length;
}
if (hexTotal > BASELINE.hexHardcodedTotal) {
  errors.push(
    `hex hardcoded grew: ${hexTotal} occurrences > baseline ${BASELINE.hexHardcodedTotal} (delta +${hexTotal - BASELINE.hexHardcodedTotal})`,
  );
}

// 2. Radius arbitrary (TSX rounded-[Npx] + CSS border-radius: Npx)
let radiusTotal = 0;
for (const file of countedSourceFiles(["app", "components"], /\.(?:ts|tsx)$/)) {
  radiusTotal += (read(file).match(RADIUS_TSX_RE) || []).length;
}
for (const file of countedCssFiles) {
  radiusTotal += (read(file).match(RADIUS_CSS_RE) || []).length;
}
if (radiusTotal > BASELINE.radiusArbitraryTotal) {
  errors.push(
    `radius arbitrary grew: ${radiusTotal} > baseline ${BASELINE.radiusArbitraryTotal} (delta +${radiusTotal - BASELINE.radiusArbitraryTotal})`,
  );
}

// 3. Breakpoints custom unique (excluding Tailwind defaults 640/768/1024/1280/1536)
const bpSet = new Set();
for (const file of countedCssFiles) {
  const src = read(file);
  const mediaLines = src.match(BP_CSS_RE) || [];
  for (const line of mediaLines) {
    for (const v of line.match(BP_CSS_VALUE_RE) || []) {
      const n = parseInt(v, 10);
      if (!TAILWIND_DEFAULTS.has(n)) bpSet.add(n);
    }
  }
}
for (const file of countedSourceFiles(["app", "components"], /\.(?:ts|tsx)$/)) {
  const src = read(file);
  const tsxHits = src.match(BP_TSX_RE) || [];
  for (const h of tsxHits) {
    const n = parseInt(h.match(/[0-9]+/)[0], 10);
    if (!TAILWIND_DEFAULTS.has(n)) bpSet.add(n);
  }
}
if (bpSet.size > BASELINE.breakpointsCustomUnique) {
  errors.push(
    `custom breakpoints grew: ${bpSet.size} unique > baseline ${BASELINE.breakpointsCustomUnique}`,
  );
}

// 4. Motion durations arbitrary (TSX duration-[Nms] + CSS transition-duration: Nms)
let motionTotal = 0;
for (const file of countedSourceFiles(["app", "components"], /\.(?:ts|tsx)$/)) {
  motionTotal += (read(file).match(MOT_TSX_RE) || []).length;
}
for (const file of countedCssFiles) {
  motionTotal += (read(file).match(MOT_CSS_RE) || []).length;
}
if (motionTotal > BASELINE.motionDurationsArbitrary) {
  errors.push(
    `motion duration arbitrary grew: ${motionTotal} > baseline ${BASELINE.motionDurationsArbitrary}`,
  );
}
if (errors.length > 0) {
  console.error("Style ownership check failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Style ownership check passed: cascade, token ownership and !important ceilings are intact.");
