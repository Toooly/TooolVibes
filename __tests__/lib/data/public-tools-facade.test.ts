import { describe, expect, it, vi } from "vitest";

import * as facade from "@/lib/data/public-tools";
import * as runtime from "@/lib/data/public-tools-runtime";

vi.mock("server-only", () => ({}));

describe("public tools facade", () => {
  it("exports the runtime functions by reference", () => {
    expect(facade.getPublicToolsSnapshot).toBe(
      runtime.getPublicToolsSnapshot,
    );
    expect(facade.getPublishedTools).toBe(runtime.getPublishedTools);
    expect(facade.getToolBySlug).toBe(runtime.getToolBySlug);
  });
});
