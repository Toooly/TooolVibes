"use server";

import { redirect } from "next/navigation";

import { parseToolFormData, type ToolFormState } from "@/lib/admin/tool-form";
import {
  getAdminToolById,
  isSupabaseToolsWriteEnabled,
} from "@/lib/admin/tool-queries";
import { createTool, deleteTool, updateTool } from "@/lib/admin/tool-mutations";
import { requireAdminSession } from "@/lib/admin/session";
import {
  isValidUuid,
  revalidateToolPaths,
  getSupabaseDisabledState,
  getMutationErrorState,
} from "./_helpers";

export async function createToolFormAction(
  _previousState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdminSession();

  if (!(await isSupabaseToolsWriteEnabled())) {
    return getSupabaseDisabledState();
  }

  const parsed = parseToolFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await createTool(parsed.data);
  } catch (error) {
    return getMutationErrorState(error, parsed.values);
  }

  revalidateToolPaths(parsed.data.slug);
  redirect("/admin?status=created");
}

export async function updateToolFormAction(
  id: string,
  _previousState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdminSession();

  if (!isValidUuid(id)) {
    return { status: "error", message: "ID tool non valido." };
  }

  if (!(await isSupabaseToolsWriteEnabled())) {
    return getSupabaseDisabledState();
  }

  const existingTool = await getAdminToolById(id);

  if (!existingTool) {
    return {
      status: "error",
      message: "Tool non trovato.",
    };
  }

  const parsed = parseToolFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await updateTool(id, parsed.data);
  } catch (error) {
    return getMutationErrorState(error, parsed.values);
  }

  revalidateToolPaths(parsed.data.slug, existingTool.slug);
  redirect("/admin?status=updated");
}

export async function toggleFeaturedAction(id: string, nextValue: boolean) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseToolsWriteEnabled())) {
    return;
  }

  const existingTool = await getAdminToolById(id);

  if (!existingTool) {
    return;
  }

  await updateTool(id, { is_featured: nextValue });
  revalidateToolPaths(existingTool.slug);
}

export async function togglePublishedAction(id: string, nextValue: boolean) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseToolsWriteEnabled())) {
    return;
  }

  const existingTool = await getAdminToolById(id);

  if (!existingTool) {
    return;
  }

  await updateTool(id, { is_published: nextValue });
  revalidateToolPaths(existingTool.slug);
}

export async function deleteToolAction(id: string) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseToolsWriteEnabled())) {
    return;
  }

  const existingTool = await getAdminToolById(id);

  if (!existingTool) {
    return;
  }

  await deleteTool(id);
  revalidateToolPaths(existingTool.slug);
  redirect("/admin?status=deleted");
}
