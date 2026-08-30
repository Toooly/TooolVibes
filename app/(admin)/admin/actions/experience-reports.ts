"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidUuid } from "@/app/(admin)/admin/actions/_helpers";
import { requireAdminSession } from "@/lib/admin/session";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { toolSlugSchema } from "@/lib/community/schema";
import {
  isReportDisposition,
  normalizeReportResolutionNote,
} from "@/lib/community/report-moderation";
import {
  resolveExperienceReport,
} from "@/lib/community/report-repository";
import { moderateExperience } from "@/lib/community/repository";

function reportsPath(input: {
  scope: string;
  page?: string;
  notice: string;
}) {
  const params = new URLSearchParams();
  params.set("scope", input.scope);
  if (input.page && input.page !== "1") params.set("page", input.page);
  params.set("notice", input.notice);
  return `/admin/experiences/reports?${params.toString()}`;
}

function revalidatePublicTool(toolSlug: string) {
  const parsed = toolSlugSchema.safeParse(toolSlug);
  if (!parsed.success) return;
  revalidatePath(`/toools/${parsed.data}`);
}

export async function resolveExperienceReportAction(formData: FormData) {
  await requireAdminSession();

  const scope = String(formData.get("returnScope") ?? "open");
  const page = String(formData.get("page") ?? "1");

  if (!isSupabaseAdminEnabled()) {
    redirect(reportsPath({ scope, page, notice: "error" }));
  }

  const id = String(formData.get("id") ?? "").trim();
  const dispositionRaw = formData.get("disposition");
  const note = normalizeReportResolutionNote(formData.get("note"));
  if (!isValidUuid(id) || !isReportDisposition(dispositionRaw)) {
    redirect(reportsPath({ scope, page, notice: "invalid" }));
  }
  if (formData.get("note") !== null && String(formData.get("note")).trim() !== "" && !note) {
    redirect(reportsPath({ scope, page, notice: "invalid" }));
  }

  try {
    const result = await resolveExperienceReport({
      id,
      disposition: dispositionRaw,
      note,
    });

    if (!result.ok) {
      const notice =
        result.reason === "conflict"
          ? "already"
          : result.reason === "not_found"
            ? "not-found"
            : result.reason === "invalid"
              ? "invalid"
              : result.reason === "state"
                ? "already"
                : "error";
      console.info("[community:report-moderation]", {
        id,
        disposition: dispositionRaw,
        result: notice,
      });
      redirect(reportsPath({ scope, page, notice }));
    }

    console.info("[community:report-moderation]", {
      id,
      disposition: dispositionRaw,
      result: "applied",
    });

    revalidatePath("/admin/experiences/reports");
    redirect(reportsPath({ scope, page, notice: "applied" }));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.info("[community:report-moderation]", {
      id,
      disposition: dispositionRaw,
      result: "error",
    });
    redirect(reportsPath({ scope, page, notice: "error" }));
  }
}

export async function hideExperienceFromReportAction(formData: FormData) {
  await requireAdminSession();

  const scope = String(formData.get("returnScope") ?? "open");
  const page = String(formData.get("page") ?? "1");

  if (!isSupabaseAdminEnabled()) {
    redirect(reportsPath({ scope, page, notice: "error" }));
  }

  const id = String(formData.get("experienceId") ?? "").trim();
  const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "").trim();
  if (!isValidUuid(id) || expectedUpdatedAt.length < 10) {
    redirect(reportsPath({ scope, page, notice: "invalid" }));
  }

  try {
    // Reuses the canonical H3 moderation transition (hide). Reports stay open
    // until the admin deliberately resolves them.
    const result = await moderateExperience({
      id,
      action: "hide",
      expectedUpdatedAt,
      reason: formData.get("reason"),
    });

    if (!result.ok) {
      const notice =
        result.reason === "conflict"
          ? "conflict"
          : result.reason === "not_found"
            ? "not-found"
            : result.reason === "invalid"
              ? "invalid"
              : result.reason === "state"
                ? "state"
                : "error";
      console.info("[community:report-moderation]", {
        id,
        action: "hide",
        result: notice,
      });
      redirect(reportsPath({ scope, page, notice }));
    }

    console.info("[community:report-moderation]", {
      id,
      action: "hide",
      result: result.kind,
    });

    if (result.kind === "applied") {
      revalidatePath("/admin/experiences");
      revalidatePath("/admin/experiences/reports");
      revalidatePublicTool(result.experience.toolSlug);
    }

    redirect(
      reportsPath({
        scope,
        page,
        notice: result.kind === "noop" ? "noop" : "hidden",
      }),
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.info("[community:report-moderation]", {
      id,
      action: "hide",
      result: "error",
    });
    redirect(reportsPath({ scope, page, notice: "error" }));
  }
}
