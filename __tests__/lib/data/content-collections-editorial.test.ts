import { describe, expect, it } from "vitest";

import { contentCollections } from "@/lib/data/content-collections";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

const CATALOG_SLUGS = new Set(directoryTools.map((tool) => tool.slug));
const PUBLIC_SLUGS = contentCollections.map((c) => c.slug);

describe("content-collections editorial baseline (V2)", () => {
  it("ships exactly the 12 intended public Collections", () => {
    expect(contentCollections).toHaveLength(12);
    expect(new Set(PUBLIC_SLUGS).size).toBe(PUBLIC_SLUGS.length);
  });

  it("does not include any draft / scheduled / archived Collection in the public baseline", () => {
    for (const collection of contentCollections) {
      expect(
        collection.editorial_state === "published" ||
          collection.editorial_state === "featured",
        `${collection.slug} has editorial_state=${collection.editorial_state}, expected published or featured`,
      ).toBe(true);
    }
  });

  it("every Collection references only tools that exist in the public catalog", () => {
    for (const collection of contentCollections) {
      for (const slot of collection.included_tools) {
        expect(
          CATALOG_SLUGS.has(slot.tool_slug),
          `${collection.slug} references unknown tool: ${slot.tool_slug}`,
        ).toBe(true);
      }
    }
  });

  it("every Collection has at least one CORE slot and no duplicate tool slugs", () => {
    for (const collection of contentCollections) {
      const slugs = collection.included_tools.map((slot) => slot.tool_slug);
      expect(
        new Set(slugs).size,
        `${collection.slug} has duplicate tool slugs`,
      ).toBe(slugs.length);
      const coreCount = collection.included_tools.filter(
        (slot) => (slot.status ?? "core") === "core",
      ).length;
      expect(coreCount, `${collection.slug} has no CORE slot`).toBeGreaterThan(0);
    }
  });

  it("order field is unique inside each Collection", () => {
    for (const collection of contentCollections) {
      const orders = collection.included_tools.map((slot) => slot.order ?? 0);
      expect(
        new Set(orders).size,
        `${collection.slug} has duplicate order values`,
      ).toBe(orders.length);
    }
  });

  it("all related_collection_slugs and look_instead_at reference real Collections", () => {
    const slugSet = new Set(PUBLIC_SLUGS);
    for (const collection of contentCollections) {
      const declared = [
        ...(collection.stack_meta?.related_collection_slugs ?? []),
        ...(collection.anti_recommendation?.look_instead_at ?? []),
      ];
      for (const target of declared) {
        expect(
          slugSet.has(target),
          `${collection.slug} references unknown collection: ${target}`,
        ).toBe(true);
        expect(
          target !== collection.slug,
          `${collection.slug} self-references in related_collection_slugs`,
        ).toBe(true);
      }
    }
  });

  it("no Collection links to itself through any field", () => {
    for (const collection of contentCollections) {
      for (const slot of collection.included_tools) {
        if (slot.alternatives && slot.alternatives.includes(collection.slug)) {
          throw new Error(
            `${collection.slug} lists itself as alternative in slot ${slot.tool_slug}`,
          );
        }
      }
    }
  });

  it("all stack_variants reference real tool slugs when present", () => {
    for (const collection of contentCollections) {
      if (!collection.stack_variants) continue;
      for (const variant of collection.stack_variants) {
        for (const slug of variant.core_tool_slugs) {
          expect(
            CATALOG_SLUGS.has(slug),
            `${collection.slug} variant ${variant.label} references unknown tool: ${slug}`,
          ).toBe(true);
        }
      }
    }
  });

  it("LEAN variant never exceeds 4 core tool slugs (editorial discipline)", () => {
    for (const collection of contentCollections) {
      const lean = collection.stack_variants?.find((v) => v.label === "lean");
      if (!lean) continue;
      expect(
        lean.core_tool_slugs.length,
        `${collection.slug} LEAN variant has too many tools (${lean.core_tool_slugs.length})`,
      ).toBeLessThanOrEqual(4);
    }
  });

  it("never uses 'frase-ai' as a memory/note-only role (forced-mapping audit)", () => {
    for (const collection of contentCollections) {
      for (const slot of collection.included_tools) {
        if (slot.tool_slug !== "frase-ai") continue;
        const role = slot.role.toLowerCase();
        expect(
          !role.includes("memoria") &&
            !role.includes("memory") &&
            !role.includes("note") &&
            !role.includes("archivio"),
          `${collection.slug} uses frase-ai as memory/note role: "${slot.role}"`,
        ).toBe(true);
      }
    }
  });

  it("never uses 'synthesia-ai' as a generic text-editing tool (forced-mapping audit)", () => {
    for (const collection of contentCollections) {
      for (const slot of collection.included_tools) {
        if (slot.tool_slug !== "synthesia-ai") continue;
        const role = slot.role.toLowerCase();
        const note = (slot.note ?? "").toLowerCase();
        const combo = `${role} ${note}`;
        expect(
          combo.includes("avatar") ||
            combo.includes("voiceover") ||
            combo.includes("voce") ||
            combo.includes("parlato") ||
            combo.includes("talking") ||
            combo.includes("training") ||
            combo.includes("formazione") ||
            combo.includes("corporate") ||
            combo.includes("onboarding"),
          `${collection.slug} misrepresents Synthesia as "${slot.role}" — must mention avatar/voiceover/corporate context`,
        ).toBe(true);
      }
    }
  });

  it("every Collection has a rationale of at least 80 characters (editorial depth)", () => {
    for (const collection of contentCollections) {
      expect(
        collection.rationale.length,
        `${collection.slug} rationale is too short`,
      ).toBeGreaterThanOrEqual(80);
    }
  });

  it("every Collection has stack_meta and at least 2 highlights", () => {
    for (const collection of contentCollections) {
      expect(
        collection.stack_meta,
        `${collection.slug} missing stack_meta`,
      ).toBeDefined();
      expect(
        collection.highlights.length,
        `${collection.slug} has fewer than 2 highlights`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});
