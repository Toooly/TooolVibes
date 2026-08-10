import { describe, expect, it } from "vitest";
import { contentCollections } from "@/lib/data/content-collections";
import { resolveCuratedCollection } from "@/lib/collections/helpers";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

const tools = directoryTools.map((tool) => ({
  id: tool.id,
  name: tool.name,
  slug: tool.slug,
  category: tool.category,
  short_description_it: tool.shortDescription,
  website_url: tool.externalUrl,
  affiliate_url: tool.affiliateUrl ?? null,
}));

describe("collection resolver with new editorial fields", () => {
  it("every collection resolves without losing slots", () => {
    for (const record of contentCollections) {
      const resolved = resolveCuratedCollection(record, tools);
      expect(resolved.tool_count, `${record.slug} lost slots during resolve`).toBe(record.included_tools.length);
      for (const slot of resolved.included_tools) {
        expect(slot.tool.slug).toBe(slot.tool_slug);
        const status = slot.status ?? "core";
        if (status === "core") expect(slot.is_core).toBe(true);
        if (status === "alternative") expect(slot.is_alternative).toBe(true);
        if (status === "optional") expect(slot.is_optional).toBe(true);
      }
    }
  });

  it("stacks variants only reference tools that are in the included_tools", () => {
    for (const record of contentCollections) {
      if (!record.stack_variants) continue;
      const included = new Set(record.included_tools.map((s) => s.tool_slug));
      for (const variant of record.stack_variants) {
        for (const slug of variant.core_tool_slugs) {
          expect(included.has(slug), `${record.slug} variant ${variant.label} references ${slug} not in included_tools`).toBe(true);
        }
      }
    }
  });
});
