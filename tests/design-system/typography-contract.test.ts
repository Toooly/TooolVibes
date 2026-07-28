import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceCache = new Map<string, string>();

function read(relativePath: string) {
  const cached = sourceCache.get(relativePath);
  if (cached !== undefined) {
    return cached;
  }

  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  sourceCache.set(relativePath, source);
  return source;
}

function walk(relativeDirectory: string): string[] {
  const absolute = path.join(root, relativeDirectory);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? walk(relativePath) : [relativePath];
  });
}

function parseTokens(source: string) {
  return Object.fromEntries(
    Array.from(source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi), (match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function lineNumber(source: string, index: number | undefined) {
  return source.slice(0, index ?? 0).split(/\r?\n/).length;
}

function toPixels(value: string, unit: string) {
  const number = Number(value);
  return unit === "px" ? number : number * 16;
}

const sourceFiles = ["app", "components", "lib", "styles"]
  .flatMap(walk)
  .filter((file) => /\.(?:ts|tsx|css)$/.test(file));
const codeFiles = sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file));
const cssFiles = sourceFiles.filter((file) => file.endsWith(".css"));

for (const file of sourceFiles) {
  read(file);
}

describe("release typography contract", () => {
  it("downloads only Manrope and Anton from next/font", () => {
    const layout = read("app/layout.tsx");
    const fontImportFiles = codeFiles.filter((file) =>
      /from\s+["']next\/font\//.test(read(file)),
    );

    expect(fontImportFiles).toEqual(["app/layout.tsx"]);
    expect(layout).toContain(
      'import { Anton, Manrope } from "next/font/google";',
    );
    expect(layout).not.toMatch(/\b(?:Fraunces|Inter|Rubik|Syne)\s*\(/);
    expect(layout).toContain(
      "`${manrope.variable} ${anton.variable}`",
    );
  });

  it("keeps semantic roles, fallbacks and the 12px minimum in tokens", () => {
    const tokens = parseTokens(read("styles/tokens.css"));
    expect(tokens["font-manrope"]).toBeUndefined();
    expect(tokens["font-rubik"]).toBeUndefined();
    expect(tokens["tv-font-family-ui"]).toContain("var(--font-manrope)");
    expect(tokens["tv-font-family-system"]).toContain("var(--font-manrope)");
    expect(tokens["tv-font-family-display"]).toContain("var(--font-anton)");
    expect(tokens["tv-font-family-editorial"]).toBeUndefined();
    expect(tokens["tv-font-ui"]).toBe("var(--tv-font-family-ui)");
    expect(tokens["tv-font-system"]).toBe("var(--tv-font-family-system)");
    expect(tokens["tv-font-display"]).toBe("var(--tv-font-family-display)");
    expect(tokens["tv-text-eyebrow"]).toBe("0.75rem");
    expect(tokens["tv-text-xs"]).toBe("var(--tv-text-eyebrow)");
    expect(Number.parseFloat(tokens["tv-leading-body"])).toBeGreaterThanOrEqual(1.5);
  });

  it("has no public Fraunces or Inter presentation consumer", () => {
    const violations = sourceFiles
      .filter((file) => !file.startsWith("app/(admin)/"))
      .filter((file) => !file.startsWith("components/admin/"))
      .filter((file) =>
        /(?:font-family\s*:[^;]*\b(?:Fraunces|Inter)\b|var\(--font-(?:fraunces|inter)\))/i.test(
          read(file),
        ),
      );
    expect(violations).toEqual([]);
  });

  it("has no circular font token or direct legacy-variable consumer", () => {
    const circular: string[] = [];
    const legacyConsumers: string[] = [];

    for (const file of cssFiles) {
      const source = read(file);
      for (const match of source.matchAll(/--([a-z0-9-]+)\s*:\s*var\(--\1\)/gi)) {
        circular.push(`${file}:${lineNumber(source, match.index)} ${match[0]}`);
      }
      if (
        file !== "styles/tokens.css" &&
        /var\(--font-(?:fraunces|inter|manrope|rubik)\)/i.test(source)
      ) {
        legacyConsumers.push(file);
      }
    }

    expect(circular).toEqual([]);
    expect(legacyConsumers).toEqual([]);
  });

  it("has no arbitrary utility text size below 12px", () => {
    const violations: string[] = [];
    const pattern = /text-\[((?:\d*\.)?\d+)(rem|px)\]/g;

    for (const file of codeFiles) {
      const source = read(file);
      for (const match of source.matchAll(pattern)) {
        const pixels = toPixels(match[1], match[2]);
        if (pixels < 12) {
          const line = lineNumber(source, match.index);
          violations.push(`${file}:${line} ${match[0]}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("has no CSS font-size or clamp minimum below 12px", () => {
    const violations: string[] = [];
    const declaration = /font-size\s*:\s*((?:\d*\.)?\d+)(rem|px)\b/gi;
    const clamp =
      /font-size\s*:\s*clamp\(\s*((?:\d*\.)?\d+)(rem|px)\b/gi;
    const relative = /font-size\s*:\s*((?:\d*\.)?\d+)em\b/gi;

    for (const file of cssFiles) {
      const source = read(file);
      for (const pattern of [declaration, clamp]) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          if (toPixels(match[1], match[2]) < 12) {
            violations.push(
              `${file}:${lineNumber(source, match.index)} ${match[0]}`,
            );
          }
        }
      }
      for (const match of source.matchAll(relative)) {
        if (Number(match[1]) < 1) {
          violations.push(
            `${file}:${lineNumber(source, match.index)} ${match[0]}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("has no inline or canvas font floor below 12px", () => {
    const violations: string[] = [];
    const quotedSize = /fontSize\s*:\s*["']((?:\d*\.)?\d+)(rem|px)["']/g;
    const computedFloor =
      /(?:fontSize\s*:|ctx\.font\s*=.*)\s*[^\n]*?Math\.max\(\s*((?:\d*\.)?\d+)/g;

    for (const file of codeFiles) {
      const source = read(file);
      for (const match of source.matchAll(quotedSize)) {
        if (toPixels(match[1], match[2]) < 12) {
          violations.push(
            `${file}:${lineNumber(source, match.index)} ${match[0]}`,
          );
        }
      }
      for (const match of source.matchAll(computedFloor)) {
        if (Number(match[1]) < 12) {
          violations.push(
            `${file}:${lineNumber(source, match.index)} ${match[0]}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses semantic roles instead of generated font variable consumers", () => {
    const violations = sourceFiles
      .filter((file) => file !== "styles/tokens.css")
      .filter((file) => /var\(--font-(?:inter|anton|manrope)\)/.test(read(file)));

    expect(violations).toEqual([]);
  });

  it("keeps monospace on the canonical functional role", () => {
    const violations = sourceFiles
      .filter((file) => file !== "styles/tokens.css")
      .filter((file) => /var\(--tv-font-mono(?:,|\))/.test(read(file)));

    expect(violations).toEqual([]);
  });
});
