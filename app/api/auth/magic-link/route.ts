import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const magicLinkRequestSchema = z
  .object({
    email: z.string().email(),
    metadata: z.record(z.string(), metadataValueSchema.optional()).optional(),
  })
  .strict();

const emailRateLimit = new Map<string, number>();
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const EMAIL_RATE_LIMIT_MS = 60 * 1000;
const IP_RATE_LIMIT_MAX = 5;
const IP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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

function getRequestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(request: Request, email: string) {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase();
  const nextEmailAt = emailRateLimit.get(normalizedEmail) ?? 0;

  if (now < nextEmailAt) {
    return false;
  }

  const ip = getRequestIp(request);
  const ipAttempt = ipRateLimit.get(ip);

  if (!ipAttempt || now > ipAttempt.resetAt) {
    ipRateLimit.set(ip, { count: 1, resetAt: now + IP_RATE_LIMIT_WINDOW_MS });
  } else {
    if (ipAttempt.count >= IP_RATE_LIMIT_MAX) {
      return false;
    }

    ipAttempt.count++;
  }

  emailRateLimit.set(normalizedEmail, now + EMAIL_RATE_LIMIT_MS);
  return true;
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

function getErrorMessage(error: unknown) {
  const candidate = error as { message?: string; code?: string | number; status?: number };
  const detail = `${candidate?.code ?? ""} ${candidate?.message ?? ""}`.toLowerCase();

  if (detail.includes("signup") && detail.includes("disabled")) {
    return "I nuovi account non sono disponibili in questo momento.";
  }

  if (detail.includes("not allowed") || detail.includes("redirect")) {
    return "Il link di conferma non è configurato correttamente. Riprova tra poco.";
  }

  return "Non siamo riusciti a generare il link di accesso. Riprova tra poco.";
}

export async function POST(request: Request) {
  let body: z.infer<typeof magicLinkRequestSchema>;

  try {
    const parsed = magicLinkRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Richiesta non valida.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Richiesta non valida." },
      { status: 400 },
    );
  }

  const email = clean(body.email)?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, message: "Inserisci una email valida." },
      { status: 400 },
    );
  }

  if (!checkRateLimit(request, email)) {
    return NextResponse.json(
      { ok: false, message: "Troppe richieste. Riprova tra poco." },
      { status: 429 },
    );
  }

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Accesso email non disponibile in questo momento.",
      },
      { status: 503 },
    );
  }

  const callbackOrigin = getCallbackOrigin();

  if (!callbackOrigin) {
    return NextResponse.json(
      { ok: false, message: "Origine di conferma non configurata." },
      { status: 400 },
    );
  }

  const callbackUrl = `${callbackOrigin}/auth/callback`;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: body.metadata ?? {},
      redirectTo: callbackUrl,
    },
  });

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }

  const confirmUrl = getAuthCallbackUrl(callbackOrigin, data.properties.hashed_token);
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

    return NextResponse.json({ ok: false, message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: `Email di conferma inviata a ${email}. Aprila per creare o collegare l'account alla tua selezione.`,
  });
}
