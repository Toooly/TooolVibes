"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidUuid } from "@/app/(admin)/admin/actions/_helpers";
import { requireAdminSession } from "@/lib/admin/session";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { toolSlugSchema } from "@/lib/community/schema";
import {
  isExperienceStatus,
  isModerationAction,
} from "@/lib/community/moderation";
import { moderateExperience } from "@/lib/community/repository";

function noticePath(input: {
  status: string;
  page?: string;
  notice: string;
}) {
  const params = new URLSearchParams();
  params.set("status", input.status);
  if (input.page && input.page !== "1") params.set("page", input.page);
  params.set("notice", input.notice);
  return `/admin/experiences?${params.toString()}`;
}

function revalidatePublicTool(toolSlug: string) {
  const parsed = toolSlugSchema.safeParse(toolSlug);
  if (!parsed.success) return;
  revalidatePath(`/toools/${parsed.data}`);
}

export async function moderateExperienceAction(formData: FormData) {
  await requireAdminSession();

  const returnStatus = isExperienceStatus(formData.get("returnStatus"))
    ? String(formData.get("returnStatus"))
    : "pending";
  const page = String(formData.get("page") ?? "1");

  if (!isSupabaseAdminEnabled()) {
    redirect(noticePath({ status: returnStatus, page, notice: "error" }));
  }

  const id = String(formData.get("id") ?? "").trim();
  const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "").trim();
  const actionRaw = formData.get("action");
  if (!isValidUuid(id) || !isModerationAction(actionRaw) || expectedUpdatedAt.length < 10) {
    redirect(noticePath({ status: returnStatus, page, notice: "invalid" }));
  }

  try {
    const result = await moderateExperience({
      id,
      action: actionRaw,
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
      console.info("[community:moderation]", {
        id,
        action: actionRaw,
        result: notice,
      });
      redirect(noticePath({ status: returnStatus, page, notice }));
    }

    console.info("[community:moderation]", {
      id,
      action: actionRaw,
      result: result.kind,
    });

    if (result.kind === "applied") {
      revalidatePath("/admin/experiences");
      if (result.visibilityChanged) {
        revalidatePublicTool(result.experience.toolSlug);
      }
    }

    const notice =
      result.kind === "noop"
        ? "noop"
        : actionRaw === "publish"
          ? "published"
          : actionRaw === "reject"
            ? "rejected"
            : actionRaw === "hide"
              ? "hidden"
              : "republished";
    redirect(noticePath({ status: returnStatus, page, notice }));
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
    console.info("[community:moderation]", {
      id,
      action: actionRaw,
      result: "error",
    });
    redirect(noticePath({ status: returnStatus, page, notice: "error" }));
  }
}
