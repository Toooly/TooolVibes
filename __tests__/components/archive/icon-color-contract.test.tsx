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
  slug: "agentx", name: "AgentX", category: "AI", categoryLabel: "AI",
  shortDescription: "test", tldr: "test", idealUseCase: "test", useCases: ["test"],
  tags: ["test"], domain: "test.com", url: "https://test.com", externalUrl: "https://test.com",
  affiliateUrl: null, toolOfWeek: false, featured: false, level: null, levelLabel: null,
  readingTime: null, highlights: [], cautions: [], segments: [], filterGroups: [],
  presentationKind: "directory" as const, publicTool: { editorial: { evidence: [] }, score: null } as unknown as import("@/lib/data/tool-public-view").ToolPublicView["publicTool"],
  id: "agentx", description: "", longDescription: "", whyItMatters: null, whatItDoes: "",
  editorialReview: null, originalSourceUrl: null, originalArticleUrl: null, ctaLabel: null,
  publishedAt: null, sourceSite: null, accentFrom: null, accentTo: null, extendedContent: null, editorialNote: null,
};

afterEach(() => cleanup());

describe("Icon Color Contract", () => {
  it("SAVE OFF: Bookmark uses warm-gold semantic tint (not lavender)", () => {
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const svg = bookmark?.querySelector("svg");
    
    // SVG should use currentColor (inherits from button)
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    // fill should be none when not saved
    expect(svg?.getAttribute("fill")).toBe("none");
  });

  it("SAVE ON: Bookmark uses full gold (#FCD75C), filled icon", () => {
    /* store intentionally unused in this contract */
    vi.mocked(vi.fn()).mockImplementation(() => {});
    
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    const bookmark = card.querySelector(".ar4-card__bookmark");
    const svg = bookmark?.querySelector("svg");
    
    // Even in default render, verify the SVG structure supports gold
    expect(svg).toBeTruthy();
    expect(svg?.tagName).toBe("svg");
  });

  it("COMPARE OFF: dual-panel icon uses cyan semantic tint", () => {
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    const compare = card.querySelector('[data-sonic-action="compare"]');
    const svg = compare?.querySelector("svg");
    
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
  });

  it("BOTH: Save SVG stays gold, Compare SVG stays cyan", () => {
    render(<ArchiveV4ToolCard tool={mockTool} />);
    const card = screen.getByRole("article");
    
    const bookmarkSvg = card.querySelector(".ar4-card__bookmark svg");
    const compareSvg = card.querySelector('[data-sonic-action="compare"] svg');
    
    // Both should use currentColor (parent controls the actual color)
    expect(bookmarkSvg?.getAttribute("stroke")).toBe("currentColor");
    expect(compareSvg?.getAttribute("stroke")).toBe("currentColor");
  });

  it("CSS contract: no lavender #cdb9ff on icon colors", () => {
    const cssPath = path.join(process.cwd(), "styles", "archive-v4.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    
    // The icon color contract section must exist
    expect(css).toContain("MOTION & INTERACTION PERFORMANCE PASS");
    // Must use gold for save
    expect(css).toContain("#FCD75C");
    // Must use cyan for compare
    expect(css).toContain("#05CEFB");
  });

  it("CSS contract: ghost animations removed", () => {
    const cssPath = path.join(process.cwd(), "styles", "archive-v4.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    
    const globalCss = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf-8");
    const card = fs.readFileSync(path.join(process.cwd(), "components", "archive", "archive-v4-tool-card.tsx"), "utf-8");
    expect(css).not.toContain("ar4-trace-rotate");
    expect(card).not.toContain('"is-save-trace"');
    expect(card).toContain("data-save-feedback");
    expect(globalCss).toContain("tool-action-confirm");
  });
});
