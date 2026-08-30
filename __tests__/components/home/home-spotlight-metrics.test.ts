import { describe, expect, it } from "vitest";

import { formatHomeAnalysisTime } from "@/components/home/definitive-home";

describe("Home spotlight metrics", () => {
  it("does not duplicate min when readingTime already includes the unit", () => {
    expect(formatHomeAnalysisTime("2 min")).toBe("2 min");
    expect(formatHomeAnalysisTime("3 min")).toBe("3 min");
    expect(formatHomeAnalysisTime("2min")).toBe("2min");
    expect(formatHomeAnalysisTime("4 minuti")).toBe("4 minuti");
  });

  it("adds min only for bare durations", () => {
    expect(formatHomeAnalysisTime("2")).toBe("2 min");
    expect(formatHomeAnalysisTime("")).toBe("—");
    expect(formatHomeAnalysisTime(null)).toBe("—");
  });
});
