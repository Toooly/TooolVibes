import "server-only";

import type { AffiliateRequestRecord } from "@/lib/types/affiliate-request";
import type { ToolRequestRecord, ToolRequestStatus } from "@/lib/types/tool-request";
import { getAffiliateQrCodeUrl } from "@/lib/affiliates/referral";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
};

type EmailResult =
  | { sent: true }
  | { sent: false; reason: "disabled" | "missing-recipient" | "failed" };

function clean(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getResendApiKey() {
  return clean(process.env.RESEND_API_KEY);
}

function getEmailFrom() {
  return clean(process.env.TOOOLVIBES_EMAIL_FROM) ?? "TooolVibes <noreply@tooolvibes.com>";
}

function getAdminNotificationEmail() {
  return clean(process.env.TOOOLVIBES_ADMIN_NOTIFY_EMAIL) ?? clean(process.env.TOOOLVIBES_ADMIN_EMAIL);
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraph(value: string | null | undefined) {
  return value ? `<p>${escapeHtml(value)}</p>` : "";
}

export function isResendEnabled() {
  return Boolean(getResendApiKey());
}

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  const apiKey = getResendApiKey();
  const to = Array.isArray(input.to) ? input.to.filter(Boolean) : [input.to].filter(Boolean);

  if (!apiKey) return { sent: false, reason: "disabled" };
  if (to.length === 0) return { sent: false, reason: "missing-recipient" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? undefined,
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: "failed" };
    }

    return { sent: true };
  } catch {
    return { sent: false, reason: "failed" };
  }
}

export async function notifyToolRequestSubmitted(request: ToolRequestRecord) {
  const adminEmail = getAdminNotificationEmail();

  await sendEmail({
    to: adminEmail ? [adminEmail] : [],
    subject: `Nuovo tool suggerito: ${request.tool_name}`,
    replyTo: request.email,
    html: `
      <h1>Nuovo tool suggerito</h1>
      <p><strong>${escapeHtml(request.tool_name)}</strong></p>
      <p>URL: <a href="${escapeHtml(request.tool_url)}">${escapeHtml(request.tool_url)}</a></p>
      <p>Categoria: ${escapeHtml(request.category)} / livello: ${escapeHtml(request.level)}</p>
      ${request.email ? `<p>Email utente: ${escapeHtml(request.email)}</p>` : ""}
      ${paragraph(request.message)}
    `,
    text: `Nuovo tool suggerito: ${request.tool_name}\n${request.tool_url}`,
  });

  if (request.email) {
    await sendEmail({
      to: request.email,
      subject: "Abbiamo ricevuto il tuo suggerimento su TooolVibes",
      html: `
        <h1>Richiesta ricevuta</h1>
        <p>Ciao, abbiamo ricevuto il suggerimento per <strong>${escapeHtml(request.tool_name)}</strong>.</p>
        <p>Lo rivediamo dal backoffice e ti aggiorniamo se entra nel catalogo.</p>
      `,
      text: `Abbiamo ricevuto il suggerimento per ${request.tool_name}.`,
    });
  }
}

export async function sendToolRequestDecisionEmail(
  request: ToolRequestRecord,
  status: Extract<ToolRequestStatus, "approved" | "rejected">,
) {
  if (!request.email) return;

  const approved = status === "approved";

  await sendEmail({
    to: request.email,
    subject: approved
      ? `Suggerimento approvato: ${request.tool_name}`
      : `Aggiornamento sul suggerimento: ${request.tool_name}`,
    html: approved
      ? `
        <h1>Suggerimento approvato</h1>
        <p>Grazie per averci suggerito <strong>${escapeHtml(request.tool_name)}</strong>.</p>
        <p>Lo abbiamo approvato per la lavorazione editoriale: prima di pubblicarlo potremmo rifinire copy, categoria e dettagli.</p>
      `
      : `
        <h1>Grazie per il suggerimento</h1>
        <p>Abbiamo rivisto <strong>${escapeHtml(request.tool_name)}</strong>, ma per ora non lo inseriamo nel catalogo TooolVibes.</p>
        <p>Continua pure a segnalarci tool forti: ogni proposta utile ci aiuta a tenere il radar pulito.</p>
      `,
    text: approved
      ? `Suggerimento approvato: ${request.tool_name}`
      : `Suggerimento non approvato: ${request.tool_name}`,
  });
}

