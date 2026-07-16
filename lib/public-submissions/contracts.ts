import { z } from "zod";

export const PUBLIC_SUBMISSION_ACTIONS = [
  "tool_request",
  "affiliate_request",
  "waitlist",
] as const;

export type PublicSubmissionAction =
  (typeof PUBLIC_SUBMISSION_ACTIONS)[number];

const httpUrl = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        !url.username &&
        !url.password
      );
    });

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional();

const optionalHttpUrl = (maxLength: number) =>
  httpUrl(maxLength).or(z.literal("")).optional();

const submissionProtectionFields = {
  companyWebsite: z.string().trim().max(200).optional().default(""),
  captchaToken: z.string().trim().max(2_048).optional().default(""),
};

export const WAITLIST_BODY_LIMIT_BYTES = 4 * 1_024;
export const TOOL_REQUEST_BODY_LIMIT_BYTES = 24 * 1_024;
export const AFFILIATE_REQUEST_BODY_LIMIT_BYTES = 20 * 1_024;

export const waitlistPublicRequestSchema = z
  .object({
    email: z.string().trim().max(254).email(),
    ...submissionProtectionFields,
  })
  .strict()
  .transform((payload) => ({
    ...payload,
    email: payload.email.toLowerCase(),
  }));

export const toolRequestSchema = z
  .object({
    submitterType: z.enum(["community", "founder"]).default("community"),
    toolName: z.string().trim().min(2).max(120),
    toolUrl: httpUrl(2_048),
    category: z.string().trim().min(2).max(80),
    level: z.enum(["featured", "beginner", "intermediate", "expert"]),
    email: z.string().trim().max(254).email().or(z.literal("")).optional(),
    message: optionalText(2_000),
    useCase: optionalText(2_000),
    referralUrl: optionalHttpUrl(2_048),
    mediaUrl: optionalHttpUrl(2_048),
    personalNotes: optionalText(2_000),
    founderName: optionalText(120),
    companyRole: optionalText(120),
    launchStage: optionalText(80),
    budgetRange: optionalText(80),
    requestedServices: z
      .array(z.string().trim().min(2).max(80))
      .max(12)
      .refine(
        (values) => new Set(values).size === values.length,
        "I servizi richiesti non possono contenere duplicati.",
      )
      .optional(),
    ...submissionProtectionFields,
  })
  .strict()
  .transform((payload) => ({
    ...payload,
    email: payload.email?.toLowerCase(),
  }));

export const affiliateRequestSchema = z
  .object({
    firstName: optionalText(80),
    lastName: optionalText(80),
    email: z.string().trim().max(254).email().or(z.literal("")).optional(),
    brandName: optionalText(120),
    websiteUrl: optionalHttpUrl(2_048),
    instagram: optionalText(255),
    facebook: optionalText(255),
    tiktok: optionalText(255),
    xProfile: optionalText(255),
    linkedin: optionalText(255),
    youtube: optionalText(255),
    audience: optionalText(2_000),
    channels: optionalText(1_000),
    message: z.string().trim().min(12).max(4_000),
    ...submissionProtectionFields,
  })
  .strict()
  .transform((payload) => ({
    ...payload,
    email: payload.email?.toLowerCase(),
  }));

export type ToolRequestPayload = z.infer<typeof toolRequestSchema>;
export type AffiliateRequestPayload = z.infer<typeof affiliateRequestSchema>;
