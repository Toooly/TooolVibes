import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const gate = readFileSync("components/platform/install-experience-gate.tsx", "utf8");
const sheet = readFileSync("components/platform/install-experience.tsx", "utf8");

describe("install experience gating", () => {
  it("engagement-aware: saved/compare/sessions gate the sheet", () => {
    expect(gate).toContain("savedSlugs");
    expect(gate).toContain("compareSlugs");
    expect(gate).toContain("sessions");
  });

  it("iOS manual path never mentions haptics; Android uses native prompt", () => {
    expect(sheet).toContain("Aggiungi alla schermata Home");
    expect(sheet).toContain("beforeinstallprompt");
    // The only haptic mention is the NEVER-claim guard in the header comment.
    const mentions = sheet.match(/haptic|vibra/gi) ?? [];
    expect(mentions.length).toBeLessThanOrEqual(1);
    expect(sheet).toContain("NEVER claims installation enables haptic feedback");
  });

  it("dismissal persists with cooldown; standalone suppresses", () => {
    expect(sheet).toContain("tooolvibes:install:dismissed:v1");
    expect(sheet).toContain("COOLDOWN");
    expect(sheet).toContain("isStandalone");
    expect(sheet).toContain("isNative");
  });
});
