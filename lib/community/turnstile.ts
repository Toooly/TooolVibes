import "server-only";

import { z } from "@/lib/validation/zod";
import { getRequestAddress } from "@/lib/security/distributed-state";

const COMMUNITY_TURNSTILE_ACTION = "community_experience";

const turnstileResponseSchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
});

function getTurnstileSecret() {
  return process.env.TOOOLVIBES_TURNSTILE_SECRET_KEY?.trim() || "";
}

export type CommunityTurnstileResult =
  | { allowed: true }
  | { allowed: false; reason: "required" | "failed" | "unavailable" };

export async function verifyCommunityTurnstile(
  request: Request,
  captchaToken: string,
): Promise<CommunityTurnstileResult> {
  const secret = getTurnstileSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, reason: "unavailable" };
    }
    return { allowed: true };
  }
  if (!captchaToken) {
    return { allowed: false, reason: "required" };
  }

  const verificationBody = new URLSearchParams({
    secret,
    response: captchaToken,
  });
  const remoteIp = getRequestAddress(request);
  if (remoteIp !== "unknown") {
    verificationBody.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: verificationBody,
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) {
      return { allowed: false, reason: "unavailable" };
    }
    const result = turnstileResponseSchema.safeParse(await response.json());
    if (
      !result.success ||
      !result.data.success ||
      result.data.action !== COMMUNITY_TURNSTILE_ACTION
    ) {
      return { allowed: false, reason: "failed" };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}
