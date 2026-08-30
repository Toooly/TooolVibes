import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => vi.fn());
const verifyMock = vi.hoisted(() => vi.fn());
const features = vi.hoisted(() => ({ publicGate: { enabled: false } }));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/config/release-features", () => ({
  releaseFeatures: features,
}));

vi.mock("@/lib/gate/session", () => ({
  verifyGateToken: verifyMock,
}));

import { isPublicGateOpen } from "@/lib/gate/is-public-gate-open";

describe("isPublicGateOpen", () => {
  beforeEach(() => {
    features.publicGate.enabled = false;
    cookiesMock.mockReset();
    verifyMock.mockReset();
  });

  it("does not read cookies when the public gate is off", async () => {
    await expect(isPublicGateOpen()).resolves.toBe(true);
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("reads the gate cookie only when the public gate is on", async () => {
    features.publicGate.enabled = true;
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "token" }),
    });
    verifyMock.mockResolvedValue(true);
    await expect(isPublicGateOpen()).resolves.toBe(true);
    expect(cookiesMock).toHaveBeenCalledTimes(1);
    expect(verifyMock).toHaveBeenCalledWith("token");
  });
});
