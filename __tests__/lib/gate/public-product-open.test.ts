import { describe, expect, it, vi } from "vitest";

const features = vi.hoisted(() => ({ publicGate: { enabled: false } }));

vi.mock("@/lib/config/release-features", () => ({
  releaseFeatures: features,
}));

import { isPublicProductOpen } from "@/lib/gate/public-product-open";

describe("isPublicProductOpen", () => {
  it("is open when the public gate flag is off", () => {
    features.publicGate.enabled = false;
    expect(isPublicProductOpen()).toBe(true);
  });

  it("is closed when the public gate flag is on", () => {
    features.publicGate.enabled = true;
    expect(isPublicProductOpen()).toBe(false);
  });
});
