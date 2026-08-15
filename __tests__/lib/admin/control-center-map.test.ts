import { describe, expect, it } from "vitest";

import { CONTROL_CENTER_MAP, liveControlsWithoutConsumer } from "@/lib/admin/control-center-map";

describe("control center map", () => {
  it("has no live control without a consumer", () => {
    expect(liveControlsWithoutConsumer()).toEqual([]);
  });

  it("removed featured guide and collection instead of leaving dead settings", () => {
    const removed = CONTROL_CENTER_MAP.filter((row) => row.status === "removed").map((row) => row.control);
    expect(removed).toEqual(["Homepage featured guide", "Homepage featured collection"]);
  });
});
