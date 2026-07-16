import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import {
  editorialScoreDimensionValues,
  type ToolRecord,
} from "@/lib/types/tool";
import { parseToolPublic, type ToolPublic } from "@/lib/types/tool-public";

export type DirectoryToolPublicationContext =
  | { status: "published" }
  | { status: "draft" };

type EditorialEvidence = ToolPublic["editorial"]["evidence"][number];

function toNullableText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uniqueNonEmpty(values: readonly string[] | null | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function buildToolRecordEvidence(record: ToolRecord): EditorialEvidence[] {
  const evidence: EditorialEvidence[] = [];
  const editorialNote = toNullableText(record.editorial_note);
  const whyHere = toNullableText(record.why_here);

  if (editorialNote) {
    evidence.push({
      kind: "review",
      text: editorialNote,
      sourceField: "editorial_note",
    });
  }

  if (whyHere) {
    evidence.push({
      kind: "rationale",
      text: whyHere,
      sourceField: "why_here",
    });
  }

  for (const strength of uniqueNonEmpty(record.strengths)) {
    evidence.push({ kind: "strength", text: strength, sourceField: "strengths" });
  }

  for (const caution of uniqueNonEmpty(record.cautions)) {
    evidence.push({ kind: "caution", text: caution, sourceField: "cautions" });
  }

  return evidence;
}

function buildDirectoryToolEvidence(tool: DirectoryTool): EditorialEvidence[] {
  const evidence: EditorialEvidence[] = [];
  const review = toNullableText(tool.editorialReview);
  const rationale = toNullableText(tool.whyItMatters);

  if (review) {
    evidence.push({ kind: "review", text: review, sourceField: "editorialReview" });
  }

  if (rationale) {
    evidence.push({ kind: "rationale", text: rationale, sourceField: "whyItMatters" });
  }

  for (const highlight of uniqueNonEmpty(tool.highlights)) {
    evidence.push({ kind: "highlight", text: highlight, sourceField: "highlights" });
  }

  return evidence;
}

function buildToolRecordScore(record: ToolRecord): ToolPublic["score"] {
  const inputs = editorialScoreDimensionValues.flatMap((dimension) => {
    const level = record.editorial_scorecard?.[dimension];
    return level ? [{ dimension, level }] : [];
  });

  if (inputs.length === 0) {
    return null;
  }

  return {
    inputs,
    provenance: {
      kind: "editorial-assessment",
      sourceField: "editorial_scorecard",
      methodologyVersion: "legacy-editorial-scorecard-v1",
      assessedAt: null,
    },
  };
}

function getToolRecordMissingFields(
  record: ToolRecord,
  score: ToolPublic["score"],
  evidence: EditorialEvidence[],
) {
  return uniqueNonEmpty([
    record.is_published ? "publication.publishedAt" : "",
    record.affiliate_url ? "" : "urls.affiliate",
    record.tooolvibes_post_url ? "" : "urls.editorial",
    record.cover_image_url ? "" : "media.coverImageUrl",
    record.best_for ? "" : "content.bestFor",
    record.use_cases?.length ? "" : "content.useCases",
    evidence.length ? "" : "editorial.evidence",
    record.pricing ? "" : "attributes.pricing",
    record.platforms?.length ? "" : "attributes.platforms",
    score ? "score.provenance.assessedAt" : "score",
  ]);
}

export function adaptToolRecordToPublic(record: ToolRecord): ToolPublic {
  const evidence = buildToolRecordEvidence(record);
  const score = buildToolRecordScore(record);

  return parseToolPublic({
    schemaVersion: 1,
    slug: record.slug,
    name: record.name,
    publication: record.is_published
      ? { status: "published", publishedAt: null }
      : { status: "draft", publishedAt: null },
    urls: {
      website: record.website_url,
      affiliate: toNullableText(record.affiliate_url),
      editorial: toNullableText(record.tooolvibes_post_url),
    },
    taxonomy: {
      canonicalCategory: record.category,
      sourceCategory: record.category,
      sourceCategoryLabel: record.category,
      tags: uniqueNonEmpty(record.tags),
    },
    content: {
      summary: record.short_description_it,
      description: record.description_it,
      bestFor: toNullableText(record.best_for),
      useCases: uniqueNonEmpty(record.use_cases),
    },
    editorial: { evidence },
    score,
    attributes: {
      pricing: record.pricing ?? null,
      platforms: uniqueNonEmpty(record.platforms),
      level: null,
      segments: [],
    },
    media: {
      coverImageUrl: toNullableText(record.cover_image_url),
    },
    flags: {
      featured: record.is_featured,
    },
    lifecycle: {
      discoveredAt: record.date_discovered,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    },
    provenance: {
      sourceKind: "tool-record",
      sourceId: record.id,
      sourceLabel: toNullableText(record.source),
      adapterVersion: "tool-public-v1",
      missingFields: getToolRecordMissingFields(record, score, evidence),
    },
  });
}

function getDirectoryMissingFields(tool: DirectoryTool) {
  return uniqueNonEmpty([
    "taxonomy.canonicalCategory",
    tool.affiliateUrl ? "" : "urls.affiliate",
    "score",
    "attributes.pricing",
    "attributes.platforms",
    "media.coverImageUrl",
    "lifecycle.discoveredAt",
    "lifecycle.createdAt",
    "lifecycle.updatedAt",
  ]);
}

export function adaptDirectoryToolToPublic(
  tool: DirectoryTool,
  publication: DirectoryToolPublicationContext,
): ToolPublic {
  return parseToolPublic({
    schemaVersion: 1,
    slug: tool.slug,
    name: tool.name,
    publication:
      publication.status === "published"
        ? { status: "published", publishedAt: tool.publishedAt }
        : { status: "draft", publishedAt: null },
    urls: {
      website: tool.externalUrl,
      affiliate: toNullableText(tool.affiliateUrl),
      editorial: toNullableText(tool.originalSourceUrl),
    },
    taxonomy: {
      canonicalCategory: null,
      sourceCategory: tool.category,
      sourceCategoryLabel: tool.categoryLabel,
      tags: uniqueNonEmpty(tool.tags),
    },
    content: {
      summary: tool.shortDescription,
      description: tool.longDescription,
      bestFor: toNullableText(tool.idealUseCase),
      useCases: uniqueNonEmpty(tool.useCases),
    },
    editorial: {
      evidence: buildDirectoryToolEvidence(tool),
    },
    score: null,
    attributes: {
      pricing: null,
      platforms: [],
      level: {
        key: tool.level,
        label: tool.levelLabel,
      },
      segments: uniqueNonEmpty(tool.segments),
    },
    media: {
      coverImageUrl: null,
    },
    flags: {
      featured: tool.featured,
    },
    lifecycle: {
      discoveredAt: null,
      createdAt: null,
      updatedAt: null,
    },
    provenance: {
      sourceKind: "directory-tool",
      sourceId: tool.id,
      sourceLabel: tool.sourceSite,
      adapterVersion: "tool-public-v1",
      missingFields: getDirectoryMissingFields(tool),
    },
  });
}
