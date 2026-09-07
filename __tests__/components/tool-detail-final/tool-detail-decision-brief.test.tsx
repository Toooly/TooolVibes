// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolDetailDecisionBrief } from "@/components/tool-detail-final/tool-detail-decision-brief";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

function makeTool(overrides: Partial<ToolPublicView> = {}): ToolPublicView {
  return {
    publicTool: completeToolPublicFixture,
    presentationKind: "canonical",
    id: "test-id",
    slug: "blink",
    name: "Blink",
    category: "vibe-coding",
    categoryLabel: "Vibe coding",
    level: "beginner",
    levelLabel: "Base",
    segments: [],
    filterGroups: [],
    shortDescription: "AI app builder.",
    description: "AI app builder.",
    longDescription: "AI app builder.",
    whyItMatters: null,
    tldr: "AI app builder.",
    whatItDoes: "Genera app da prompt.",
    idealUseCase: "Validare MVP.",
    editorialReview: "Solido per MVP.",
    externalUrl: "https://blink.new",
    affiliateUrl: null,
    url: "https://blink.new",
    originalSourceUrl: null,
    originalArticleUrl: null,
    featured: false,
    toolOfWeek: false,
    tags: ["mvp"],
    ctaLabel: "Prova Blink",
    publishedAt: "2026-02-05",
    readingTime: "2 min",
    domain: "blink.new",
    sourceSite: "tooolvibes.com",
    useCases: ["Validare MVP"],
    highlights: ["Dal prompt all'app"],
    cautions: ["Non per scale-up"],
    accentFrom: null,
    accentTo: null,
    extendedContent: null,
    ...overrides,
  };
}

describe("ToolDetailDecisionBrief", () => {
  it("renders In breve with Ideale per, Trade-off, and Verdetto", () => {
    const { container } = render(<ToolDetailDecisionBrief tool={makeTool()} />);

    expect(screen.getByText("In breve")).toBeTruthy();
    const dts = Array.from(container.querySelectorAll("dt")).map(
      (node) => node.textContent?.trim(),
    );
    expect(dts).toEqual(["Ideale per", "Trade-off", "Verdetto"]);
    expect(screen.getByText("Validare MVP.")).toBeTruthy();
    expect(screen.getByText("Dal prompt all'app")).toBeTruthy();
    expect(screen.getByText("Solido per MVP.")).toBeTruthy();
  });

  it("does not surface Non fa per te se in the default brief", () => {
    const { container } = render(<ToolDetailDecisionBrief tool={makeTool()} />);
    const text = container.textContent ?? "";

    expect(text).not.toContain("Non fa per te se");
    expect(text).not.toContain("Non per scale-up");
    expect(text).not.toContain("Fa per te se");
    expect(text).not.toContain("Trade-off principale");
    expect(text).not.toContain("Verdetto editoriale");
  });

  it("returns null when there is no snapshot copy", () => {
    const { container } = render(
      <ToolDetailDecisionBrief
        tool={makeTool({
          idealUseCase: null,
          useCases: [],
          highlights: [],
          whyItMatters: null,
          editorialNote: null,
          editorialReview: null,
          extendedContent: null,
        })}
      />,
    );

    expect(container.textContent).toBe("");
  });
});
