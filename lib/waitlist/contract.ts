import { z } from "@/lib/validation/zod";

import { waitlistPublicRequestSchema } from "@/lib/public-submissions/contracts";
export const WAITLIST_SOURCE = "coming-soon" as const;
export const WAITLIST_CONSENT_VERSION = "waitlist-v1" as const;

export const waitlistRequestSchema = waitlistPublicRequestSchema;

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
