import { describe, expect, it } from "vitest";

import { ownerEditPatch, ownerEditResubmits } from "@/lib/community/transitions";

describe("owner edit transitions", () => {
  it("resubmits every owner-visible status to pending", () => {
    expect(ownerEditResubmits("pending")).toBe(true);
    expect(ownerEditResubmits("published")).toBe(true);
    expect(ownerEditResubmits("rejected")).toBe(true);
    expect(ownerEditResubmits("hidden")).toBe(true);
  });

  it("clears publication and moderation fields", () => {
    expect(ownerEditPatch("2026-08-30T00:00:00.000Z")).toEqual({
      status: "pending",
      published_at: null,
      moderated_at: null,
      moderation_reason: null,
      submitted_at: "2026-08-30T00:00:00.000Z",
    });
  });
});
