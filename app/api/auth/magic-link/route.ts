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

async function generateMagicLink(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  metadata: Record<string, string | number | boolean | null | undefined> | undefined,
  callbackUrl: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          data: metadata ?? {},
          redirectTo: callbackUrl,
        },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error("generateLink timed out"), { code: "timeout", status: 504 }));
        }, GENERATE_LINK_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
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
    const message =
      result.reason === "disabled"
        ? "Invio email non disponibile in questo momento."
        : "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco.";

    return NextResponse.json({ ok: false, message, correlationId }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: `Email di conferma inviata a ${email}. Aprila per creare o collegare l'account alla tua selezione.`,
    correlationId,
  });
}
