"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/session";
import { updateSuggestionStatus, deleteSuggestion } from "@/lib/admin/suggestion-mutations";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { sendToolRequestDecisionEmail } from "@/lib/email/resend";
import type { ToolRequestStatus } from "@/lib/types/tool-request";
import { isValidUuid } from "./_helpers";

export async function updateSuggestionStatusAction(formData: FormData) {
  await requireAdminSession();

  const runtime = await getSuggestionsRuntime();
  if (!runtime.canWrite) return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ToolRequestStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();

  if (!id || !isValidUuid(id)) return;

  const validStatuses: ToolRequestStatus[] = ["received", "reviewing", "approved", "rejected"];
  if (!validStatuses.includes(status)) return;

  try {
    const previous = runtime.suggestions.find((suggestion) => suggestion.id === id);
    const updated = await updateSuggestionStatus(id, status, adminNotes || undefined);

    if (
      (status === "approved" || status === "rejected") &&
      previous?.status !== status
    ) {
      await sendToolRequestDecisionEmail(updated, status);
    }
  } catch {
    redirect("/admin/suggestions?status=error");
  }

  revalidatePath("/admin/suggestions");
}

export async function deleteSuggestionAction(id: string) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  const runtime = await getSuggestionsRuntime();
  if (!runtime.canWrite) return;

  await deleteSuggestion(id);
  revalidatePath("/admin/suggestions");
  redirect("/admin/suggestions?status=deleted");
}
