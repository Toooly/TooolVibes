import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

type MagicLinkRequest = {
  email?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

function clean(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function getCallbackOrigin(request: Request) {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_AUTH_SITE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(request.url) ??
    "https://tooolvibes.staff-ffa.workers.dev"
  );
}

function getAuthCallbackUrl(request: Request, tokenHash: string) {
  const url = new URL("/auth/callback", getCallbackOrigin(request));
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

function getErrorMessage(error: unknown) {
  const candidate = error as { message?: string; code?: string | number; status?: number };
  const detail = `${candidate?.code ?? ""} ${candidate?.message ?? ""}`.toLowerCase();

  if (detail.includes("signup") && detail.includes("disabled")) {
    return "I nuovi account sono disattivati nelle impostazioni Auth di Supabase.";
  }

  if (detail.includes("not allowed") || detail.includes("redirect")) {
    return "Il redirect auth non risulta autorizzato in Supabase.";
  }

  return "Non sono riuscito a generare il link di accesso Supabase.";
}

export async function POST(request: Request) {
  let body: MagicLinkRequest;

  try {
    body = (await request.json()) as MagicLinkRequest;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Richiesta non valida." },
      { status: 400 },
    );
  }

  const email = clean(body.email)?.toLowerCase();

  if (!email || !isEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Inserisci una email valida." },
      { status: 400 },
    );
  }

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Auth server non configurata: manca la chiave Supabase service role.",
      },
      { status: 503 },
    );
  }

  const callbackOrigin = getCallbackOrigin(request);
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

  const confirmUrl = getAuthCallbackUrl(request, data.properties.hashed_token);
  const result = await sendEmail({
    to: email,
    subject: "Entra in TooolVibes",
    html: getSignupHtml(confirmUrl),
    text: getSignupText(confirmUrl),
  });

  if (!result.sent) {
    const message =
      result.reason === "disabled"
        ? "Resend non configurato: manca RESEND_API_KEY nell'ambiente server."
        : "Non sono riuscito a inviare la mail con Resend. Verifica che il dominio mittente sia approvato su Resend.";

    return NextResponse.json({ ok: false, message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: `Email di conferma inviata a ${email}. Aprila per creare o collegare l'account alla workspace.`,
  });
}
