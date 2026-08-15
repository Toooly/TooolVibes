import { describe, expect, it } from "vitest";

import { getHomepageControls } from "@/lib/content/homepage-controls";

describe("homepage controls", () => {
  it("returns a safe default catalog", () => {
    const controls = getHomepageControls();
    expect(controls.announcement.href.startsWith("/")).toBe(true);
    expect(typeof controls.announcement.enabled).toBe("boolean");
  });
});
