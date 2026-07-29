import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  MOTION_DURATION_CSS_VAR,
  MOTION_DURATION_MS,
  MOTION_EASING,
  MOTION_EASING_CSS_VAR,
  durationMsToCss,
  easingToCss,
} from "@/lib/motion/tokens";

const root = process.cwd();
const tokenSource = fs.readFileSync(path.join(root, "styles/tokens.css"), "utf8");

function cssDurationMs(varName: string): number {
  const re = new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(\\d+)ms`);
  const match = tokenSource.match(re);
  if (!match) throw new Error(`Missing CSS token ${varName}`);
  return Number(match[1]);
}

function cssEasing(varName: string): string {
  const re = new RegExp(
    `${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(cubic-bezier\\([^)]+\\))`,
  );
  const match = tokenSource.match(re);
  if (!match) throw new Error(`Missing CSS easing ${varName}`);
  return match[1].replace(/\s+/g, "");
}

describe("motion token contract", () => {
  it("exposes the canonical duration scale", () => {
    expect(MOTION_DURATION_MS).toMatchObject({
      instant: 80,
      fast: 120,
      base: 180,
      standard: 240,
      route: 280,
      deliberate: 360,
      reward: 480,
      staggerStep: 40,
      epic: 720,
    });
  });

  it("mirrors CSS duration custom properties exactly", () => {
    for (const [key, cssVar] of Object.entries(MOTION_DURATION_CSS_VAR)) {
      expect(cssDurationMs(cssVar)).toBe(
        MOTION_DURATION_MS[key as keyof typeof MOTION_DURATION_MS],
      );
    }
  });

  it("mirrors CSS easing curves exactly", () => {
    for (const [key, cssVar] of Object.entries(MOTION_EASING_CSS_VAR)) {
      const expected = easingToCss(MOTION_EASING[key as keyof typeof MOTION_EASING]).replace(
        /\s+/g,
        "",
      );
      expect(cssEasing(cssVar)).toBe(expected);
    }
  });

  it("formats duration helpers for CSS", () => {
    expect(durationMsToCss(280)).toBe("280ms");
  });
});
