import "server-only";

import { z } from "@/lib/validation/zod";

import type { PublicSubmissionAction } from "@/lib/public-submissions/contracts";
import { getRequestAddress } from "@/lib/security/distributed-state";

const turnstileResponseSchema = z
  .object({
    success: z.boolean(),
    action: z.string().optional(),
  })
  .passthrough();

export type PublicSubmissionProtectionDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "bot" | "captcha" | "configuration" | "unavailable";
    };

export class PublicSubmissionBodyError extends Error {
  constructor(
    public readonly code:
      | "invalid_content_type"
      | "invalid_json"
      | "too_large",
  ) {
    super(code);
    this.name = "PublicSubmissionBodyError";
  }
}

function parseContentLength(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function readJsonRequestBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^application\/json(?:\s*;|$)/.test(contentType)) {
    throw new PublicSubmissionBodyError("invalid_content_type");
  }

  const contentLength = parseContentLength(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > maxBytes) {
    throw new PublicSubmissionBodyError("too_large");
  }

  if (!request.body) {
    throw new PublicSubmissionBodyError("invalid_json");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new PublicSubmissionBodyError("too_large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new PublicSubmissionBodyError("invalid_json");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PublicSubmissionBodyError("invalid_json");
  }
}


function getTurnstileSecret() {
  const value = process.env.TOOOLVIBES_TURNSTILE_SECRET_KEY?.trim();
  return value || null;
}

export async function verifyPublicSubmissionProtection(input: {
  request: Request;
  action: PublicSubmissionAction;
  companyWebsite: string;
  captchaToken: string;
}): Promise<PublicSubmissionProtectionDecision> {
  if (input.companyWebsite.trim()) {
    return { allowed: false, reason: "bot" };
  }

  const secret = getTurnstileSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, reason: "configuration" };
    }
    return { allowed: true };
  }

  if (!input.captchaToken) {
    return { allowed: false, reason: "captcha" };
  }

  const verificationBody = new URLSearchParams({
    secret,
    response: input.captchaToken,
  });
  const remoteIp = getRequestAddress(input.request);
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
      result.data.action !== input.action
    ) {
      return { allowed: false, reason: "captcha" };
    }

    return { allowed: true };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}
