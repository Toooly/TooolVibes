import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { notifyToolRequestSubmitted } from "@/lib/email/resend";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { createToolRequestInSupabase } from "@/lib/supabase/suggestion-repository";

const validLevels = new Set(["featured", "beginner", "intermediate", "expert"]);

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

export async function POST(request: Request) {
  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json(
      { message: "Suggerimenti non disponibili in questo momento. Riprova più tardi." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Richiesta non valida." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const toolName = asString(payload.toolName);
  const toolUrl = asString(payload.toolUrl);
  const category = asString(payload.category);
  const level = asString(payload.level);
  const email = asString(payload.email).toLowerCase();
  const message = asString(payload.message);

  if (toolName.length < 2 || !isValidHttpUrl(toolUrl) || category.length < 2) {
    return NextResponse.json({ message: "Compila nome, URL e categoria." }, { status: 422 });
  }

  if (!validLevels.has(level)) {
    return NextResponse.json({ message: "Livello non valido." }, { status: 422 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ message: "Email non valida." }, { status: 422 });
  }

  try {
    const savedRequest = await createToolRequestInSupabase({
      tool_name: toolName,
      tool_url: toolUrl,
      category,
      level,
      email: email || null,
      message: message || null,
    });

    await notifyToolRequestSubmitted(savedRequest);
    revalidatePath("/admin/suggestions");

    return NextResponse.json({ request: savedRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Non sono riuscito a salvare il suggerimento." },
      { status: 500 },
    );
  }
}
