import { thankYouEmail } from "./thank-you-email";

const MAX_CONTACT_BYTES = 24_000;
const MAX_EVENT_BYTES = 512;
const MIN_FORM_TIME_MS = 2_500;
const MAX_FORM_TIME_MS = 3 * 60 * 60 * 1_000;
const TURNSTILE_ACTION = "services_contact";

const NEED_LABELS = {
  automation: "Chatbot e automazioni",
  social: "Social e contenuti",
  web: "Sito, landing o e-commerce",
  multiple: "Più servizi",
} as const;

const EVENT_NAMES = new Set([
  "cta_header",
  "cta_hero",
  "cta_mobile_menu",
  "service_ai_view",
  "service_social_view",
  "service_web_view",
  "contact_submit",
  "contact_success",
  "contact_error",
]);

type ContactNeed = keyof typeof NEED_LABELS;

type ContactPayload = {
  name: string;
  email: string;
  company: string;
  need: ContactNeed;
  message: string;
  privacyAccepted: boolean;
  companyWebsite: string;
  startedAt: number;
  turnstileToken: string;
};

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidEmail(value: string) {
  const local = value.split("@")[0];
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") &&
    /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/iu.test(value);
}

export function parseContactPayload(input: unknown): ContactPayload | null {
  if (!isPlainObject(input)) return null;

  const name = clean(input.name, 80);
  const email = clean(input.email, 160).toLowerCase();
  const company = clean(input.company, 120);
  const need = clean(input.need, 24) as ContactNeed;
  const message = clean(input.message, 2_000);
  const companyWebsite = clean(input.companyWebsite, 200);
  const turnstileToken = clean(input.turnstileToken, 2_048);
  const privacyAccepted = input.privacyAccepted === true;
  const startedAt = typeof input.startedAt === "number" ? input.startedAt : Number(input.startedAt);

  if (
    name.length < 2 ||
    !isValidEmail(email) ||
    !(need in NEED_LABELS) ||
    message.length < 20 ||
    !privacyAccepted ||
    !Number.isFinite(startedAt)
  ) {
    return null;
  }

  return {
    name,
    email,
    company,
    need,
    message,
    privacyAccepted,
    companyWebsite,
    startedAt,
    turnstileToken,
  };
}

export function isPlausibleSubmissionTime(startedAt: number, now = Date.now()) {
  const elapsed = now - startedAt;
  return elapsed >= MIN_FORM_TIME_MS && elapsed <= MAX_FORM_TIME_MS;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readJsonBody(request: Request, limit: number) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > limit) throw new Error("body-too-large");

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > limit) throw new Error("body-too-large");
  return JSON.parse(text) as unknown;
}

type Verification = { ok: true } | { ok: false; unavailable: boolean };

function verificationFailure(reason: string, unavailable = false): Verification {
  console.warn(JSON.stringify({ event: "services_verification_failed", reason }));
  return { ok: false, unavailable };
}

async function verifyTurnstile(env: Env, request: Request, token: string): Promise<Verification> {
  if (!env.TOOOLVIBES_TURNSTILE_SECRET_KEY) return verificationFailure("missing-secret", true);
  if (!token) return verificationFailure("missing-token");

  const body = new URLSearchParams({
    secret: env.TOOOLVIBES_TURNSTILE_SECRET_KEY,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        if (attempt === 0 && response.status >= 500) continue;
        return verificationFailure("upstream-http", true);
      }
      const result = (await response.json()) as TurnstileResponse;
      if (result?.success !== true) {
        const knownCodes = new Set(["missing-input-secret", "invalid-input-secret", "missing-input-response", "invalid-input-response", "bad-request", "timeout-or-duplicate", "internal-error"]);
        const codes = Array.isArray(result?.["error-codes"]) ? result["error-codes"].filter((code) => knownCodes.has(code)) : [];
        if (attempt === 0 && codes.includes("internal-error")) continue;
        const unavailable = codes.some((code) => ["missing-input-secret", "invalid-input-secret", "internal-error", "bad-request"].includes(code));
        return verificationFailure(codes.join(",") || "unclassified-rejection", unavailable);
      }
      const requestHost = new URL(request.url).hostname;
      const hostnameMatches =
        requestHost === "localhost" ||
        requestHost === "127.0.0.1" ||
        result.hostname === env.SITE_HOST;
      if (result.action !== TURNSTILE_ACTION) return verificationFailure("action-mismatch", true);
      if (!hostnameMatches) return verificationFailure("hostname-mismatch", true);
      return { ok: true };
    } catch {
      if (attempt === 1) return verificationFailure("upstream-unavailable", true);
    }
  }
  return verificationFailure("upstream-unavailable", true);
}

type ResendMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

async function sendEmail(env: Env, message: ResendMessage, idempotencyKey: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: env.SERVICES_EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ event: "services_email_failed", status: response.status }));
    throw new Error("email-failed");
  }
}

