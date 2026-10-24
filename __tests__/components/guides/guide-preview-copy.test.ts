import { describe, expect, it } from "vitest";
import { getGuidePreviewCopy } from "@/components/guides/guide-preview-copy";
import { getCollectionPreviewCopy } from "@/components/collections/collection-preview-copy";
import { makeCollection } from "../collections/fixture";
import type { EditorialPostRecord } from "@/lib/types/article";

function guide(): EditorialPostRecord {
  return {
    slug: "betterpic",
    title: "BetterPic: la guida onesta all'headshot AI",
    dek: "Cosa fa davvero, quando ti risparmia un fotografo, e quando invece non basta.",
    summary: "Canonical summary.",
    content_markdown: "Canonical article body, including its factual details.",
    kind: "guide",
    source_label: "TooolVibes",
    source_url: "/posts/betterpic",
    published_at: "2026-08-08",
    updated_at: "2026-08-08",
    highlights: ["Canonical highlight."],
    details: [],
    cautions: [],
  };
}

describe("editorial preview copy", () => {
  it("improves known guide teasers without changing the canonical article", () => {
    const source = guide();
    const original = structuredClone(source);
    const preview = getGuidePreviewCopy(source);
    expect(preview.title).toBe("BetterPic: ritratti AI per il tuo profilo professionale");
    expect(preview.dek).toContain("quando serve ancora un fotografo");
    expect(source).toEqual(original);
  });

  it("preserves an externally updated article instead of replacing its copy by slug alone", () => {
    const source = { ...guide(), title: "Una nuova analisi di BetterPic" };
    expect(getGuidePreviewCopy(source)).toBe(source);
  });

  it("keeps stack prices and workflow definitions unchanged while improving the presentation", () => {
    const source = makeCollection({ title: "Stack AI per founder solo" });
    const original = structuredClone(source);
    expect(getCollectionPreviewCopy(source).title).toBe("Stack AI per founder indipendenti");
    expect(source).toEqual(original);
    expect(source.stack_meta?.monthly_cost_band).toBe("€0-30");
  });
});
