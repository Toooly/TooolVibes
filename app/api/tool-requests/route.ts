import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { notifyToolRequestSubmitted } from "@/lib/email/resend";
import {
  TOOL_REQUEST_BODY_LIMIT_BYTES,
  toolRequestSchema,
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
import { createToolRequestInSupabase } from "@/lib/supabase/suggestion-repository";

export async function POST(request: Request) {
  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json(
      { message: "Suggerimenti non disponibili in questo momento. Riprova più tardi." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await readJsonRequestBody(request, TOOL_REQUEST_BODY_LIMIT_BYTES);
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

  const parsed = toolRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Richiesta non valida.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const email = payload.email ?? "";
  const { companyWebsite, captchaToken, ...submissionPayload } = payload;
  const guard = await guardPublicSubmission({
    request,
    action: "tool_request",
    companyWebsite,
    captchaToken,
    email: email || undefined,
    fingerprintPayload: submissionPayload,
  });

  if (!guard.allowed) {
    const message =
      guard.status === 503
        ? "Suggerimenti non disponibili in questo momento. Riprova pi\u00f9 tardi."
        : "Richiesta non valida.";
    return NextResponse.json(
      { message },
      { status: guard.status, headers: guard.headers },
    );
  }

  try {
    const savedRequest = await createToolRequestInSupabase({
      submitter_type: payload.submitterType,
      tool_name: payload.toolName,
      tool_url: payload.toolUrl,
      category: payload.category,
      level: payload.level,
      email: email || null,
      message: payload.message || null,
      use_case: payload.useCase || null,
      referral_url: payload.referralUrl || null,
      media_url: payload.mediaUrl || null,
      personal_notes: payload.personalNotes || null,
      founder_name: payload.founderName || null,
      company_role: payload.companyRole || null,
      launch_stage: payload.launchStage || null,
      budget_range: payload.budgetRange || null,
      requested_services: payload.requestedServices ?? [],
    });

    try {
      await notifyToolRequestSubmitted(savedRequest);
    } catch {
      console.error("Tool request notification failed.");
    }
    revalidatePath("/admin/suggestions");

    return NextResponse.json({ request: savedRequest }, { status: 201 });
  } catch {
    await clearSubmissionReplayGuard(guard.replayGuard).catch(() => {
      console.error("Tool request replay cleanup failed.");
    });
    return NextResponse.json(
      { message: "Non sono riuscito a salvare il suggerimento." },
      { status: 500 },
    );
  }
}
