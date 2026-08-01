import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getRejectedAffiliateRequestCooldown } from "@/lib/admin/affiliate-request-queries";
import { notifyAffiliateRequestSubmitted } from "@/lib/email/resend";
import {
  AFFILIATE_REQUEST_BODY_LIMIT_BYTES,
  affiliateRequestSchema,
} from "@/lib/public-submissions/contracts";
import {
  clearSubmissionReplayGuard,
  guardPublicSubmission,
} from "@/lib/public-submissions/guard";
import {
  PublicSubmissionBodyError,
  readJsonRequestBody,
} from "@/lib/security/public-submission";
import { isSupabaseAdminEnabled } from "@/lib/supabase/admin-client";
import { createAffiliateRequestInSupabase } from "@/lib/supabase/affiliate-request-repository";

const cooldownDays = 30;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function compactLines(lines: string[]) {
  return lines.filter(Boolean).join("\n");
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJsonRequestBody(request, AFFILIATE_REQUEST_BODY_LIMIT_BYTES);
  } catch (error) {
    return NextResponse.json(
      { message: "Richiesta non valida." },
      {
        status:
          error instanceof PublicSubmissionBodyError &&
          error.code === "too_large"
            ? 413
            : 400,
      },
    );
  }

  const parsed = affiliateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Richiesta non valida.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const { companyWebsite, captchaToken, ...submissionPayload } = payload;
  const email = payload.email.toLowerCase();
  const websiteUrl = payload.websiteUrl ?? "";
  const message = payload.message;

  if (message.length < 12) {
    return NextResponse.json(
      { message: "Scrivi un messaggio più completo per inviare la candidatura." },
      { status: 422 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Email non valida." }, { status: 422 });
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    return NextResponse.json({ message: "URL sito non valido." }, { status: 422 });
  }

  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json(
      { message: "Candidature non disponibili in questo momento. Riprova più tardi." },
      { status: 503 },
    );
  }

  const cooldownSince = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();
  const socialChannels = compactLines([
    payload.channels ? `Canali: ${payload.channels}` : "",
    payload.instagram ? `Instagram: ${payload.instagram}` : "",
    payload.facebook ? `Facebook: ${payload.facebook}` : "",
    payload.tiktok ? `TikTok: ${payload.tiktok}` : "",
    payload.xProfile ? `X/Twitter: ${payload.xProfile}` : "",
    payload.linkedin ? `LinkedIn: ${payload.linkedin}` : "",
    payload.youtube ? `YouTube: ${payload.youtube}` : "",
  ]);
  const guard = await guardPublicSubmission({
    request,
    action: "affiliate_request",
    companyWebsite,
    captchaToken,
    email,
    fingerprintPayload: submissionPayload,
  });

  if (!guard.allowed) {
    const responseMessage =
      guard.status === 503
        ? "Candidature non disponibili in questo momento. Riprova pi\u00f9 tardi."
        : "Richiesta non valida.";
    return NextResponse.json(
      { message: responseMessage },
      { status: guard.status, headers: guard.headers },
    );
  }

  try {
    const recentRejected = await getRejectedAffiliateRequestCooldown(email, cooldownSince);
    if (recentRejected?.rejected_at) {
      return NextResponse.json(
        {
          message: "Hai già ricevuto una risposta negativa da meno di 30 giorni.",
          nextAllowedAt: addDays(recentRejected.rejected_at, cooldownDays),
        },
        { status: 409 },
      );
    }

    const savedRequest = await createAffiliateRequestInSupabase({
      first_name: payload.firstName || "Candidato",
      last_name: payload.lastName || "Affiliato",
      email,
      brand_name: payload.brandName || null,
      website_url: websiteUrl || null,
      audience: payload.audience || null,
      channels: socialChannels || null,
      message,
    });

    try {
      await notifyAffiliateRequestSubmitted(savedRequest);
    } catch {
      console.error("Affiliate request notification failed.");
    }
    revalidatePath("/admin/affiliates");

    return NextResponse.json({ request: savedRequest }, { status: 201 });
  } catch {
    await clearSubmissionReplayGuard(guard.replayGuard).catch(() => {
      console.error("Affiliate request replay cleanup failed.");
    });
    return NextResponse.json(
      { message: "Non sono riuscito a salvare la richiesta affiliato." },
      { status: 500 },
    );
  }
}
