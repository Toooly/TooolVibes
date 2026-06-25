import { NextResponse, type NextRequest } from "next/server";
import {
  createPublicSupabaseClient,
  isSupabasePublicEnabled,
} from "@/lib/supabase/public-client";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Inserisci un indirizzo email valido." },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();

    if (!isSupabasePublicEnabled()) {
      return NextResponse.json(
        { error: "Servizio temporaneamente non disponibile." },
        { status: 503 }
      );
    }

    const supabase = createPublicSupabaseClient();

    const { error } = await supabase.from("waitlist").insert({
      email: normalized,
      source: "coming-soon",
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "Sei già in lista! Ti avviseremo presto." },
          { status: 200 }
        );
      }
      console.error("Waitlist insert error:", error.message);
      return NextResponse.json(
        { error: "Errore durante l'iscrizione. Riprova." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Grazie! Ti avviseremo quando TooolVibes sarà aperto." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Errore imprevisto. Riprova." },
      { status: 500 }
    );
  }
}
