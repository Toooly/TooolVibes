import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { notifyToolRequestSubmitted } from "@/lib/email/resend";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import { createToolRequestInSupabase } from "@/lib/supabase/suggestion-repository";

const toolRequestSchema = z
  .object({
    submitterType: z.enum(["community", "founder"]).default("community"),
    toolName: z.string().trim().min(2),
    toolUrl: z.string().trim().url().refine((value) => {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    }),
    category: z.string().trim().min(2),
    level: z.enum(["featured", "beginner", "intermediate", "expert"]),
    email: z.string().trim().email().or(z.literal("")).optional(),
    message: z.string().trim().optional(),
    useCase: z.string().trim().optional(),
    referralUrl: z.string().trim().url().or(z.literal("")).optional(),
    mediaUrl: z.string().trim().url().or(z.literal("")).optional(),
    personalNotes: z.string().trim().optional(),
    founderName: z.string().trim().optional(),
    companyRole: z.string().trim().optional(),
    launchStage: z.string().trim().optional(),
    budgetRange: z.string().trim().optional(),
    requestedServices: z.array(z.string().trim().min(2)).max(12).optional(),
  })
  .strict();

export async function POST(request: Request) {
  if (!isSupabasePublicEnabled()) {
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

  const parsed = toolRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Richiesta non valida.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const email = (payload.email ?? "").toLowerCase();

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