async function notifyLead(env: Env, payload: ContactPayload, deliveryId: string) {
  const service = NEED_LABELS[payload.need];
  const companyLine = payload.company ? `\nAzienda o progetto: ${payload.company}` : "";
  const recipients = [...new Set((env.SERVICES_NOTIFY_EMAIL || "").split(",").map((email) => email.trim().toLowerCase()))];
  if (!recipients.length || recipients.length > 10 || recipients.some((email) => !isValidEmail(email))) {
    console.error(JSON.stringify({ event: "services_recipient_configuration_invalid" }));
    throw new Error("recipient-configuration-invalid");
  }

  await sendEmail(env, {
    to: recipients,
    replyTo: payload.email,
    subject: `Nuova richiesta servizi: ${service}`,
    html: `
      <h1>Nuova richiesta da servizi.tooolvibes.eu</h1>
      <p><strong>Nome:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      ${payload.company ? `<p><strong>Azienda o progetto:</strong> ${escapeHtml(payload.company)}</p>` : ""}
      <p><strong>Servizio:</strong> ${escapeHtml(service)}</p>
      <p><strong>Messaggio:</strong></p>
      <p>${escapeHtml(payload.message).replaceAll("\n", "<br>")}</p>
      <p><strong>Origine:</strong> servizi.tooolvibes.eu</p>
    `,
    text: `Nuova richiesta servizi\nNome: ${payload.name}\nEmail: ${payload.email}${companyLine}\nServizio: ${service}\n\n${payload.message}\n\nOrigine: servizi.tooolvibes.eu`,
  }, `services-lead/${deliveryId}`);
}

async function acknowledgeLead(env: Env, payload: ContactPayload, deliveryId: string) {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload.email));
    const key = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (!(await env.THANK_YOU_RATE_LIMITER.limit({ key })).success) return;
    const message = { to: [payload.email], replyTo: "info@tooolvibes.eu", ...thankYouEmail(NEED_LABELS[payload.need]) };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await sendEmail(env, message, `services-thanks/${deliveryId}`);
        console.log(JSON.stringify({ event: "services_confirmation_sent" }));
        return;
      } catch {
        if (attempt === 1) throw new Error("confirmation-failed");
      }
    }
  } catch {
    console.error(JSON.stringify({ event: "services_confirmation_failed" }));
  }
}

async function handleContact(request: Request, env: Env, ctx: ExecutionContext) {
  if (!sameOrigin(request)) return json({ ok: false, message: "Origine non autorizzata." }, 403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, message: "Formato della richiesta non valido." }, 415);
  }
  const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: "services-contact" });
  if (!rateLimit.success) {
    return json({ ok: false, message: "Troppe richieste. Riprova tra poco." }, 429);
  }

  let input: unknown;
  try {
    input = await readJsonBody(request, MAX_CONTACT_BYTES);
  } catch (error) {
    const status = error instanceof Error && error.message === "body-too-large" ? 413 : 400;
    return json({ ok: false, message: "Non siamo riusciti a leggere il messaggio." }, status);
  }

  const payload = parseContactPayload(input);
  if (!payload) return json({ ok: false, message: "Controlla i campi e riprova." }, 400);

  if (payload.companyWebsite) {
    return json({ ok: true, message: "Messaggio ricevuto." });
  }
  if (!isPlausibleSubmissionTime(payload.startedAt)) {
    return json({ ok: false, message: "Invio troppo rapido o sessione scaduta. Ricarica e riprova." }, 400);
  }
  const verification = await verifyTurnstile(env, request, payload.turnstileToken);
  if (!verification.ok) {
    return json({
      ok: false,
      code: verification.unavailable ? "verification_unavailable" : "verification_required",
      message: verification.unavailable
        ? "La verifica di sicurezza è temporaneamente non disponibile. I dati restano nel modulo: riprova tra poco."
        : "Rinnoviamo la verifica di sicurezza. I dati restano nel modulo.",
    }, verification.unavailable ? 503 : 400);
  }

  const deliveryId = crypto.randomUUID();
  try {
    await notifyLead(env, payload, deliveryId);
  } catch {
    return json({ ok: false, message: "Il messaggio non è partito. Riprova tra poco." }, 502);
  }

  console.log(JSON.stringify({ event: "services_contact_received", need: payload.need }));
  ctx.waitUntil(acknowledgeLead(env, payload, deliveryId));
  return json({ ok: true, message: "Messaggio inviato." });
}

async function handleEvent(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const input = await readJsonBody(request, MAX_EVENT_BYTES);
    if (!isPlainObject(input)) return new Response(null, { status: 400 });
    const event = clean(input.event, 64);
    const path = clean(input.path, 128);
    if (!EVENT_NAMES.has(event) || (path !== "/" && path !== "/privacy/")) {
      return new Response(null, { status: 400 });
    }
    console.log(JSON.stringify({ event: "services_funnel", name: event, path }));
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/config" && request.method === "GET") {
      return json({
        siteKey: env.SERVICES_TURNSTILE_SITE_KEY,
        formAvailable: Boolean(
          env.RESEND_API_KEY && env.SERVICES_NOTIFY_EMAIL && env.TOOOLVIBES_TURNSTILE_SECRET_KEY,
        ),
      });
    }
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env, ctx);
    }
    if (url.pathname === "/api/contact") {
      return new Response(JSON.stringify({ ok: false, message: "Metodo non disponibile." }), {
        status: 405,
        headers: { ...jsonHeaders, Allow: "POST" },
      });
    }
    if (url.pathname === "/api/event" && request.method === "POST") {
      return handleEvent(request);
    }
    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, message: "Endpoint non disponibile." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
