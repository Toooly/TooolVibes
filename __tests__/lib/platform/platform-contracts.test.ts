import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const feedbackSrc = readFileSync("lib/feedback/index.ts", "utf8");
const hapticsSrc = readFileSync("lib/haptics/index.ts", "utf8");
const capsSrc = readFileSync("lib/platform/capabilities.ts", "utf8");
const toolCss = readFileSync("styles/tool-detail-final.css", "utf8");

function sourceFiles(): Array<{ path: string; src: string }> {
  // Static contract: scan real component/app/lib sources (not tests, not impl).
  const out = execSync(
    'git grep -l --fixed-strings -- "navigator.vibrate" -- components app lib',
    { encoding: "utf8" },
  ) as string;
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((path) => ({ path, src: readFileSync(path, "utf8") }));
}

describe("platform static contracts", () => {
  it("no component-level navigator.vibrate outside canonical services", () => {
    // capabilities.ts only feature-detects support (boolean); the only
    // TRIGGER lives in lib/feedback. lib/haptics is the compat re-export.
    const allowed = new Set([
      "lib/feedback/index.ts",
      "lib/haptics/index.ts",
      "lib/platform/capabilities.ts",
    ]);
    for (const { path } of sourceFiles()) {
      expect(allowed.has(path), `direct vibrate in ${path}`).toBe(true);
    }
  });

  it("no haptic audio fallback anywhere in source", () => {
    const hay = feedbackSrc + hapticsSrc + capsSrc;
    expect(hay).not.toMatch(/AudioContext/i);
    expect(hay).not.toMatch(/createOscillator/i);
    expect(hay).not.toMatch(/new Audio\(/);
  });

  it("no duplicated platform detection outside the capability layer", () => {
    const out = execSync('git grep -n --fixed-strings -- "navigator.userAgent" -- components app lib', {
      encoding: "utf8",
    }) as string;
    const rows = out.split("\n").map((s) => s.trim()).filter(Boolean);
    // UA inference lives ONLY in lib/platform (where no capability API answers).
    for (const row of rows) {
      expect(row.startsWith("lib/platform/"), `UA sniff in ${row}`).toBe(true);
    }
  });

  it("tool detail section nav never scrolls horizontally", () => {
    expect(toolCss).not.toMatch(/\.td-final-decision-nav\s*\{[^}]*overflow-x:\s*auto/);
  });

  it("compare reducer never auto-expands from scroll", () => {
    const src = readFileSync("lib/shell/compare-chrome.ts", "utf8");
    expect(src).not.toContain("COMPARE_EXPAND_DELTA");
    expect(src).not.toMatch(/chrome:\s*"expanded", down: 0, up: 0 \};?\s*$/m);
  });
});
