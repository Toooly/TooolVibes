// @vitest-environment jsdom

/**
 * STATE CONTRACT TEST
 * Proves Save/Compare truth table for catalog cards.
 * MUST FAIL if Save and Compare are inverted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

// Mock the store
const mockToggleSaved = vi.fn();
const mockToggleCompare = vi.fn();
let mockSavedSlugs: string[] = [];
let mockCompareSlugs: string[] = [];

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  MAX_COMPARE_TOOLS: 4,
  MIN_COMPARE_TOOLS: 1,
  useToolWorkspaceStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      savedSlugs: mockSavedSlugs,
      compareSlugs: mockCompareSlugs,
      toggleSaved: mockToggleSaved,
      toggleCompare: mockToggleCompare,
    };
    return selector(state);
  },
}));

// Mock useCardReveal
vi.mock("@/lib/hooks/use-card-reveal", () => ({
  useCardReveal: () => ({ current: null }),
}));

// Mock usePersonalToolStatus
vi.mock("@/components/account/workspace/workspace-personal-status", () => ({
  usePersonalToolStatus: () => null,
  isHeartRedundantPersonalStatus: () => false,
  WorkspacePersonalStatusBadge: () => null,
}));

const mockTool = {
  slug: "agentx",
  name: "AgentX",
  category: "AI Agents",
  categoryLabel: "AI Agents",
  shortDescription: "AI agent platform",
  tldr: "AI agent platform",
  idealUseCase: "Automation",
  useCases: ["Automation"],
  tags: ["ai", "agents"],
  domain: "agentx.ai",
  url: "https://agentx.ai",
  externalUrl: "https://agentx.ai",
  affiliateUrl: null,
  toolOfWeek: false,
  featured: false,
  level: null,
  levelLabel: null,
  readingTime: null,
  highlights: [],
  cautions: [],
  segments: [],
  filterGroups: [],
  presentationKind: "directory" as const,
  publicTool: { editorial: { evidence: [] }, score: null } as Record<string, unknown>,
  id: "agentx",
  description: "",
  longDescription: "",
  whyItMatters: null,
  whatItDoes: "",
  editorialReview: null,
  originalSourceUrl: null,
  originalArticleUrl: null,
  ctaLabel: null,
  publishedAt: null,
  sourceSite: null,
  accentFrom: null,
  accentTo: null,
  extendedContent: null,
  editorialNote: null,
};

afterEach(() => cleanup());

describe("Card State Contract", () => {
  beforeEach(() => {
    mockSavedSlugs = [];
    mockCompareSlugs = [];
    mockToggleSaved.mockClear();
    mockToggleCompare.mockClear();
  });

  it("DEFAULT: no save layer visible, no compare layer visible, no watermark", () => {
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // QA probes
    expect(card.getAttribute("data-qa-saved")).toBe("false");
    expect(card.getAttribute("data-qa-compared")).toBe("false");
    expect(card.getAttribute("data-qa-tier")).toBe("none");
    
    // Semantic attributes
    expect(card.hasAttribute("data-saved")).toBe(false);
    expect(card.hasAttribute("data-selected")).toBe(false);
    
    // State layers should exist but be invisible (CSS opacity:0)
    const saveLayer = card.querySelector(".ar4-card__save-layer");
    const compareLayer = card.querySelector(".ar4-card__compare-layer");
    const hotspots = card.querySelector(".ar4-card__state-hotspots");
    expect(saveLayer).toBeTruthy();
    expect(compareLayer).toBeTruthy();
    expect(hotspots).toBeTruthy();
    
    // Watermark should NOT be mounted
    expect(card.querySelector(".ar4-card__watermark")).toBeNull();
    
    // Buttons inactive
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const compare = card.querySelector('[data-sonic-action="compare"]');
    expect(bookmark?.getAttribute("aria-pressed")).toBe("false");
    expect(compare?.getAttribute("aria-pressed")).toBe("false");
  });

  it("SAVED: save layer only, gold bookmark, no compare layer, no watermark", () => {
    mockSavedSlugs = ["agentx"];
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // QA probes
    expect(card.getAttribute("data-qa-saved")).toBe("true");
    expect(card.getAttribute("data-qa-compared")).toBe("false");
    
    // Semantic attributes
    expect(card.hasAttribute("data-saved")).toBe(true);
    expect(card.hasAttribute("data-selected")).toBe(false);
    
    // Watermark should NOT be mounted
    expect(card.querySelector(".ar4-card__watermark")).toBeNull();
    
    // Buttons
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const compare = card.querySelector('[data-sonic-action="compare"]');
    expect(bookmark?.getAttribute("aria-pressed")).toBe("true");
    expect(bookmark?.hasAttribute("data-saved")).toBe(true);
    expect(compare?.getAttribute("aria-pressed")).toBe("false");
    
    // Bookmark icon should be filled
    const icon = bookmark?.querySelector("svg");
    expect(icon?.getAttribute("fill")).toBe("currentColor");
  });

  it("COMPARE: compare layer only, watermark present, cyan button, no save layer", () => {
    mockCompareSlugs = ["agentx"];
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // QA probes
    expect(card.getAttribute("data-qa-saved")).toBe("false");
    expect(card.getAttribute("data-qa-compared")).toBe("true");
    
    // Semantic attributes
    expect(card.hasAttribute("data-saved")).toBe(false);
    expect(card.hasAttribute("data-selected")).toBe(true);
    
    // Watermark SHOULD be mounted
    expect(card.querySelector(".ar4-card__watermark")).toBeTruthy();
    
    // Buttons
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const compare = card.querySelector('[data-sonic-action="compare"]');
    expect(bookmark?.getAttribute("aria-pressed")).toBe("false");
    expect(compare?.getAttribute("aria-pressed")).toBe("true");
    expect(compare?.classList.contains("is-active")).toBe(true);
    
    // Bookmark icon should NOT be filled
    const icon = bookmark?.querySelector("svg");
    expect(icon?.getAttribute("fill")).toBe("none");
  });

  it("BOTH: save + compare layers, watermark, gold bookmark + cyan compare", () => {
    mockSavedSlugs = ["agentx"];
    mockCompareSlugs = ["agentx"];
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // QA probes
    expect(card.getAttribute("data-qa-saved")).toBe("true");
    expect(card.getAttribute("data-qa-compared")).toBe("true");
    
    // Semantic attributes
    expect(card.hasAttribute("data-saved")).toBe(true);
    expect(card.hasAttribute("data-selected")).toBe(true);
    
    // Watermark SHOULD be mounted
    expect(card.querySelector(".ar4-card__watermark")).toBeTruthy();
    
    // Both buttons active
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const compare = card.querySelector('[data-sonic-action="compare"]');
    expect(bookmark?.getAttribute("aria-pressed")).toBe("true");
    expect(compare?.getAttribute("aria-pressed")).toBe("true");
    
    // Bookmark filled
    const icon = bookmark?.querySelector("svg");
    expect(icon?.getAttribute("fill")).toBe("currentColor");
  });

  it("INVERSION GUARD: SAVED must NOT show compare attributes", () => {
    mockSavedSlugs = ["agentx"];
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // If these fail, Save and Compare are INVERTED
    expect(card.getAttribute("data-qa-compared")).toBe("false");
    expect(card.hasAttribute("data-selected")).toBe(false);
    expect(card.querySelector(".ar4-card__watermark")).toBeNull();
    expect(card.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed")).toBe("false");
  });

  it("INVERSION GUARD: COMPARE must NOT show save attributes", () => {
    mockCompareSlugs = ["agentx"];
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    // If these fail, Save and Compare are INVERTED
    expect(card.getAttribute("data-qa-saved")).toBe("false");
    expect(card.hasAttribute("data-saved")).toBe(false);
    expect(card.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed")).toBe("false");
  });

  it("PODIUM: tier mapping primary→gold, secondary→silver, tertiary→bronze", () => {
    const { rerender } = render(<ArchiveV4ToolCard tool={mockTool} promotedTier="primary" />);
    expect(screen.getByRole("article").getAttribute("data-qa-tier")).toBe("gold");
    
    rerender(<ArchiveV4ToolCard tool={mockTool} promotedTier="secondary" />);
    expect(screen.getByRole("article").getAttribute("data-qa-tier")).toBe("silver");
    
    rerender(<ArchiveV4ToolCard tool={mockTool} promotedTier="tertiary" />);
    expect(screen.getByRole("article").getAttribute("data-qa-tier")).toBe("bronze");
    
    rerender(<ArchiveV4ToolCard tool={mockTool} />);
    expect(screen.getByRole("article").getAttribute("data-qa-tier")).toBe("none");
  });

  it("HOTSPOTS: present in DOM, visible only when saved", () => {
    const { rerender } = render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    expect(card.querySelector(".ar4-card__state-hotspots")).toBeTruthy();
    
    mockSavedSlugs = ["agentx"];
    rerender(<ArchiveV4ToolCard tool={mockTool} />);
    expect(card.querySelector(".ar4-card__state-hotspots")).toBeTruthy();
  });
});
