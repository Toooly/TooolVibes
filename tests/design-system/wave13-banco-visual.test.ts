import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { WORKSPACE_SCHEMA_VERSION } from "@/lib/discovery/workspace-constants";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function tokensFrom(source: string) {
  return Object.fromEntries(
    Array.from(source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi), (match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

const tokens = tokensFrom(read("styles/tokens.css"));
const accountCss = read("app/(marketing)/account/account.css");
const commandTsx = read("components/ui/command.tsx");
const compareCss = read("styles/compare.css");

describe("Wave 13 — Banco visual contract", () => {
  it("W13-T1 adds Banco aliases without redefining locked canvas/brand/space/radius", () => {
    expect(tokens["tv-kicker-tracking"]).toBe("0.12em");
    expect(tokens["tv-due-dot"]).toBe("var(--tv-status-warning)");
    expect(tokens["tv-due-dot-size"]).toBe("6px");
    expect(tokens["tv-compare-live"]).toBe("var(--tv-accent-brand)");
    expect(tokens["tv-grain-opacity"]).toBe("0.03");
    expect(tokens["tv-selection-wash"]).toBe("var(--tv-surface-selected)");
    expect(tokens["tv-surface-selected"]).toContain("var(--tv-accent-brand)");
    expect(tokens["tv-surface-1"]).toBe("var(--tv-surface-raised)");
    expect(tokens["tv-surface-2"]).toBe("var(--tv-surface-elevated)");
    expect(tokens["tv-surface-3"]).toBe("var(--tv-surface-floating)");

    expect(tokens["tv-color-surface-base"]).toBe("#08080a");
    expect(tokens["tv-accent-brand"]).toBe("var(--tv-color-violet-500)");
    expect(tokens["tv-color-violet-500"]).toBe("#6a3cff");
    expect(tokens["tv-space-1"]).toBe("var(--tv-space-px-1)");
    expect(tokens["tv-radius-sm"]).toBe("var(--tv-radius-control)");
  });

  it("W13-T10 grain and leftover orbs do not intercept pointer", () => {
    expect(accountCss).not.toMatch(/--tv-pointer-x/);
    expect(accountCss).not.toMatch(/scale\(1\.04\)/);
    expect(accountCss).not.toMatch(/scale\(1\.08\)/);

    const grain = accountCss.match(/\.tv-app--atelier::after\s*\{[^}]+\}/);
    expect(grain?.[0]).toMatch(/pointer-events:\s*none/);
    expect(grain?.[0]).toMatch(/opacity:\s*var\(--tv-grain-opacity\)/);

    expect(accountCss).toMatch(/\.tv-tool-mark__jewel[\s\S]*?pointer-events:\s*none/);
    expect(accountCss).toMatch(/\.tv-tool-mark::after[\s\S]*?pointer-events:\s*none/);
    expect(accountCss).toMatch(/\.tv-mod--resume::before[\s\S]*?pointer-events:\s*none/);

    const orb = compareCss.match(/\.tool-fighter__orb\s*\{[^}]+\}/);
    expect(orb?.[0]).toMatch(/pointer-events:\s*none/);
    expect(orb?.[0]).toMatch(/display:\s*none/);
  });

  it("W13-T11 reduced-motion turns grain, orbs, and jewel lift off", () => {
    expect(accountCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tv-app--atelier::after[\s\S]*?display:\s*none/,
    );
    expect(accountCss).toMatch(
      /html\[data-tv-reduce-motion="true"\][\s\S]*?\.tv-app--atelier::after[\s\S]*?display:\s*none/,
    );
    expect(accountCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tv-lib-row:hover \.tv-tool-mark[\s\S]*?transform:\s*none/,
    );
    expect(accountCss).toMatch(
      /html\[data-tv-reduce-motion="true"\] \.tv-lib-row:hover \.tv-tool-mark[\s\S]*?transform:\s*none/,
    );
    expect(compareCss).toMatch(
      /\.tool-fighter\[data-fighting="true"\] \.tool-fighter__orb[\s\S]*?animation:\s*none/,
    );
  });

  it("W13-T9 palette surface no longer uses the leftover hex world", () => {
    expect(commandTsx).not.toMatch(/#17142f|#222a48/);
    expect(commandTsx).toMatch(/--tv-surface-elevated/);
    expect(commandTsx).toMatch(/--tv-bg-base|--tv-border-subtle/);
  });

  it("W13-T13 schemaVersion stays 1", () => {
    expect(WORKSPACE_SCHEMA_VERSION).toBe(1);
  });
});
