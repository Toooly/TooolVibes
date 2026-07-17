import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const tokenSource = fs.readFileSync(path.join(root, "styles/tokens.css"), "utf8");

function tokensFrom(source: string) {
  return Object.fromEntries(
    Array.from(source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi), (match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function relativeLuminance(hex: string) {
  const values = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );

  if (!values || values.length !== 3) throw new Error(`Invalid color ${hex}`);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(foreground: string, background: string) {
  const left = relativeLuminance(foreground);
  const right = relativeLuminance(background);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

const tokens = tokensFrom(tokenSource);

describe("release design token contract", () => {
  it("keeps the canonical spacing, radius and layer scales explicit", () => {
    expect(
      [1, 2, 3, 4, 6, 8, 12, 16, 24].map((step) => tokens[`tv-space-${step}`]),
    ).toEqual([
      "0.25rem",
      "0.5rem",
      "0.75rem",
      "1rem",
      "1.5rem",
      "2rem",
      "3rem",
      "4rem",
      "6rem",
    ]);
    expect([
      tokens["tv-radius-sm"],
      tokens["tv-radius-md"],
      tokens["tv-radius-lg"],
      tokens["tv-radius-feature"],
      tokens["tv-radius-pill"],
    ]).toEqual(["0.375rem", "0.625rem", "1rem", "1.5rem", "999px"]);
    expect(
      ["base", "content", "sticky", "nav", "overlay", "modal", "floating", "toast", "effects"].map(
        (layer) => Number(tokens[`tv-z-${layer}`]),
      ),
    ).toEqual([0, 1, 10, 50, 80, 90, 100, 110, 120]);
  });

  it("keeps floating portals and toasts on their semantic release layers", () => {
    for (const relativePath of [
      "components/ui/popover.tsx",
      "components/ui/dropdown-menu.tsx",
      "components/ui/select.tsx",
      "components/ui/tooltip.tsx",
    ]) {
      const source = fs.readFileSync(path.join(root, relativePath), "utf8");
      expect(source).toContain("z-[var(--tv-z-floating)]");
      expect(source).not.toMatch(/\bz-50\b/);
    }

    const toaster = fs.readFileSync(
      path.join(root, "components/ui/sonner.tsx"),
      "utf8",
    );
    expect(toaster).toContain("z-[var(--tv-z-toast)]");
    expect(toaster).not.toMatch(/\bz-50\b/);
  });

  it.each([
    ["tv-ink-primary", "tv-bg-base", 4.5],
    ["tv-ink-secondary", "tv-bg-base", 4.5],
    ["tv-ink-muted-aa", "tv-bg-base", 4.5],
    ["white", "tv-accent-aa", 4.5],
    ["tv-focus-ring", "tv-bg-base", 3],
  ])("meets contrast for %s on %s", (foregroundName, backgroundName, minimum) => {
    const foreground = foregroundName === "white" ? "#ffffff" : tokens[foregroundName];
    const background = tokens[backgroundName];
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps the global cascade in its certified order", () => {
    const entry = fs.readFileSync(path.join(root, "styles/release-entry.ts"), "utf8");
    const imports = Array.from(
      entry.matchAll(/import\s+["']([^"']+\.css)["'];?/g),
      (match) => match[1],
    );

    expect(imports).toEqual([
      "@/app/globals.css",
      "@/styles/vibes-3d-maestoso.css",
      "@/styles/figma-final-polish.css",
    ]);
  });
});
