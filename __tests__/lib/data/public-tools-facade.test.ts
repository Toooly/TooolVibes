import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("public tools facade", () => {
  it("exports the runtime functions by reference", async () => {
    const [facade, runtime] = await Promise.all([
      import("@/lib/data/public-tools"),
      import("@/lib/data/public-tools-runtime"),
    ]);

    expect(facade.getPublicToolsSnapshot).toBe(
      runtime.getPublicToolsSnapshot,
    );
    expect(facade.getPublishedTools).toBe(runtime.getPublishedTools);
    expect(facade.getToolBySlug).toBe(runtime.getToolBySlug);
  });
});
