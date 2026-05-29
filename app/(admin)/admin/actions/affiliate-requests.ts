"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deleteAffiliateRequest,
  getAffiliateRequest,
  getAffiliateRequestsRuntime,
  updateAffiliateRequest,
} from "@/lib/admin/affiliate-request-queries";
import { getAffiliateReferralUrl, isValidReferralCode, normalizeReferralCode } from "@/lib/affiliates/referral";
import { requireAdminSession } from "@/lib/admin/session";
import { sendAffiliateDecisionEmail } from "@/lib/email/resend";
import type { AffiliateRequestStatus } from "@/lib/types/affiliate-request";
import { isValidUuid } from "./_helpers";

const validStatuses: AffiliateRequestStatus[] = [
  "received",
  "reviewing",
  "approved",
  "rejected",
];

export async function updateAffiliateRequestAction(formData: FormData) {
  await requireAdminSession();

  const runtime = await getAffiliateRequestsRuntime();
  if (!runtime.canWrite) return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as AffiliateRequestStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();
  const referralCode = normalizeReferralCode(String(formData.get("referral_code") ?? ""));

  if (!id || !isValidUuid(id) || !validStatuses.includes(status)) {
    redirect("/admin/affiliates?status=validation");
  }

  const existing = await getAffiliateRequest(id);
  if (!existing) {
    redirect("/admin/affiliates?status=not-found");
  }

  if (status === "approved" && !isValidReferralCode(referralCode)) {
    redirect("/admin/affiliates?status=referral-validation");
  }

  const now = new Date().toISOString();
  const payload =
    status === "approved"
      ? {
          status,
          admin_notes: adminNotes || null,
          referral_code: referralCode,
          referral_url: getAffiliateReferralUrl(referralCode),
          approved_at: existing.approved_at ?? now,
          rejected_at: null,
        }
      : status === "rejected"
        ? {
            status,
            admin_notes: adminNotes || null,
            referral_code: null,
            referral_url: null,
            approved_at: null,
            rejected_at: existing.rejected_at ?? now,
          }
        : {
            status,
            admin_notes: adminNotes || null,
          };

  try {
    const updated = await updateAffiliateRequest(id, payload);
    const decisionChanged =
      status === "approved"
        ? existing.status !== "approved" || existing.referral_code !== referralCode
        : status === "rejected" && existing.status !== "rejected";

    if (decisionChanged) {
      await sendAffiliateDecisionEmail(updated);
    }
  } catch {
    redirect("/admin/affiliates?status=error");
  }

  revalidatePath("/admin/affiliates");
  redirect(`/admin/affiliates?status=${status}`);
}

export async function deleteAffiliateRequestAction(id: string) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  const runtime = await getAffiliateRequestsRuntime();
  if (!runtime.canWrite) return;

  await deleteAffiliateRequest(id);
  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates?status=deleted");
}
