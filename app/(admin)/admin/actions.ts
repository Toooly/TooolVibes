"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseCollectionFormData,
  type CollectionFormState,
} from "@/lib/admin/collection-form";
import { importMockCollectionsToSupabase } from "@/lib/admin/collection-import";
import { buildCollectionSafeAlignPlan } from "@/lib/admin/collection-safe-align";
import { getCollectionTransitionReviewMeta } from "@/lib/admin/collection-review";
import {
  applyCollectionSafeAlignment,
  createCollection,
  updateCollection,
} from "@/lib/admin/collection-mutations";
import {
  getAdminCollectionById,
  getAdminCollectionsRuntime,
  isSupabaseCollectionsWriteEnabled,
} from "@/lib/admin/collection-queries";
import {
  canAccessSupabaseCollectionTransitionReviewsAdmin,
  clearCollectionTransitionReview,
  upsertCollectionTransitionReview,
} from "@/lib/supabase/collection-review-repository";
import {
  canAccessSupabaseCollectionSafeAlignAdmin,
  insertCollectionSafeAlignEvent,
} from "@/lib/supabase/collection-safe-align-repository";
import { parseToolFormData, type ToolFormState } from "@/lib/admin/tool-form";
import {
  getAdminToolById,
  getAdminTools,
  isSupabaseToolsWriteEnabled,
} from "@/lib/admin/tool-queries";
import { createTool, deleteTool, updateTool } from "@/lib/admin/tool-mutations";
import {
  adminCookieName,
  requireAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/session";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "unlocked", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  await requireAdminSession();
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  redirect("/admin/login");
}

function revalidateToolPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/archivio");
  revalidatePath("/tags");
  revalidatePath("/admin");
  revalidatePath("/api/tools");
  revalidatePath(`/toools/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/toools/${previousSlug}`);
  }
}

function revalidateCollectionPaths(
  slug: string,
  toolSlugs: string[],
  previous?: { slug?: string; toolSlugs?: string[] },
) {
  revalidatePath("/");
  revalidatePath("/archivio");
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/collections/review");
  revalidatePath(`/collections/${slug}`);
  revalidatePath(`/admin/collections/review/${slug}`);

  for (const toolSlug of toolSlugs) {
    revalidatePath(`/toools/${toolSlug}`);
  }

  if (previous?.slug && previous.slug !== slug) {
    revalidatePath(`/collections/${previous.slug}`);
  }

  for (const toolSlug of previous?.toolSlugs ?? []) {
    if (!toolSlugs.includes(toolSlug)) {
      revalidatePath(`/toools/${toolSlug}`);
    }
  }
}

