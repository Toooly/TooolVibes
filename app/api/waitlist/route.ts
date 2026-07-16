import { NextResponse } from "next/server";

import { WAITLIST_BODY_LIMIT_BYTES } from "@/lib/public-submissions/contracts";
import { guardPublicSubmission } from "@/lib/public-submissions/guard";
import {
  PublicSubmissionBodyError,
  readJsonRequestBody,
} from "@/lib/security/public-submission";
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
    body = await readJsonRequestBody(request, WAITLIST_BODY_LIMIT_BYTES);
  } catch (error) {
    return NextResponse.json(
      { error: "Richiesta non valida." },
      {
        status:
          error instanceof PublicSubmissionBodyError &&
          error.code === "too_large"
            ? 413
            : 400,
      },
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

  const guard = await guardPublicSubmission({
    request,
    action: "waitlist",
    companyWebsite: parsed.data.companyWebsite,
    captchaToken: parsed.data.captchaToken,
    email: parsed.data.email,
  });

  if (!guard.allowed) {
    const errorMessage =
      guard.status === 503
        ? "Servizio temporaneamente non disponibile."
        : "Inserisci un indirizzo email valido.";
    return NextResponse.json(
      { error: errorMessage },
      { status: guard.status, headers: guard.headers },
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
