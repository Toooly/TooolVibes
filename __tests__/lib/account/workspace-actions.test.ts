import { describe, expect, it } from "vitest";

import { createPersonalStackId } from "@/lib/account/workspace-actions";

describe("workspace action helpers", () => {
  it("slugifies stack names and avoids collisions", () => {
    expect(createPersonalStackId("AI Coding", [])).toBe("ai-coding");
    expect(createPersonalStackId("AI Coding", ["ai-coding"])).toBe("ai-coding-2");
  });
});
