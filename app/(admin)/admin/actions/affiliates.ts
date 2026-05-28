"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAffiliateLink,
  updateAffiliateLink,
  deleteAffiliateLink,
  getAffiliateLink,
} from "@/lib/admin/affiliate-queries";
import { isSupabaseToolsWriteEnabled } from "@/lib/admin/tool-queries";
import { requireAdminSession } from "@/lib/admin/session";
import { isValidUuid } from "./_helpers";

export async function createAffiliateLinkAction(formData: FormData) {
  await requireAdminSession();

  if (!(await isSupabaseToolsWriteEnabled())) {
    redirect("/admin/affiliate-links?status=error");
  }

  const toolId = String(formData.get("tool_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();
  const trackingUrl = String(formData.get("tracking_url") ?? "").trim();
  const campaign = String(formData.get("campaign") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!toolId || !isValidUuid(toolId) || !label || !destinationUrl) {
    redirect("/admin/affiliate-links/new?status=validation");
  }

  try {
    const destParsed = new URL(destinationUrl);
    if (!destParsed.protocol.startsWith("http")) {
      redirect("/admin/affiliate-links/new?status=validation");
    }
  } catch {
    redirect("/admin/affiliate-links/new?status=validation");
  }

  try {
    await createAffiliateLink({
      tool_id: toolId,
      label,
      destination_url: destinationUrl,
      tracking_url: trackingUrl || null,
      campaign: campaign || null,
      source: source || null,
      medium: medium || null,
      is_active: isActive,
    });
  } catch {
    redirect("/admin/affiliate-links/new?status=error");
  }

  revalidatePath("/admin/affiliate-links");
  redirect("/admin/affiliate-links?status=created");
}

export async function updateAffiliateLinkAction(id: string, formData: FormData) {
  await requireAdminSession();

  if (!isValidUuid(id)) {
    redirect("/admin/affiliate-links?status=error");
  }

  if (!(await isSupabaseToolsWriteEnabled())) {
    redirect("/admin/affiliate-links?status=error");
  }

  const existing = await getAffiliateLink(id);
  if (!existing) {
    redirect("/admin/affiliate-links?status=not-found");
  }

  const toolId = String(formData.get("tool_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();
  const trackingUrl = String(formData.get("tracking_url") ?? "").trim();
  const campaign = String(formData.get("campaign") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const medium = String(formData.get("medium") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!toolId || !isValidUuid(toolId) || !label || !destinationUrl) {
    redirect(`/admin/affiliate-links/${id}/edit?status=validation`);
  }

  try {
    const destParsed = new URL(destinationUrl);
    if (!destParsed.protocol.startsWith("http")) {
      redirect(`/admin/affiliate-links/${id}/edit?status=validation`);
    }
  } catch {
    redirect(`/admin/affiliate-links/${id}/edit?status=validation`);
  }

  try {
    await updateAffiliateLink(id, {
      tool_id: toolId,
      label,
      destination_url: destinationUrl,
      tracking_url: trackingUrl || null,
      campaign: campaign || null,
      source: source || null,
      medium: medium || null,
      is_active: isActive,
    });
  } catch {
    redirect(`/admin/affiliate-links/${id}/edit?status=error`);
  }

  revalidatePath("/admin/affiliate-links");
  redirect("/admin/affiliate-links?status=updated");
}

export async function toggleAffiliateLinkActiveAction(id: string, nextValue: boolean) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseToolsWriteEnabled())) return;

  const existing = await getAffiliateLink(id);
  if (!existing) return;

  await updateAffiliateLink(id, { is_active: nextValue });
  revalidatePath("/admin/affiliate-links");
}

export async function deleteAffiliateLinkAction(id: string) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseToolsWriteEnabled())) return;

  await deleteAffiliateLink(id);
  revalidatePath("/admin/affiliate-links");
  redirect("/admin/affiliate-links?status=deleted");
}
