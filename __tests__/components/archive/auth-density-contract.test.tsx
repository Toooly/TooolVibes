// @vitest-environment jsdom

/**
 * AUTH DENSITY CONTRACT TEST
 * Proves guest=compact / authenticated=enriched with metadata rail.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";

// Mock the store
vi.mock("@/lib/stores/tool-workspace-store", () => ({
  MAX_COMPARE_TOOLS: 4,
  MIN_COMPARE_TOOLS: 1,
  useToolWorkspaceStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      savedSlugs: [],
      compareSlugs: [],
      toggleSaved: vi.fn(),
      toggleCompare: vi.fn(),
    };
    return selector(state);
  },
}));

vi.mock("@/lib/hooks/use-card-reveal", () => ({
  useCardReveal: () => ({ current: null }),
}));

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
  tags: ["ai", "agents", "extra"],
  domain: "agentx.ai",
  url: "https://agentx.ai",
  externalUrl: "https://agentx.ai",
  affiliateUrl: null,
  toolOfWeek: false,
  featured: false,
  level: "advanced",
  levelLabel: "Avanzato",
  readingTime: "4 min",
  highlights: [],
  cautions: [],
  segments: [],
  filterGroups: [],
  presentationKind: "directory" as const,
  publicTool: { editorial: { evidence: [] }, score: null } as unknown as import("@/lib/data/tool-public-view").ToolPublicView["publicTool"],
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

describe("Auth Density Contract", () => {
  it("GUEST: density=compact, no enriched rail", () => {
    render(<ArchiveV4ToolCard tool={mockTool} density="compact" />);
    const card = screen.getByRole("article");
    
    expect(card.getAttribute("data-density")).toBe("compact");
    expect(card.querySelector(".ar4-card__enriched-rail")).toBeNull();
  });

  it("AUTHENTICATED: density=enriched, enriched rail present with level/time/tags", () => {
    render(<ArchiveV4ToolCard tool={mockTool} density="enriched" />);
    const card = screen.getByRole("article");
    
    expect(card.getAttribute("data-density")).toBe("enriched");
    
    const rail = card.querySelector(".ar4-card__enriched-rail");
    expect(rail).toBeTruthy();
    
    // Should contain levelLabel
    expect(rail?.textContent).toContain("Avanzato");
    // Should contain readingTime
    expect(rail?.textContent).toContain("4 min");
  });

  it("ENRICHED: max 2 tags rendered", () => {
    render(<ArchiveV4ToolCard tool={mockTool} density="enriched" />);
    const card = screen.getByRole("article");
    
    const tags = card.querySelectorAll(".ar4-card__enriched-chip");
    expect(tags.length).toBeLessThanOrEqual(2);
  });

  it("ENRICHED: metadata rail appears BEFORE score/actions row", () => {
    render(<ArchiveV4ToolCard tool={mockTool} density="enriched" />);
    const card = screen.getByRole("article");
    
    const rail = card.querySelector(".ar4-card__enriched-rail");
    const actions = card.querySelector(".ar4-card__actions");
    
    expect(rail).toBeTruthy();
    expect(actions).toBeTruthy();
    
    // Rail should come before actions in DOM order
    const allElements = Array.from(card.querySelectorAll("*"));
    const railIndex = allElements.indexOf(rail as Element);
    const actionsIndex = allElements.indexOf(actions as Element);
    expect(railIndex).toBeLessThan(actionsIndex);
  });

  it("ENRICHED: content order is identity→desc→ideale→meta→actions", () => {
    render(<ArchiveV4ToolCard tool={mockTool} density="enriched" />);
    const card = screen.getByRole("article");
    
    const top = card.querySelector(".ar4-card__top");
    const desc = card.querySelector(".ar4-card__desc");
    const best = card.querySelector(".ar4-card__best");
    const rail = card.querySelector(".ar4-card__enriched-rail");
    const actions = card.querySelector(".ar4-card__actions");
    
    const allElements = Array.from(card.querySelectorAll("*"));
    const indices = [top, desc, best, rail, actions].map(el => allElements.indexOf(el as Element));
    
    // All should be present
    indices.forEach(idx => expect(idx).toBeGreaterThanOrEqual(0));
    
    // Should be in ascending order
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it("COMPACT: graceful degradation when level/readingTime absent", () => {
    const toolNoMeta = { ...mockTool, levelLabel: null, readingTime: null };
    render(<ArchiveV4ToolCard tool={toolNoMeta} density="enriched" />);
    const card = screen.getByRole("article");
    
    // Rail should still render (with just tags or empty)
    expect(card.querySelector(".ar4-card__enriched-rail")).toBeTruthy();
  });
});
