import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("feedback wiring (restrained policy)", () => {
  it("save + compare on tool detail use canonical feedback", () => {
    const src = readFileSync(
      "components/tool-detail-final/tool-detail-action-surface.tsx",
      "utf8",
    );
    expect(src).toContain('from "@/lib/feedback"');
    expect(src).toContain("feedback.success()");
    expect(src).toContain("feedback.selection()");
  });

  it("bottom nav taps carry no feedback (ordinary navigation)", () => {
    const src = readFileSync("components/layout/mobile-bottom-nav.tsx", "utf8");
    expect(src).not.toContain("triggerHaptic");
    expect(src).not.toContain("feedback.");
  });

  it("pull-refresh keeps threshold/armed feedback only", () => {
    const src = readFileSync("components/layout/mobile-top-bar.tsx", "utf8");
    expect(src).toContain("feedback.selection()");
    expect(src).toContain("feedback.success()");
  });
});
