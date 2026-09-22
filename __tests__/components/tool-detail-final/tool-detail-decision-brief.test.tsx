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
  it("renders In sintesi with Ideale per and Verdetto, omitting junk highlight trade-offs", () => {
    const { container } = render(<ToolDetailDecisionBrief tool={makeTool()} />);

    expect(screen.getByText("In sintesi")).toBeTruthy();
    expect(container.querySelector(".tv-emphasis--decision")).toBeTruthy();
    const dts = Array.from(container.querySelectorAll("dt")).map(
      (node) => node.textContent?.trim(),
    );
    expect(dts).toEqual(["Ideale per", "Verdetto"]);
    expect(screen.getByText("Validare MVP.")).toBeTruthy();
    expect(screen.queryByText("Dal prompt all'app")).toBeNull();
    expect(screen.queryByText("Trade-off")).toBeNull();
    expect(screen.getAllByText("Solido per MVP.").length).toBeGreaterThan(0);
  });

  it("renders Trade-off only from an editorial tension, not highlights", () => {
    const { container } = render(
      <ToolDetailDecisionBrief
        tool={makeTool({
          extendedContent: [
            "## Verdetto editoriale",
            "**Cosa ci convince:** Solido per MVP.",
            "**Trade-off da considerare:** Veloce sul prototipo, debole in produzione.",
          ].join("\n\n"),
        })}
      />,
    );
    const dts = Array.from(container.querySelectorAll("dt")).map(
      (node) => node.textContent?.trim(),
    );
    expect(dts).toContain("Trade-off");
    expect(screen.getByText("Veloce sul prototipo, debole in produzione.")).toBeTruthy();
    expect(screen.queryByText("Dal prompt all'app")).toBeNull();
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
