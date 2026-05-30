import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getRejectedAffiliateRequestCooldown } from "@/lib/admin/affiliate-request-queries";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { notifyAffiliateRequestSubmitted } from "@/lib/email/resend";
import { createAffiliateRequestInSupabase } from "@/lib/supabase/affiliate-request-repository";

const cooldownDays = 30;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

function getFallbackAffiliateEmail() {
  return `affiliate-request+${Date.now()}@tooolvibes.local`;
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
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Payload non valido." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const firstName = asString(payload.firstName);
  const lastName = asString(payload.lastName);
  const email = asString(payload.email).toLowerCase();
  const brandName = asString(payload.brandName);
  const websiteUrl = asString(payload.websiteUrl);
  const instagram = asString(payload.instagram);
  const facebook = asString(payload.facebook);
  const tiktok = asString(payload.tiktok);
  const xProfile = asString(payload.xProfile);
  const linkedin = asString(payload.linkedin);
  const youtube = asString(payload.youtube);
  const audience = asString(payload.audience);
  const channels = asString(payload.channels);
  const message = asString(payload.message);

  if (message.length < 12) {
    return NextResponse.json(
      { message: "Scrivi un messaggio piu completo per inviare la candidatura." },
      { status: 422 },
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ message: "Email non valida." }, { status: 422 });
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    return NextResponse.json({ message: "URL sito non valido." }, { status: 422 });
  }

  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json(
      { message: "Supabase admin non configurato." },
      { status: 503 },
    );
  }

  const cooldownSince = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();
  const socialChannels = compactLines([
    channels ? `Canali: ${channels}` : "",
    instagram ? `Instagram: ${instagram}` : "",
    facebook ? `Facebook: ${facebook}` : "",
    tiktok ? `TikTok: ${tiktok}` : "",
    xProfile ? `X/Twitter: ${xProfile}` : "",
    linkedin ? `LinkedIn: ${linkedin}` : "",
    youtube ? `YouTube: ${youtube}` : "",
  ]);
  const storedEmail = email || getFallbackAffiliateEmail();

  try {
    const recentRejected = email
      ? await getRejectedAffiliateRequestCooldown(email, cooldownSince)
      : null;
    if (email && recentRejected?.rejected_at) {
      return NextResponse.json(
        {
          message: "Hai gia ricevuto una risposta negativa da meno di 30 giorni.",
          nextAllowedAt: addDays(recentRejected.rejected_at, cooldownDays),
        },
        { status: 409 },
      );
    }

    const savedRequest = await createAffiliateRequestInSupabase({
      first_name: firstName || "Candidato",
      last_name: lastName || "Affiliato",
      email: storedEmail,
      brand_name: brandName || null,
      website_url: websiteUrl || null,
      audience: audience || null,
      channels: socialChannels || null,
      message,
    });

    await notifyAffiliateRequestSubmitted(savedRequest);
    revalidatePath("/admin/affiliates");

    return NextResponse.json({ request: savedRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Non sono riuscito a salvare la richiesta affiliato." },
      { status: 500 },
    );
  }
}
