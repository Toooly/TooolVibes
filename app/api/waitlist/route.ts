import { NextResponse } from "next/server";

import {
  isWaitlistRegistrationEnabled,
  registerWaitlistEntry,
} from "@/lib/supabase/waitlist-repository";
import {
  WAITLIST_CONSENT_VERSION,
  WAITLIST_SOURCE,
  waitlistRequestSchema,
} from "@/lib/waitlist/contract";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida." },
      { status: 400 },
    );
  }

  const parsed = waitlistRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Inserisci un indirizzo email valido." },
      { status: 400 },
    );
  }

  if (!isWaitlistRegistrationEnabled()) {
    return NextResponse.json(
      { error: "Servizio temporaneamente non disponibile." },
      { status: 503 },
    );
  }

  try {
    const result = await registerWaitlistEntry({
      email: parsed.data.email,
      source: WAITLIST_SOURCE,
      consentVersion: WAITLIST_CONSENT_VERSION,
    });

    if (!result.created) {
      return NextResponse.json(
        {
          message: "Sei già in lista! Ti avviseremo presto.",
          status: "already_registered",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: "Grazie! Ti avviseremo quando TooolVibes sarà aperto.",
        status: "created",
      },
      { status: 201 },
    );
  } catch {
    console.error("Waitlist registration failed.");
    return NextResponse.json(
      { error: "Errore durante l'iscrizione. Riprova." },
      { status: 500 },
    );
  }
}
