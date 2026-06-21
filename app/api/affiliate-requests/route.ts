import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRejectedAffiliateRequestCooldown } from "@/lib/admin/affiliate-request-queries";
import { notifyAffiliateRequestSubmitted } from "@/lib/email/resend";
import { createAffiliateRequestInSupabase } from "@/lib/supabase/affiliate-request-repository";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";

const cooldownDays = 30;
const optionalText = z.string().trim().optional();
const affiliateRequestSchema = z
  .object({
    firstName: optionalText,
    lastName: optionalText,
    email: z.string().trim().email().or(z.literal("")).optional(),
    brandName: optionalText,
    websiteUrl: z
      .string()
      .trim()
      .url()
      .refine((value) => {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      })
      .or(z.literal(""))
      .optional(),
    instagram: optionalText,
    facebook: optionalText,
    tiktok: optionalText,
    xProfile: optionalText,
    linkedin: optionalText,
    youtube: optionalText,
    audience: optionalText,
    channels: optionalText,
    message: z.string().trim().min(12),
  })
  .strict();

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
    return NextResponse.json({ message: "Richiesta non valida." }, { status: 400 });
  }

  const parsed = affiliateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Richiesta non valida.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const email = (payload.email ?? "").toLowerCase();
  const websiteUrl = payload.websiteUrl ?? "";
  const message = payload.message;

  if (message.length < 12) {
    return NextResponse.json(
      { message: "Scrivi un messaggio più completo per inviare la candidatura." },
      { status: 422 },
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ message: "Email non valida." }, { status: 422 });
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    return NextResponse.json({ message: "URL sito non valido." }, { status: 422 });
  }

  if (!isSupabasePublicEnabled()) {
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
  const storedEmail = email || getFallbackAffiliateEmail();

  try {
    const recentRejected = email
      ? await getRejectedAffiliateRequestCooldown(email, cooldownSince)
      : null;
    if (email && recentRejected?.rejected_at) {
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
      email: storedEmail,
      brand_name: payload.brandName || null,
      website_url: websiteUrl || null,
      audience: payload.audience || null,
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
