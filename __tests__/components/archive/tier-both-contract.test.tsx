// @vitest-environment jsdom

import { render, screen, cleanup } from "@testing-library/react";
    import fs from "fs";
    import path from "path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  MAX_COMPARE_TOOLS: 4,
  MIN_COMPARE_TOOLS: 1,
  useToolWorkspaceStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      savedSlugs: ["agentx"],
      compareSlugs: ["agentx"],
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
  tags: ["ai"],
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

describe("Tier + Save + Compare Contract", () => {
  it("GOLD (primary) + saved + compared: tier layer, save layer, compare layer, watermark, both buttons active", () => {
    render(<ArchiveV4ToolCard tool={mockTool} promotedTier="primary" />);
    const card = screen.getByRole("article");

    // Tier
    expect(card.getAttribute("data-qa-tier")).toBe("gold");
    expect(card.getAttribute("data-tier")).toBe("primary");
    expect(card.classList.contains("is-tier-primary")).toBe(true);

    // State layers present
    expect(card.querySelector(".ar4-card__save-layer")).toBeTruthy();
    expect(card.querySelector(".ar4-card__compare-layer")).toBeTruthy();
    expect(card.querySelector(".ar4-card__state-hotspots")).toBeTruthy();

    // Watermark present (compare)
    expect(card.querySelector(".ar4-card__watermark")).toBeTruthy();

    // Both buttons active
    expect(card.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed")).toBe("true");
    expect(card.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed")).toBe("true");

    // Semantic attributes
    expect(card.hasAttribute("data-saved")).toBe(true);
    expect(card.hasAttribute("data-selected")).toBe(true);
  });

  it("SILVER (secondary) + saved + compared: same composition", () => {
    render(<ArchiveV4ToolCard tool={mockTool} promotedTier="secondary" />);
    const card = screen.getByRole("article");

    expect(card.getAttribute("data-qa-tier")).toBe("silver");
    expect(card.getAttribute("data-tier")).toBe("secondary");
    expect(card.querySelector(".ar4-card__watermark")).toBeTruthy();
    expect(card.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed")).toBe("true");
    expect(card.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed")).toBe("true");
  });

  it("BRONZE (tertiary) + saved + compared: same composition", () => {
    render(<ArchiveV4ToolCard tool={mockTool} promotedTier="tertiary" />);
    const card = screen.getByRole("article");

    expect(card.getAttribute("data-qa-tier")).toBe("bronze");
    expect(card.getAttribute("data-tier")).toBe("tertiary");
    expect(card.querySelector(".ar4-card__watermark")).toBeTruthy();
    expect(card.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed")).toBe("true");
    expect(card.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed")).toBe("true");
  });

  it("No slug hardcoding: tier mapping is positional via promotedTier prop", () => {
    // Use a different slug to prove no hardcoding
    const otherTool = { ...mockTool, slug: "other-tool", name: "OtherTool" };
    render(<ArchiveV4ToolCard tool={otherTool} promotedTier="primary" />);
    const card = screen.getByRole("article");
    expect(card.getAttribute("data-qa-tier")).toBe("gold");
  });

  it("CSS contract: TRUE REFERENCE G2 rule exists for triple state", () => {
    // This test verifies the CSS rule is present in the stylesheet
    // by checking the source file content (meta-test)
    const cssPath = path.join(process.cwd(), "styles", "archive-v4.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // G2 rule must exist
    expect(css).toContain("PODIUM + SAVE + COMPARE: composed triple state");
    // Must have all three tier variants
    expect(css).toContain('.ar4-card[data-tier="primary"][data-saved][data-selected]');
    expect(css).toContain('.ar4-card[data-tier="secondary"][data-saved][data-selected]');
    expect(css).toContain('.ar4-card[data-tier="tertiary"][data-saved][data-selected]');

    // Stale rules must NOT exist
    expect(css).not.toContain("METALLIC + SAVED + COMPARE: triple state");
    expect(css).not.toContain("SAVED = electric violet");
  });
});
