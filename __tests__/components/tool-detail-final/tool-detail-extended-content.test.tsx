// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolDetailExtendedContent } from "@/components/tool-detail-final/tool-detail-extended-content";
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

describe("ToolDetailExtendedContent public markdown", () => {
  it("does not render markdown CTA e stati", () => {
    const content = [
      "## Overview approfondita",
      "Testo pubblico della scheda.",
      "## CTA e stati",
      "Non mostrare questo blocco interno.",
      "## Alternative",
      "Non ripetere le alternative qui.",
      "## Ideale per",
      "- Già nello snapshot.",
      "## FAQ",
      "**Quanto costa?**",
      "Verifica sul sito ufficiale.",
    ].join("\n\n");

    const { container } = render(
      <ToolDetailExtendedContent tool={makeTool({ extendedContent: content })} />,
    );
    const text = container.textContent ?? "";

    expect(text).toContain("Testo pubblico della scheda.");
    expect(text).toContain("FAQ");
    expect(text).not.toContain("CTA e stati");
    expect(text).not.toContain("Non mostrare questo blocco interno.");
    expect(text).not.toContain("Non ripetere le alternative qui.");
    expect(container.querySelector("summary")?.textContent).not.toMatch(/Ideale per|Alternative|CTA/);
    const summaries = Array.from(container.querySelectorAll("summary")).map(
      (node) => node.textContent?.trim(),
    );
    expect(summaries).not.toContain("CTA e stati");
    expect(summaries).not.toContain("Alternative");
    expect(summaries).not.toContain("Ideale per");
  });

  it("keeps deepen content in HTML behind keyboard-accessible summaries", () => {
    const content = [
      "## Overview approfondita",
      "Testo pubblico della scheda.",
      "## FAQ",
      "**Quanto costa?**",
      "Verifica sul sito ufficiale.",
    ].join("\n\n");

    const { container } = render(
      <ToolDetailExtendedContent tool={makeTool({ extendedContent: content })} />,
    );

    const items = Array.from(container.querySelectorAll("details.td-final-deepen__item"));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const summary = item.querySelector("summary");
      expect(summary).toBeTruthy();
      expect(summary?.textContent?.trim().length).toBeGreaterThan(0);
      expect(item.hasAttribute("open")).toBe(false);
    }

    const text = container.textContent ?? "";
    expect(text).toContain("Overview");
    expect(text).toContain("FAQ");
    expect(text).toContain("Dati tecnici");
    expect(text).toContain("Testo pubblico della scheda.");
    expect(text).toContain("Verifica sul sito ufficiale.");
    expect(text).not.toContain("CTA e stati");
  });

  it("omits Dati tecnici when the tool has no technical fields", () => {
    const { container } = render(
      <ToolDetailExtendedContent
        tool={makeTool({
          categoryLabel: "",
          levelLabel: null,
          domain: "",
          publishedAt: "",
          readingTime: null,
          tags: [],
          extendedContent: null,
        })}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toContain("Dati tecnici");
    expect(text).not.toContain("Non specificato");
    expect(text).not.toContain("Nessun tag associato");
    expect(text).not.toContain("Data non disponibile");
  });
});