export async function notifyAffiliateRequestSubmitted(request: AffiliateRequestRecord) {
  const adminEmail = getAdminNotificationEmail();
  const hasPublicReplyEmail = !request.email.endsWith("@tooolvibes.local");

  await sendEmail({
    to: adminEmail ? [adminEmail] : [],
    subject: `Nuova richiesta affiliato: ${request.first_name} ${request.last_name}`,
    replyTo: hasPublicReplyEmail ? request.email : undefined,
    html: `
      <h1>Nuova richiesta affiliato</h1>
      <p><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong></p>
      <p>Email: ${hasPublicReplyEmail ? escapeHtml(request.email) : "Non lasciata"}</p>
      ${request.brand_name ? `<p>Brand: ${escapeHtml(request.brand_name)}</p>` : ""}
      ${request.website_url ? `<p>Sito: <a href="${escapeHtml(request.website_url)}">${escapeHtml(request.website_url)}</a></p>` : ""}
      ${paragraph(request.audience)}
      ${paragraph(request.channels)}
      ${paragraph(request.message)}
    `,
    text: `Nuova richiesta affiliato da ${request.first_name} ${request.last_name}: ${hasPublicReplyEmail ? request.email : "email non lasciata"}`,
  });

  if (!hasPublicReplyEmail) return;

  await sendEmail({
    to: request.email,
    subject: "Richiesta affiliato ricevuta",
    html: `
      <h1>Richiesta ricevuta</h1>
      <p>Ciao ${escapeHtml(request.first_name)}, abbiamo ricevuto la tua candidatura per il programma affiliati TooolVibes.</p>
      <p>La rivediamo dal backoffice e ti inviamo una risposta appena possibile.</p>
    `,
    text: `Ciao ${request.first_name}, abbiamo ricevuto la tua candidatura affiliato TooolVibes.`,
  });
}

export async function sendAffiliateDecisionEmail(request: AffiliateRequestRecord) {
  if (request.status !== "approved" && request.status !== "rejected") return;

  if (request.status === "approved") {
    const referralUrl = request.referral_url ?? "";
    const qrCodeUrl = referralUrl ? getAffiliateQrCodeUrl(referralUrl) : "";

    await sendEmail({
      to: request.email,
      subject: "Affiliazione TooolVibes approvata",
      html: `
        <h1>Affiliazione approvata</h1>
        <p>Ciao ${escapeHtml(request.first_name)}, la tua richiesta affiliato e stata approvata.</p>
        <p>Codice referral: <strong>${escapeHtml(request.referral_code)}</strong></p>
        <p>Link referral: <a href="${escapeHtml(referralUrl)}">${escapeHtml(referralUrl)}</a></p>
        ${qrCodeUrl ? `<p>QR code: <a href="${escapeHtml(qrCodeUrl)}">${escapeHtml(qrCodeUrl)}</a></p>` : ""}
      `,
      text: `Affiliazione approvata. Codice: ${request.referral_code}. Link: ${referralUrl}`,
    });
    return;
  }

  await sendEmail({
    to: request.email,
    subject: "Aggiornamento sulla richiesta affiliato TooolVibes",
    html: `
      <h1>Richiesta non approvata</h1>
      <p>Ciao ${escapeHtml(request.first_name)}, per ora non possiamo approvare la tua richiesta affiliato.</p>
      <p>Potrai inviarne una nuova tra 30 giorni.</p>
    `,
    text: "La tua richiesta affiliato non e stata approvata. Potrai inviarne una nuova tra 30 giorni.",
  });
}
