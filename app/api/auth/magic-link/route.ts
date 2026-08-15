import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "@/lib/validation/zod";

import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import {
  consumeRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
} from "@/lib/security/distributed-state";
import { magicLinkRateLimitPolicies } from "@/lib/security/rate-limit-policies";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const magicLinkRequestSchema = z
  .object({
    email: z.string().email(),
    metadata: z.record(z.string(), metadataValueSchema.optional()).optional(),
  })
  .strict();

const GENERATE_LINK_TIMEOUT_MS = 10_000;

function clean(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOrigin(value?: string | null) {
  const trimmed = clean(value);

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function getAllowedAuthOrigins() {
  return Array.from(
    new Set(
      [
        ...(process.env.ALLOWED_AUTH_ORIGINS ?? "").split(","),
        process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN,
        process.env.NEXT_PUBLIC_SITE_URL,
      ]
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean) as string[],
    ),
  );
}

async function deliverLocalAuthEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "";
  const local = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");
  if (!local) return false;
  try {
    const response = await fetch("http://127.0.0.1:54324/api/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "noreply@localhost", Name: "TooolVibes local" },
        To: [{ Email: input.to }],
        Subject: input.subject,
        HTML: input.html,
        Text: input.text,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function getCallbackOrigin() {
  const origin =
    normalizeOrigin(process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const allowedOrigins = getAllowedAuthOrigins();

  if (!origin || !allowedOrigins.includes(origin)) {
    return null;
  }

  return origin;
}

function getAuthCallbackUrl(callbackOrigin: string, tokenHash: string) {
  const url = new URL("/auth/callback", callbackOrigin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "email");
  return url.toString();
}

function getSignupHtml(confirmUrl: string) {
  return `
    <h2>Pronto per diventare un TooolViber?</h2>

    <p>
      Conferma la tua email e collega il tuo spazio TooolVibes:
      shortlist, confronti e tool salvati resteranno agganciati al tuo account.
    </p>

    <p>
      <a href="${confirmUrl}">
        Conferma e apri TooolVibes
      </a>
    </p>

    <p>Se il pulsante non funziona, copia e incolla questo link nel browser:</p>

    <p>${confirmUrl}</p>

    <p>Se non hai richiesto tu questa email, puoi ignorarla.</p>
  `;
}

function getSignupText(confirmUrl: string) {
  return [
    "Pronto per diventare un TooolViber?",
    "",
    "Conferma la tua email e collega il tuo spazio TooolVibes: shortlist, confronti e tool salvati resteranno agganciati al tuo account.",
    "",
    `Conferma e apri TooolVibes: ${confirmUrl}`,
    "",
    "Se non hai richiesto tu questa email, puoi ignorarla.",
  ].join("\n");
}

function projectRefFromUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    const match = /^([a-z0-9]+)\.supabase\.co$/i.exec(host);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function sanitizeErrorMessage(message: string | undefined) {
  if (!message) return undefined;
  return message
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted-key]")
    .replace(/https?:\/\/\S+/g, "[redacted-url]")
    .slice(0, 240);
}


function authDebugEnabled() {
  const raw = clean(process.env.TOOOLVIBES_AUTH_DEBUG)?.toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function safeDebugFields(fields: Record<string, string | number | boolean | undefined | null>) {
  if (!authDebugEnabled()) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

function getErrorMessage(error: unknown) {
  const candidate = error as { message?: string; code?: string | number; status?: number };
  const detail = `${candidate?.code ?? ""} ${candidate?.message ?? ""}`.toLowerCase();

  if (detail.includes("signup") && detail.includes("disabled")) {
    return "I nuovi account non sono disponibili in questo momento.";
  }

  if (detail.includes("not allowed") || detail.includes("redirect")) {
    return "Il link di conferma non è configurato correttamente. Riprova tra poco.";
  }

  if (detail.includes("weak_password") || detail.includes("password")) {
    return "Non siamo riusciti a generare il link di accesso. Riprova tra poco.";
  }

  return "Non siamo riusciti a generare il link di accesso. Riprova tra poco.";
}

function logMagicLinkFailure(
  correlationId: string,
  fields: Record<string, string | number | boolean | undefined | null>,
) {
  const safe: Record<string, string | number | boolean | null> = {
    correlationId,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    safe[key] = value;
  }
  console.error("[auth.magic-link] generateLink failed", safe);
}

type GenerateLinkResult = {
  data: {
    properties: { hashed_token?: string } | null;
    user?: unknown;
  };
  error: { name?: string; message?: string; code?: string | number; status?: number } | null;
};

async function generateMagicLink(
  _supabase: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  metadata: Record<string, string | number | boolean | null | undefined> | undefined,
  callbackUrl: string,
): Promise<GenerateLinkResult> {
  const adminEnv = getSupabaseAdminEnv();
  const baseUrl = adminEnv.url?.replace(/\/$/, "");
  const serviceKey = adminEnv.serviceRoleKey;

  if (!baseUrl || !serviceKey) {
    return {
      data: { properties: null },
      error: { name: "ConfigError", message: "Missing Supabase admin env", code: "config", status: 503 },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GENERATE_LINK_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email,
        options: {
          data: metadata ?? {},
          redirect_to: callbackUrl,
        },
      }),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
    } catch {
      return {
        data: { properties: null },
        error: {
          name: "AuthUnknownError",
          message: rawText.slice(0, 180),
          code: "invalid_json",
          status: response.status || 500,
        },
      };
    }

    if (!response.ok) {
      return {
        data: { properties: null },
        error: {
          name: "AuthApiError",
          message: String((parsed as { msg?: string; message?: string } | null)?.msg
            ?? (parsed as { message?: string } | null)?.message
            ?? `generate_link HTTP ${response.status}`),
          code: String((parsed as { error_code?: string; code?: string } | null)?.error_code
            ?? (parsed as { code?: string } | null)?.code
            ?? response.status),
          status: response.status,
        },
      };
    }

    const hashed =
      (typeof parsed?.hashed_token === "string" && parsed.hashed_token)
      || (typeof (parsed?.properties as { hashed_token?: string } | undefined)?.hashed_token === "string"
        ? (parsed?.properties as { hashed_token?: string }).hashed_token
        : undefined);

    return {
      data: {
        properties: { hashed_token: hashed },
        user: parsed?.user ?? parsed,
      },
      error: null,
    };
  } catch (thrown) {
    const candidate = thrown as { name?: string; message?: string };
    const aborted = candidate?.name === "AbortError";
    return {
      data: { properties: null },
      error: {
        name: candidate?.name ?? "Error",
        message: aborted ? "generateLink timed out" : sanitizeErrorMessage(candidate?.message),
        code: aborted ? "timeout" : "fetch_failed",
        status: aborted ? 504 : 500,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const correlationId = randomUUID();
  let body: z.infer<typeof magicLinkRequestSchema>;

  try {
    const parsed = magicLinkRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Richiesta non valida.", issues: parsed.error.issues, correlationId },
        { status: 400 },
      );
    }

    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Richiesta non valida.", correlationId },
      { status: 400 },
    );
  }

  const email = clean(body.email)?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, message: "Inserisci una email valida.", correlationId },
      { status: 400 },
    );
  }

  try {
    const emailDecision = await consumeRateLimit({
      ...magicLinkRateLimitPolicies.email,
      identifiers: [email],
    });
    if (!emailDecision.allowed) {
      return NextResponse.json(
        { ok: false, message: "Troppe richieste. Riprova tra poco.", correlationId },
        { status: 429, headers: rateLimitResponseHeaders(emailDecision) },
      );
    }

    const ipDecision = await consumeRateLimit({
      ...magicLinkRateLimitPolicies.ip,
      identifiers: [getRequestAddress(request)],
    });
    if (!ipDecision.allowed) {
      return NextResponse.json(
        { ok: false, message: "Troppe richieste. Riprova tra poco.", correlationId },
        { status: 429, headers: rateLimitResponseHeaders(ipDecision) },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, message: "Accesso email non disponibile in questo momento.", correlationId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const adminEnv = getSupabaseAdminEnv();
  const urlProjectRef = projectRefFromUrl(adminEnv.url);
  const serviceKeyPresent = Boolean(adminEnv.serviceRoleKey);
  const serviceKeyProjectRef = adminEnv.serviceRoleProjectRef;

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    logMagicLinkFailure(correlationId, {
      reason: "admin_env_missing",
      urlProjectRef: urlProjectRef ?? null,
      serviceKeyPresent,
      serviceKeyProjectRef: serviceKeyProjectRef ?? null,
    });
    return NextResponse.json(
      {
        ok: false,
        message: "Accesso email non disponibile in questo momento.",
        correlationId,
      },
      { status: 503 },
    );
  }

  if (
    serviceKeyProjectRef &&
    urlProjectRef &&
    serviceKeyProjectRef !== urlProjectRef
  ) {
    logMagicLinkFailure(correlationId, {
      reason: "project_ref_mismatch",
      urlProjectRef,
      serviceKeyPresent,
      serviceKeyProjectRef,
    });
    return NextResponse.json(
      {
        ok: false,
        message: "Accesso email non disponibile in questo momento.",
        correlationId,
      },
      { status: 503 },
    );
  }

  const callbackOrigin = getCallbackOrigin();

  if (!callbackOrigin) {
    logMagicLinkFailure(correlationId, {
      reason: "redirect_origin_misconfigured",
      urlProjectRef: urlProjectRef ?? null,
      serviceKeyPresent,
    });
    return NextResponse.json(
      { ok: false, message: "Origine di conferma non configurata.", correlationId },
      { status: 400 },
    );
  }

  const callbackUrl = `${callbackOrigin}/auth/callback`;

  let data: Awaited<ReturnType<typeof generateMagicLink>>["data"];
  let error: Awaited<ReturnType<typeof generateMagicLink>>["error"];

  try {
    ({ data, error } = await generateMagicLink(
      supabase,
      email,
      body.metadata,
      callbackUrl,
    ));
  } catch (thrown) {
    const candidate = thrown as { name?: string; message?: string; code?: string | number; status?: number };
    logMagicLinkFailure(correlationId, {
      reason: "generate_link_throw",
      errorName: candidate?.name ?? "Error",
      errorCode: candidate?.code != null ? String(candidate.code) : undefined,
      httpStatus: candidate?.status ?? 500,
      sanitizedMessage: sanitizeErrorMessage(candidate?.message),
      hashedTokenAbsent: true,
      urlProjectRef: urlProjectRef ?? null,
      serviceKeyPresent,
      serviceKeyProjectRef: serviceKeyProjectRef ?? null,
    });
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(thrown),
        correlationId,
        debug: safeDebugFields({
          reason: "generate_link_throw",
          errorName: candidate?.name ?? "Error",
          errorCode: candidate?.code != null ? String(candidate.code) : null,
          httpStatus: candidate?.status ?? 500,
          sanitizedMessage: sanitizeErrorMessage(candidate?.message) ?? null,
          hashedTokenAbsent: true,
          urlProjectRef: urlProjectRef ?? null,
          serviceKeyPresent,
          serviceKeyProjectRef: serviceKeyProjectRef ?? null,
          serviceKeyJwt: Boolean(adminEnv.serviceRoleKey?.startsWith("eyJ")),
          serviceKeyLen: adminEnv.serviceRoleKey?.length ?? 0,
          urlHost: (() => {
            try { return adminEnv.url ? new URL(adminEnv.url).host : null; } catch { return "invalid_url"; }
          })(),
        }),
      },
      { status: 500 },
    );
  }

  const hashedToken = data?.properties?.hashed_token;
  const hashedTokenAbsent = !hashedToken;

  if (error || hashedTokenAbsent) {
    const candidate = error as
      | { name?: string; message?: string; code?: string | number; status?: number }
      | null
      | undefined;
    logMagicLinkFailure(correlationId, {
      reason: error ? "generate_link_error" : "hashed_token_absent",
      errorName: candidate?.name ?? (error ? "AuthError" : "MissingHashedToken"),
      errorCode: candidate?.code != null ? String(candidate.code) : undefined,
      httpStatus: candidate?.status ?? 500,
      sanitizedMessage: sanitizeErrorMessage(candidate?.message),
      hashedTokenAbsent,
      urlProjectRef: urlProjectRef ?? null,
      serviceKeyPresent,
      serviceKeyProjectRef: serviceKeyProjectRef ?? null,
    });
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
        correlationId,
        debug: safeDebugFields({
          reason: error ? "generate_link_error" : "hashed_token_absent",
          errorName: candidate?.name ?? (error ? "AuthError" : "MissingHashedToken"),
          errorCode: candidate?.code != null ? String(candidate.code) : null,
          httpStatus: candidate?.status ?? 500,
          sanitizedMessage: sanitizeErrorMessage(candidate?.message) ?? null,
          hashedTokenAbsent,
          urlProjectRef: urlProjectRef ?? null,
          serviceKeyPresent,
          serviceKeyProjectRef: serviceKeyProjectRef ?? null,
          serviceKeyJwt: Boolean(adminEnv.serviceRoleKey?.startsWith("eyJ")),
          serviceKeyLen: adminEnv.serviceRoleKey?.length ?? 0,
          urlHost: (() => {
            try { return adminEnv.url ? new URL(adminEnv.url).host : null; } catch { return "invalid_url"; }
          })(),
        }),
      },
      { status: 500 },
    );
  }

  const confirmUrl = getAuthCallbackUrl(callbackOrigin, hashedToken);
  const result = await sendEmail({
    to: email,
    subject: "Entra in TooolVibes",
    html: getSignupHtml(confirmUrl),
    text: getSignupText(confirmUrl),
  });

  if (!result.sent) {
    const deliveredLocally = await deliverLocalAuthEmail({
      to: email,
      subject: "Entra in TooolVibes",
      html: getSignupHtml(confirmUrl),
      text: getSignupText(confirmUrl),
    });
    if (!deliveredLocally) {
      const message =
        result.reason === "disabled"
          ? "Invio email non disponibile in questo momento."
          : "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco.";
      return NextResponse.json({ ok: false, message, correlationId }, { status: 503 });
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Email di conferma inviata a ${email}. Aprila per creare o collegare l'account alla tua selezione.`,
    correlationId,
  });
}
