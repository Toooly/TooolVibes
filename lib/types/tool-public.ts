import { z } from "@/lib/validation/zod";

import {
  editorialScoreDimensionValues,
  editorialScoreLevelValues,
  toolCategoryValues,
  toolPricingValues,
} from "@/lib/types/tool";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidCalendarDate(value: string) {
  if (dateOnlyPattern.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }

  if (!isoDateTimePattern.test(value) || Number.isNaN(Date.parse(value))) {
    return false;
  }

  return isValidCalendarDate(value.slice(0, 10));
}

const requiredTextSchema = z.string().trim().min(1);
const nullableTextSchema = requiredTextSchema.nullable();
const dateValueSchema = z
  .string()
  .trim()
  .refine(isValidCalendarDate, "Use an ISO date or ISO date-time.");
const nullableDateValueSchema = dateValueSchema.nullable();
const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Only HTTP and HTTPS URLs are accepted.");

const uniqueTextListSchema = z.array(requiredTextSchema).superRefine((values, context) => {
  if (new Set(values).size !== values.length) {
    context.addIssue({
      code: "custom",
      message: "Values must be unique.",
    });
  }
});

const publicationSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("draft"),
      publishedAt: z.null(),
    })
    .strict(),
  z
    .object({
      status: z.literal("published"),
      publishedAt: nullableDateValueSchema,
    })
    .strict(),
]);

const scoreInputSchema = z
  .object({
    dimension: z.enum(editorialScoreDimensionValues),
    /** Legacy editorial scorecard level (measured/solid/strong). */
    level: z.enum(editorialScoreLevelValues).optional(),
    /** Builder-first numeric value (1-5). Mutually preferred over level. */
    value: z.number().int().min(1).max(5).optional(),
  })
  .strict()
  .refine((input) => input.level !== undefined || input.value !== undefined, {
    message: 'Either level or value must be provided.',
  });

const scoreSchema = z
  .object({
    /**
     * A public number is optional while the editorial archive is being
     * migrated. Consumers must still require it, together with the other
     * assessment evidence below, before rendering a score.
     */
    value: z.number().min(0).max(10).nullable().optional(),
    /** Explicit editorial conclusion; never infer one from populated fields. */
    verdict: nullableTextSchema.optional(),
    /** True only after limitations have been explicitly assessed. */
    limitationsAssessed: z.boolean().optional(),
    inputs: z.array(scoreInputSchema).min(1),
    provenance: z
      .object({
        kind: z.enum(["editorial-assessment", "vendor-measurement", "derived-model"]),
        sourceField: requiredTextSchema,
        methodologyVersion: requiredTextSchema,
        assessedAt: nullableDateValueSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((score, context) => {
    const dimensions = score.inputs.map((input) => input.dimension);
    if (new Set(dimensions).size !== dimensions.length) {
      context.addIssue({
        code: "custom",
        path: ["inputs"],
        message: "Each score dimension can appear only once.",
      });
    }
  });

export const toolPublicSchema = z
  .object({
    schemaVersion: z.literal(1),
    slug: z.string().trim().regex(slugPattern),
    name: requiredTextSchema,
    publication: publicationSchema,
    urls: z
      .object({
        website: httpUrlSchema,
        affiliate: httpUrlSchema.nullable(),
        editorial: httpUrlSchema.nullable(),
      })
      .strict(),
    taxonomy: z
      .object({
        canonicalCategory: z.enum(toolCategoryValues).nullable(),
        sourceCategory: requiredTextSchema,
        sourceCategoryLabel: requiredTextSchema,
        tags: uniqueTextListSchema,
      })
      .strict(),
    content: z
      .object({
        summary: requiredTextSchema,
        description: requiredTextSchema,
        bestFor: nullableTextSchema,
        useCases: uniqueTextListSchema,
      })
      .strict(),
    editorial: z
      .object({
        evidence: z.array(
          z
            .object({
              kind: z.enum(["review", "rationale", "strength", "caution", "highlight"]),
              text: requiredTextSchema,
              sourceField: requiredTextSchema,
            })
            .strict(),
        ),
      })
      .strict(),
    score: scoreSchema.nullable(),
    attributes: z
      .object({
        pricing: z.enum(toolPricingValues).nullable(),
        platforms: uniqueTextListSchema,
        level: z
          .object({
            key: requiredTextSchema,
            label: requiredTextSchema,
          })
          .strict()
          .nullable(),
        segments: uniqueTextListSchema,
        editorialNote: z.string().nullable().optional(),
      })
      .strict(),
    media: z
      .object({
        coverImageUrl: httpUrlSchema.nullable(),
      })
      .strict(),
    flags: z
      .object({
        featured: z.boolean(),
      })
      .strict(),
    lifecycle: z
      .object({
        discoveredAt: nullableDateValueSchema,
        createdAt: nullableDateValueSchema,
        updatedAt: nullableDateValueSchema,
      })
      .strict(),
    provenance: z
      .object({
        sourceKind: z.enum(["tool-record", "directory-tool"]),
        sourceId: requiredTextSchema,
        sourceLabel: nullableTextSchema,
        adapterVersion: z.literal("tool-public-v1"),
        missingFields: uniqueTextListSchema,
      })
      .strict(),
  })
  .strict();

export type ToolPublic = z.infer<typeof toolPublicSchema>;
export type ToolPublicPublication = ToolPublic["publication"];

export function parseToolPublic(value: unknown): ToolPublic {
  return toolPublicSchema.parse(value);
}

export function safeParseToolPublic(value: unknown) {
  return toolPublicSchema.safeParse(value);
}
