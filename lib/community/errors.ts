import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

export type CommunityErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "INVALID_TOOL"
  | "TURNSTILE_REQUIRED"
  | "TURNSTILE_FAILED"
  | "TURNSTILE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "EXPERIENCE_ALREADY_EXISTS"
  | "EXPERIENCE_NOT_FOUND"
  | "EXPERIENCE_VERSION_CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "SERVER_ERROR";

const STATUS: Record<CommunityErrorCode, number> = {
  AUTH_REQUIRED: 401,
  INVALID_INPUT: 400,
  INVALID_TOOL: 404,
  TURNSTILE_REQUIRED: 400,
  TURNSTILE_FAILED: 400,
  TURNSTILE_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  EXPERIENCE_ALREADY_EXISTS: 409,
  EXPERIENCE_NOT_FOUND: 404,
  EXPERIENCE_VERSION_CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  SERVER_ERROR: 500,
};

const MESSAGE: Record<CommunityErrorCode, string> = {
  AUTH_REQUIRED: "Authentication required.",
  INVALID_INPUT: "Invalid input.",
  INVALID_TOOL: "Unknown tool.",
  TURNSTILE_REQUIRED: "Captcha required.",
  TURNSTILE_FAILED: "Captcha failed.",
  TURNSTILE_UNAVAILABLE: "Captcha unavailable.",
  RATE_LIMITED: "Too many requests.",
  EXPERIENCE_ALREADY_EXISTS: "You already have an experience for this tool.",
  EXPERIENCE_NOT_FOUND: "Experience not found.",
  EXPERIENCE_VERSION_CONFLICT: "Experience was updated elsewhere.",
  PAYLOAD_TOO_LARGE: "Payload too large.",
  SERVER_ERROR: "Server error.",
};

export function communityError(
  code: CommunityErrorCode,
  options: {
    fields?: ZodIssue[];
    headers?: HeadersInit;
  } = {},
) {
  return NextResponse.json(
    {
      error: {
        code,
        message: MESSAGE[code],
        ...(options.fields ? { fields: options.fields } : {}),
      },
    },
    { status: STATUS[code], headers: options.headers },
  );
}
