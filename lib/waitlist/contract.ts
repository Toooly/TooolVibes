import { z } from "zod";

export const WAITLIST_SOURCE = "coming-soon" as const;
export const WAITLIST_CONSENT_VERSION = "waitlist-v1" as const;

export const waitlistRequestSchema = z
  .object({
    email: z.string().trim().max(254).email(),
  })
  .strict()
  .transform((payload) => ({
    email: payload.email.toLowerCase(),
  }));

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
