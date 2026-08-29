import { z } from "@/lib/validation/zod";

export const COMMUNITY_DURATION_BUCKETS = [
  "under_1_month",
  "months_1_3",
  "months_3_6",
  "months_6_12",
  "year_plus",
] as const;

export type DurationBucket = (typeof COMMUNITY_DURATION_BUCKETS)[number];

export const COMMUNITY_STATUSES = [
  "pending",
  "published",
  "hidden",
  "rejected",
] as const;

export type ExperienceStatus = (typeof COMMUNITY_STATUSES)[number];

export const MAX_PUBLIC_PAGE = 8;
export const MAX_PUBLIC_LIMIT = 20;
export const MAX_REQUEST_BYTES = 16 * 1024;

export const toolSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function nfcTrim(value: string) {
  return value.normalize("NFC").trim();
}

const displayNameSchema = z
  .string()
  .transform(nfcTrim)
  .pipe(z.string().min(2).max(80));

const useCaseSchema = z
  .string()
  .transform(nfcTrim)
  .pipe(z.string().min(4).max(80));

const bodySchema = z
  .string()
  .transform((value) => value.normalize("NFC").replace(/^\s+|\s+$/g, ""))
  .pipe(z.string().min(80).max(2000));

const bulletSchema = z
  .string()
  .transform(nfcTrim)
  .pipe(z.string().min(8).max(180));

const bulletsSchema = z.array(bulletSchema).min(1).max(5);

const switchedLabelSchema = z
  .string()
  .transform(nfcTrim)
  .pipe(z.string().min(2).max(80));

export const createExperienceSchema = z
  .object({
    toolSlug: toolSlugSchema,
    displayName: displayNameSchema,
    useCase: useCaseSchema,
    body: bodySchema,
    pros: bulletsSchema,
    limits: bulletsSchema,
    durationBucket: z.enum(COMMUNITY_DURATION_BUCKETS),
    switchedFromSlug: toolSlugSchema.optional(),
    switchedFromLabel: switchedLabelSchema.optional(),
    captchaToken: z.string().min(1).max(4096),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.switchedFromSlug && value.switchedFromLabel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "switchedFrom slug XOR label",
        path: ["switchedFromSlug"],
      });
    }
    if (value.switchedFromSlug && value.switchedFromSlug === value.toolSlug) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "switchedFromSlug cannot equal toolSlug",
        path: ["switchedFromSlug"],
      });
    }
  });

export const updateExperienceSchema = z
  .object({
    expectedUpdatedAt: z.string().min(10).max(40),
    displayName: displayNameSchema.optional(),
    useCase: useCaseSchema.optional(),
    body: bodySchema.optional(),
    pros: bulletsSchema.optional(),
    limits: bulletsSchema.optional(),
    durationBucket: z.enum(COMMUNITY_DURATION_BUCKETS).optional(),
    switchedFromSlug: toolSlugSchema.nullable().optional(),
    switchedFromLabel: switchedLabelSchema.nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const contentKeys = [
      "displayName",
      "useCase",
      "body",
      "pros",
      "limits",
      "durationBucket",
      "switchedFromSlug",
      "switchedFromLabel",
    ] as const;
    if (!contentKeys.some((key) => value[key] !== undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "at least one content field required",
        path: ["expectedUpdatedAt"],
      });
    }
    if (value.switchedFromSlug && value.switchedFromLabel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "switchedFrom slug XOR label",
        path: ["switchedFromSlug"],
      });
    }
  });

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

export type CommunityExperiencePublic = {
  id: string;
  toolSlug: string;
  displayName: string;
  useCase: string;
  body: string;
  pros: string[];
  limits: string[];
  durationBucket: DurationBucket;
  switchedFromSlug: string | null;
  switchedFromLabel: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type CommunityExperienceOwner = CommunityExperiencePublic & {
  status: ExperienceStatus;
  createdAt: string;
  submittedAt: string;
  moderatedAt: string | null;
  moderationReason: string | null;
};

export type CommunityExperienceAdmin = CommunityExperienceOwner & {
  moderatedBy: string | null;
};

export const PUBLIC_COLUMNS =
  "id, tool_slug, display_name, use_case, body, pros, limits, duration_bucket, switched_from_slug, switched_from_label, published_at, updated_at" as const;

export const OWNER_COLUMNS =
  `${PUBLIC_COLUMNS}, status, created_at, submitted_at, moderated_at, moderation_reason` as const;

export const ADMIN_COLUMNS = `${OWNER_COLUMNS}, moderated_by` as const;
