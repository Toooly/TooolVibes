// @vitest-environment jsdom

import { render, screen, cleanup } from "@testing-library/react";
    import fs from "fs";
    import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompareToggle } from "@/components/tools/compare-toggle";

let mockCompareSlugs: string[] = [];
const mockToggleCompare = vi.fn(() => ({ added: true, limited: false }));

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  MAX_COMPARE_TOOLS: 4,
  MIN_COMPARE_TOOLS: 1,
  useToolWorkspaceStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      compareSlugs: mockCompareSlugs,
      toggleCompare: mockToggleCompare,
    };
    return selector(state);
  },
}));

afterEach(() => cleanup());
beforeEach(() => {
  mockCompareSlugs = [];
  mockToggleCompare.mockClear();
});

describe("CompareToggle Contract", () => {
  it("INACTIVE: neutral material, no inline violet, aria-pressed=false", () => {
    render(<CompareToggle slug="agentx" mode="icon" toolName="AgentX" />);
    const btn = screen.getByRole("button");
    
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.classList.contains("is-active")).toBe(false);
    
    // Must NOT have inline violet background
    const style = btn.getAttribute("style") || "";
    expect(style).not.toContain("#6a3cff");
    expect(style).not.toContain("6a3cff");
  });

  it("ACTIVE: cyan semantic state, no inline violet, aria-pressed=true", () => {
    mockCompareSlugs = ["agentx"];
    render(<CompareToggle slug="agentx" mode="icon" toolName="AgentX" />);
    const btn = screen.getByRole("button");
    
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(btn.classList.contains("is-active")).toBe(true);
    
    // Must NOT have inline violet background
    const style = btn.getAttribute("style") || "";
    expect(style).not.toContain("#6a3cff");
    expect(style).not.toContain("6a3cff");
    expect(style).not.toContain("112,82,255");
  });

  it("PILL MODE: same contract — no inline violet active", () => {
    mockCompareSlugs = ["agentx"];
    render(<CompareToggle slug="agentx" toolName="AgentX" />);
    const btn = screen.getByRole("button");
    
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    const style = btn.getAttribute("style") || "";
    expect(style).not.toContain("#6a3cff");
    expect(style).not.toContain("6a3cff");
    expect(style).not.toContain("112,82,255");
  });

  it("CSS contract: canonical active state is cyan via stylesheet", () => {
    const cssPath = path.join(process.cwd(), "styles", "archive-v4.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    
    // TRUE REFERENCE cyan active rule must exist
    expect(css).toContain('[data-sonic-action="compare"].is-active');
    // Must use cyan, not violet
    expect(css).toMatch(/is-active[^}]*#05CEFB|is-active[^}]*0,\s*206,\s*251/);
  });
});
