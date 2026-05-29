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

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(request: Request) {
  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json(
      { message: "Supabase admin non configurato." },
      { status: 503 },
    );
  }

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
  const audience = asString(payload.audience);
  const channels = asString(payload.channels);
  const message = asString(payload.message);

  if (firstName.length < 2 || lastName.length < 2 || !isValidEmail(email)) {
    return NextResponse.json(
      { message: "Inserisci nome, cognome ed email validi." },
      { status: 422 },
    );
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    return NextResponse.json({ message: "URL sito non valido." }, { status: 422 });
  }

  const cooldownSince = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const recentRejected = await getRejectedAffiliateRequestCooldown(email, cooldownSince);
    if (recentRejected?.rejected_at) {
      return NextResponse.json(
        {
          message: "Hai gia ricevuto una risposta negativa da meno di 30 giorni.",
          nextAllowedAt: addDays(recentRejected.rejected_at, cooldownDays),
        },
        { status: 409 },
      );
    }

    const savedRequest = await createAffiliateRequestInSupabase({
      first_name: firstName,
      last_name: lastName,
      email,
      brand_name: brandName || null,
      website_url: websiteUrl || null,
      audience: audience || null,
      channels: channels || null,
      message: message || null,
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
