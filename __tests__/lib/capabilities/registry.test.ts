import { describe, expect, it } from "vitest";

import {
  canUse,
  getCapability,
  listCapabilities,
} from "@/lib/capabilities";

describe("capability registry", () => {
  it("CAP-01 public capability is allowed for guests", () => {
    expect(canUse("catalog.browse", "guest")).toBe(true);
    expect(canUse("compare.basic", "guest")).toBe(true);
    expect(canUse("save.local", "guest")).toBe(true);
    expect(canUse("decide.fast", "guest")).toBe(true);
  });

  it("CAP-02 auth capability is denied for guests", () => {
    expect(canUse("stack.create", "guest")).toBe(false);
    expect(canUse("note.private", "guest")).toBe(false);
  });

  it("CAP-03 auth capability is allowed when authenticated", () => {
    expect(canUse("stack.create", "authenticated")).toBe(true);
    expect(canUse("stack.edit", "authenticated")).toBe(true);
  });

  it("CAP-04 unknown capability fails closed", () => {
    expect(canUse("not.a.capability", "authenticated")).toBe(false);
    expect(getCapability("not.a.capability")).toBeNull();
  });

  it("CAP-05 metadata is typed and stable", () => {
    const stack = getCapability("stack.create");
    expect(stack?.access).toBe("authenticated");
    expect(stack?.continuation).toBe(true);
    expect(stack?.telemetryKey).toBe("stack.create");
    expect(listCapabilities().length).toBeGreaterThan(10);
  });

  it("CAP-06 client registry is eligibility not server authorization", () => {
    const stack = getCapability("stack.create");
    expect(stack?.serverEnforced).toMatch(/CAS|blob/i);
  });
});
