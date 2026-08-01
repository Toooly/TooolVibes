import { describe, expect, expectTypeOf, it } from "vitest";

import {
  completeToolPublicFixture,
  directoryToolFixture,
  draftToolRecordFixture,
  invalidToolPublicFixture,
  partialToolPublicFixture,
  publishedToolRecordFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  adaptDirectoryToolToPublic,
  adaptToolRecordToPublic,
  type DirectoryToolPublicationContext,
} from "@/lib/data/tool-public-adapters";
import { mockTools } from "@/lib/data/mock-tools";
import { directoryTools, type DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import {
  parseToolPublic,
  safeParseToolPublic,
  type ToolPublic,
} from "@/lib/types/tool-public";

describe("ToolPublic runtime contract", () => {
  it("accepts a complete canonical fixture and preserves its type", () => {
    const parsed = parseToolPublic(completeToolPublicFixture);

    expect(parsed).toEqual(completeToolPublicFixture);
    expectTypeOf(parsed).toEqualTypeOf<ToolPublic>();
  });

  it("accepts an explicit partial record without adding defaults", () => {
    const parsed = parseToolPublic(partialToolPublicFixture);

    expect(parsed.taxonomy.canonicalCategory).toBeNull();
    expect(parsed.editorial.evidence).toEqual([]);
    expect(parsed.score).toBeNull();
    expect(parsed.media.coverImageUrl).toBeNull();
    expect(parsed.provenance.missingFields).toEqual([
      "score",
      "taxonomy.canonicalCategory",
    ]);
  });

  it("rejects invalid identity and unsafe URL protocols", () => {
    const result = safeParseToolPublic(invalidToolPublicFixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("slug");
      expect(paths).toContain("urls.website");
    }
  });

  it("rejects impossible dates and draft records with a publication date", () => {
    const impossibleDate = {
      ...completeToolPublicFixture,
      publication: { status: "published", publishedAt: "2026-02-30" },
    };
    const datedDraft = {
      ...partialToolPublicFixture,
      publication: { status: "draft", publishedAt: "2026-07-10" },
    };

    expect(safeParseToolPublic(impossibleDate).success).toBe(false);
    expect(safeParseToolPublic(datedDraft).success).toBe(false);
  });

  it("accepts Postgres microseconds and explicit timezone offsets", () => {
    const withDatabasePrecision = {
      ...completeToolPublicFixture,
      lifecycle: {
        ...completeToolPublicFixture.lifecycle,
        createdAt: "2026-07-01T08:00:00.123456Z",
        updatedAt: "2026-07-11T12:00:00.123456+02:00",
      },
    };

    expect(safeParseToolPublic(withDatabasePrecision).success).toBe(true);
  });

  it("rejects duplicate score dimensions instead of averaging them", () => {
    const duplicateScore = {
      ...completeToolPublicFixture,
      score: {
        ...completeToolPublicFixture.score,
        inputs: [
          { dimension: "ease_of_use", level: "solid" },
          { dimension: "ease_of_use", level: "strong" },
        ],
      },
    };

    expect(safeParseToolPublic(duplicateScore).success).toBe(false);
  });
});

describe("ToolRecord adapter", () => {
  it("maps only explicit ToolRecord fields and records missing publication provenance", () => {
    const tool = adaptToolRecordToPublic(publishedToolRecordFixture);

    expect(tool.slug).toBe(publishedToolRecordFixture.slug);
    expect(tool.publication).toEqual({ status: "published", publishedAt: null });
    expect(tool.lifecycle.discoveredAt).toBe(publishedToolRecordFixture.date_discovered);
    expect(tool.urls).toEqual({
      website: publishedToolRecordFixture.website_url,
      affiliate: publishedToolRecordFixture.affiliate_url,
      editorial: publishedToolRecordFixture.tooolvibes_post_url,
    });
    expect(tool.taxonomy.canonicalCategory).toBe("Assistente AI");
    expect(tool.editorial.evidence.map((item) => item.sourceField)).toEqual([
      "editorial_note",
      "why_here",
      "strengths",
      "cautions",
    ]);
    expect(tool.score).toBeNull();
    expect(tool.provenance.missingFields).toContain("publication.publishedAt");
    expect(tool.provenance.missingFields).toContain("score");
    expectTypeOf(tool).toEqualTypeOf<ToolPublic>();
  });

  it("keeps an unpublished partial ToolRecord as a draft with no invented evidence or score", () => {
    const tool = adaptToolRecordToPublic(draftToolRecordFixture);

    expect(tool.publication).toEqual({ status: "draft", publishedAt: null });
    expect(tool.urls.editorial).toBeNull();
    expect(tool.content.bestFor).toBeNull();
    expect(tool.content.useCases).toEqual([]);
    expect(tool.editorial.evidence).toEqual([]);
    expect(tool.score).toBeNull();
    expect(tool.attributes.pricing).toBeNull();
    expect(tool.attributes.platforms).toEqual([]);
    expect(tool.media.coverImageUrl).toBeNull();
    expect(tool.provenance.missingFields).toEqual(
      expect.arrayContaining([
        "urls.editorial",
        "content.bestFor",
        "editorial.evidence",
        "score",
      ]),
    );
  });

  it("rejects an invalid legacy record at the canonical boundary", () => {
    const invalidRecord = {
      ...publishedToolRecordFixture,
      website_url: "not-a-url",
    } as ToolRecord;

    expect(() => adaptToolRecordToPublic(invalidRecord)).toThrow();
  });
});

describe("DirectoryTool adapter", () => {
  it("requires explicit publication context at compile time", () => {
    type ActualParameters = Parameters<typeof adaptDirectoryToolToPublic>;
    type ExpectedParameters = [DirectoryTool, DirectoryToolPublicationContext];

    expectTypeOf<ActualParameters>().toEqualTypeOf<ExpectedParameters>();
  });

  it("maps authoritative source fields and does not reuse legacy derived aliases", () => {
    const tool = adaptDirectoryToolToPublic(directoryToolFixture, { status: "published" });

    expect(tool.publication).toEqual({
      status: "published",
      publishedAt: directoryToolFixture.publishedAt,
    });
    expect(tool.urls.website).toBe(directoryToolFixture.externalUrl);
    expect(tool.urls.website).not.toBe(directoryToolFixture.url);
    expect(tool.urls.affiliate).toBe(directoryToolFixture.affiliateUrl);
    expect(tool.urls.editorial).toBe(directoryToolFixture.originalSourceUrl);
    expect(tool.urls.editorial).not.toBe(directoryToolFixture.originalArticleUrl);
    expect(tool.content.summary).toBe(directoryToolFixture.shortDescription);
    expect(tool.content.summary).not.toBe(directoryToolFixture.tldr);
    expect(tool.content.description).toBe(directoryToolFixture.longDescription);
    expect(tool.content.description).not.toBe(directoryToolFixture.description);
    expect(tool.taxonomy.canonicalCategory).toBeNull();
    expect(tool.score).toBeNull();
    expect(tool.media.coverImageUrl).toBeNull();
    expect(tool.provenance.missingFields).toEqual(
      expect.arrayContaining([
        "taxonomy.canonicalCategory",
        "score",
        "media.coverImageUrl",
      ]),
    );
  });

  it("can explicitly adapt the same directory record as unpublished", () => {
    const tool = adaptDirectoryToolToPublic(directoryToolFixture, { status: "draft" });

    expect(tool.publication).toEqual({ status: "draft", publishedAt: null });
  });

  it("runtime-validates every current legacy fixture", () => {
    for (const record of mockTools) {
      expect(adaptToolRecordToPublic(record).slug).toBe(record.slug);
    }

    for (const directoryTool of directoryTools) {
      expect(
        adaptDirectoryToolToPublic(directoryTool, { status: "published" }).slug,
      ).toBe(directoryTool.slug);
    }
  });
});