function appendStatusParams(
  path: string,
  values: Record<string, string | null | undefined>,
) {
  const url = new URL(path, "http://localhost");

  for (const [key, value] of Object.entries(values)) {
    if (value && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

function getSupabaseDisabledState(): ToolFormState {
  return {
    status: "error",
    message:
      "Verifica `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e l'accesso reale alla tabella `tools` prima di riattivare le scritture founders.",
  };
}

function getMutationErrorState(
  error: unknown,
  values?: ToolFormState["values"],
): ToolFormState {
  const message = error instanceof Error ? error.message : "Errore inatteso durante il salvataggio.";

  if (message.includes("duplicate key value") || message.includes("tools_slug_key")) {
    return {
      status: "error",
      message: "Esiste già un tool con questo slug. Scegline uno diverso.",
      fieldErrors: {
        slug: "Questo slug è già in uso.",
      },
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare l'operazione su Supabase. Riprova.",
    values,
  };
}

function getCollectionSupabaseDisabledState(): CollectionFormState {
  return {
    status: "error",
    message:
      "Configura Supabase admin e applica le migration collections per abilitare le scritture editoriali reali.",
  };
}

function getCollectionMutationErrorState(
  error: unknown,
  values: CollectionFormState["values"],
): CollectionFormState {
  const message =
    error instanceof Error ? error.message : "Errore inatteso durante il salvataggio.";

  if (message.includes("duplicate key value") || message.includes("collections_slug_key")) {
    return {
      status: "error",
      message: "Esiste già una collection con questo slug. Scegline uno diverso.",
      fieldErrors: {
        slug: "Questo slug è già in uso.",
      },
      values,
    };
  }

  if (message.includes("collection_tool_slots")) {
    return {
      status: "error",
      message:
        "Non è stato possibile aggiornare i tool inclusi. Controlla tool, ordine e migration collections.",
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare il salvataggio della collection.",
    values,
  };
}

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

export async function createCollectionFormAction(
  _previousState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireAdminSession();

  if (!(await isSupabaseCollectionsWriteEnabled())) {
    return getCollectionSupabaseDisabledState();
  }

  const tools = await getAdminTools();
  const parsed = parseCollectionFormData(
    formData,
    new Set(tools.map((tool) => tool.slug)),
  );

  if (!parsed.ok) {
    return parsed.state;
  }

  const now = new Date().toISOString();
  const payload = {
    ...parsed.data,
    published_at:
      parsed.data.editorial_state === "published" || parsed.data.editorial_state === "featured"
        ? parsed.data.published_at ?? now
        : null,
    first_published_at:
      parsed.data.editorial_state === "published" || parsed.data.editorial_state === "featured"
        ? parsed.data.first_published_at ?? parsed.data.published_at ?? now
        : parsed.data.first_published_at ?? null,
    archived_at:
      parsed.data.editorial_state === "archived"
        ? parsed.data.archived_at ?? now
        : null,
  };

  try {
    const created = await createCollection(payload);
    revalidateCollectionPaths(
      payload.slug,
      payload.included_tools.map((slot) => slot.tool_slug),
    );
    redirect(`/admin/collections/${created.id}?status=created`);
  } catch (error) {
    return getCollectionMutationErrorState(error, parsed.values);
  }
}

export async function updateToolFormAction(
  id: string,
  _previousState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdminSession();

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

export async function updateCollectionFormAction(
  id: string,
  _previousState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireAdminSession();

  if (!(await isSupabaseCollectionsWriteEnabled())) {
    return getCollectionSupabaseDisabledState();
  }

  const existingCollection = await getAdminCollectionById(id);

  if (!existingCollection) {
    return {
      status: "error",
      message: "Collection non trovata.",
    };
  }

  const tools = await getAdminTools();
  const parsed = parseCollectionFormData(
    formData,
    new Set(tools.map((tool) => tool.slug)),
  );

  if (!parsed.ok) {
    return parsed.state;
  }

  const now = new Date().toISOString();
  const nextIsPublic =
    parsed.data.editorial_state === "published" || parsed.data.editorial_state === "featured";
  const payload = {
    ...parsed.data,
    published_at: nextIsPublic
      ? parsed.data.published_at ?? existingCollection.published_at ?? now
      : null,
    first_published_at: nextIsPublic
      ? existingCollection.first_published_at ??
        parsed.data.first_published_at ??
        parsed.data.published_at ??
        now
      : existingCollection.first_published_at ?? parsed.data.first_published_at ?? null,
    archived_at:
      parsed.data.editorial_state === "archived"
        ? parsed.data.archived_at ?? existingCollection.archived_at ?? now
        : null,
  };

  try {
    await updateCollection(id, payload);
    revalidateCollectionPaths(
      payload.slug,
      payload.included_tools.map((slot) => slot.tool_slug),
      {
        slug: existingCollection.slug,
        toolSlugs: existingCollection.included_tools.map((slot) => slot.tool_slug),
      },
    );
    redirect(`/admin/collections/${id}?status=updated`);
  } catch (error) {
    return getCollectionMutationErrorState(error, parsed.values);
  }
}

export async function importMockCollectionsAction(formData: FormData) {
  await requireAdminSession();

  if (!(await isSupabaseCollectionsWriteEnabled())) {
    redirect("/admin/collections?status=import-unavailable");
  }

  const slugValue = formData.get("slug");
  const slug = typeof slugValue === "string" && slugValue.trim().length > 0 ? slugValue.trim() : null;
  const result = await importMockCollectionsToSupabase({
    slugs: slug ? [slug] : undefined,
  });

  for (const item of result.items) {
    if (item.status === "imported") {
      revalidateCollectionPaths(item.slug, item.toolSlugs);
    }
  }

  const params = new URLSearchParams({
    status: "imported",
    imported: String(result.imported),
    skipped: String(result.skipped),
    conflicts: String(result.conflicts),
  });

  if (slug) {
    params.set("scope", "single");
  }

  redirect(`/admin/collections?${params.toString()}`);
}

export async function setCollectionTransitionReviewAction(formData: FormData) {
  await requireAdminSession();

  const slugValue = formData.get("slug");
  const reviewState = formData.get("review_state");
  const returnToValue = formData.get("return_to");
  const collectionIdValue = formData.get("collection_id");
  const slug = typeof slugValue === "string" ? slugValue.trim() : "";
  const returnTo =
    typeof returnToValue === "string" && returnToValue.startsWith("/")
      ? returnToValue
      : "/admin/collections/review";
  const collectionId =
    typeof collectionIdValue === "string" && collectionIdValue.trim().length > 0
      ? collectionIdValue.trim()
      : null;

  if (!slug) {
    redirect(appendStatusParams(returnTo, { status: "review-invalid" }));
  }

  if (!(await canAccessSupabaseCollectionTransitionReviewsAdmin())) {
    redirect(appendStatusParams(returnTo, { status: "review-unavailable" }));
  }

  if (reviewState === "clear") {
    await clearCollectionTransitionReview(slug);
    revalidatePath("/admin/collections");
    revalidatePath("/admin/collections/review");
    if (collectionId) {
      revalidatePath(`/admin/collections/${collectionId}`);
    }
    redirect(appendStatusParams(returnTo, { status: "review-cleared" }));
  }

  if (reviewState !== "reviewed" && reviewState !== "dismissed") {
    redirect(appendStatusParams(returnTo, { status: "review-invalid" }));
  }

  await upsertCollectionTransitionReview({
    slug,
    reviewState,
  });

  revalidatePath("/admin/collections");
  revalidatePath("/admin/collections/review");
  if (collectionId) {
    revalidatePath(`/admin/collections/${collectionId}`);
  }

  const reviewMeta = getCollectionTransitionReviewMeta(reviewState);
  redirect(
    appendStatusParams(returnTo, {
      status: "review-saved",
      review: reviewMeta.label.toLowerCase(),
    }),
  );
}

export async function applyCollectionSafeAlignAction(formData: FormData) {
  await requireAdminSession();

  const slugValue = formData.get("slug");
  const returnToValue = formData.get("return_to");
  const collectionIdValue = formData.get("collection_id");
  const slug = typeof slugValue === "string" ? slugValue.trim() : "";
  const returnTo =
    typeof returnToValue === "string" && returnToValue.startsWith("/")
      ? returnToValue
      : "/admin/collections/review";
  const collectionId =
    typeof collectionIdValue === "string" && collectionIdValue.trim().length > 0
      ? collectionIdValue.trim()
      : null;

  if (!(await isSupabaseCollectionsWriteEnabled())) {
    redirect(appendStatusParams(returnTo, { status: "safe-align-unavailable" }));
  }

  if (!(await canAccessSupabaseCollectionSafeAlignAdmin())) {
    redirect(appendStatusParams(returnTo, { status: "safe-align-unavailable" }));
  }

  if (!slug) {
    redirect(appendStatusParams(returnTo, { status: "safe-align-invalid" }));
  }

  const runtime = await getAdminCollectionsRuntime();
  const entry =
    runtime.transitionReport.entries.find((item) => item.slug === slug) ?? null;
  const preview = runtime.syncPreviewBySlug[slug] ?? null;
  const workspaceCollection =
    runtime.collections.find((item) => item.slug === slug) ?? entry?.supabase ?? null;
  const plan = buildCollectionSafeAlignPlan({
    entry,
    preview,
  });

  if (!entry || !entry.supabase || !workspaceCollection || !plan.eligible || !plan.payload) {
    redirect(appendStatusParams(returnTo, { status: "safe-align-ineligible" }));
  }

  const rollbackPayload = {
    ...(Object.prototype.hasOwnProperty.call(plan.payload, "editorial_order")
      ? { editorial_order: entry.supabase.editorial_order ?? 999 }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(plan.payload, "featured_slot")
      ? { featured_slot: entry.supabase.featured_slot ?? null }
      : {}),
  };

  try {
    await applyCollectionSafeAlignment(entry.supabase.id, plan.payload);
    try {
      await insertCollectionSafeAlignEvent({
        slug,
        collectionId: entry.supabase.id,
        alignedFields: plan.changes.map((change) => change.field),
      });
    } catch (error) {
      await applyCollectionSafeAlignment(entry.supabase.id, rollbackPayload);
      throw error;
    }
  } catch {
    redirect(appendStatusParams(returnTo, { status: "safe-align-failed" }));
  }

  if (await canAccessSupabaseCollectionTransitionReviewsAdmin()) {
    try {
      await clearCollectionTransitionReview(slug);
    } catch {
      // Review cleanup is best-effort after a successful align.
    }
  }

  revalidateCollectionPaths(
    workspaceCollection.slug,
    workspaceCollection.included_tools.map((slot) => slot.tool_slug),
  );
  revalidatePath("/admin/collections");
  revalidatePath("/admin/collections/review");
  if (collectionId) {
    revalidatePath(`/admin/collections/${collectionId}`);
  }

  redirect(
    appendStatusParams(returnTo, {
      status: "safe-align-applied",
      fields: plan.changes.map((change) => change.field).join(","),
    }),
  );
}

export async function toggleFeaturedAction(id: string, nextValue: boolean) {
  await requireAdminSession();

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
