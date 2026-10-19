// @vitest-environment jsdom

import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
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

afterEach(() => { cleanup(); vi.useRealTimers(); });
beforeEach(() => {
  mockCompareSlugs = [];
  mockToggleCompare.mockReset();
  mockToggleCompare.mockReturnValue({ added: true, limited: false });
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

  it("keeps feedback local and clears it after the selected-state rerender", () => {
    vi.useFakeTimers();
    const cards = () => <><CompareToggle slug="agentx" mode="icon" toolName="AgentX" /><CompareToggle slug="blink" mode="icon" toolName="Blink" /></>;
    const { rerender } = render(cards());
    const clicked = screen.getByRole("button", { name: "Aggiungi AgentX al confronto" });
    fireEvent.click(clicked);
    mockCompareSlugs = ["agentx"];
    rerender(cards());
    expect(clicked.getAttribute("data-compare-feedback")).toBe("added");
    expect(clicked.querySelector(".lucide-check")).toBeTruthy();
    const untouched = screen.getByRole("button", { name: "Aggiungi Blink al confronto" });
    expect(untouched.hasAttribute("data-compare-feedback")).toBe(false);
    expect(untouched.classList.contains("is-fresh")).toBe(false);
    act(() => vi.advanceTimersByTime(300));
    expect(clicked.hasAttribute("data-compare-feedback")).toBe(false);
    expect(clicked.getAttribute("aria-pressed")).toBe("true");
  });

  it("restores persisted or externally changed selection without replaying feedback", () => {
    const { rerender } = render(<CompareToggle slug="agentx" mode="icon" />);
    mockCompareSlugs = ["agentx", "blink"];
    rerender(<CompareToggle slug="agentx" mode="icon" />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.hasAttribute("data-compare-feedback")).toBe(false);
    expect(button.classList.contains("is-fresh")).toBe(false);
    expect(button.classList.contains("is-ready")).toBe(false);
  });

  it("cancels addition feedback on immediate removal", () => {
    vi.useFakeTimers();
    const { rerender } = render(<CompareToggle slug="agentx" mode="icon" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    mockCompareSlugs = ["agentx"];
    rerender(<CompareToggle slug="agentx" mode="icon" />);
    mockToggleCompare.mockReturnValue({ added: false, limited: false });
    fireEvent.click(button);
    mockCompareSlugs = [];
    rerender(<CompareToggle slug="agentx" mode="icon" />);
    expect(button.hasAttribute("data-compare-feedback")).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.querySelector(".lucide-columns-2")).toBeTruthy();
    act(() => vi.advanceTimersByTime(300));
    expect(button.hasAttribute("data-compare-feedback")).toBe(false);
  });

  it("does not acknowledge a rejected addition when the comparison is full", () => {
    mockCompareSlugs = ["blink", "v0", "meku", "betterpic"];
    mockToggleCompare.mockReturnValue({ added: false, limited: true });
    render(<CompareToggle slug="agentx" mode="icon" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.hasAttribute("data-compare-feedback")).toBe(false);
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
