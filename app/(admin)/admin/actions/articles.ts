"use server";

import { redirect } from "next/navigation";

import {
  parseArticleFormData,
  type ArticleFormState,
} from "@/lib/admin/article-form";
import {
  getAdminArticleById,
  isSupabaseArticlesWriteEnabled,
} from "@/lib/admin/article-queries";
import {
  createArticle,
  deleteArticle,
  updateArticle,
} from "@/lib/admin/article-mutations";
import { requireAdminSession } from "@/lib/admin/session";
import { isQaArticleId } from "@/lib/admin/qa-editorial-store";
import { persistQaArticle } from "@/lib/admin/qa-editorial-persist";
import {
  getArticleMutationErrorState,
  getArticleSupabaseDisabledState,
  isValidUuid,
  revalidateArticlePaths,
} from "./_helpers";

export async function createArticleFormAction(
  _previousState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdminSession();

  if (!(await isSupabaseArticlesWriteEnabled())) {
    return getArticleSupabaseDisabledState();
  }

  const parsed = parseArticleFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await createArticle(parsed.data);
  } catch (error) {
    return getArticleMutationErrorState(error, parsed.values);
  }

  revalidateArticlePaths(parsed.data.slug);
  redirect("/admin/articles?status=created");
}

export async function updateArticleFormAction(
  id: string,
  _previousState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdminSession();

  if (!isValidUuid(id)) {
    return { status: "error", message: "ID articolo non valido." };
  }

  const parsedEarly = parseArticleFormData(formData);
  if (isQaArticleId(id)) {
    if (!parsedEarly.ok) return parsedEarly.state;
    const now = new Date().toISOString();
    await persistQaArticle({
      id,
      title: parsedEarly.data.title,
      slug: parsedEarly.data.slug,
      dek: parsedEarly.data.dek,
      summary: parsedEarly.data.summary,
      kind: parsedEarly.data.kind,
      status: parsedEarly.data.status,
      content_markdown: parsedEarly.data.content_markdown,
      cover_image_url: parsedEarly.data.cover_image_url,
      cover_image_alt: parsedEarly.data.cover_image_alt,
      author_name: parsedEarly.data.author_name,
      tags: parsedEarly.data.tags,
      published_at: parsedEarly.data.published_at,
      featured: parsedEarly.data.is_featured,
      created_at: now,
      updated_at: now,
    });
    revalidateArticlePaths(parsedEarly.data.slug);
    redirect(`/admin/articles/${id}/edit?status=updated`);
  }

  if (!(await isSupabaseArticlesWriteEnabled())) {
    return getArticleSupabaseDisabledState();
  }

  const existingArticle = await getAdminArticleById(id);

  if (!existingArticle) {
    return {
      status: "error",
      message: "Articolo non trovato.",
    };
  }

  const parsed = parseArticleFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await updateArticle(id, parsed.data);
  } catch (error) {
    return getArticleMutationErrorState(error, parsed.values);
  }

  revalidateArticlePaths(parsed.data.slug, existingArticle.slug);
  redirect("/admin/articles?status=updated");
}

export async function toggleArticleFeaturedAction(id: string, nextValue: boolean) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseArticlesWriteEnabled())) {
    return;
  }

  const existingArticle = await getAdminArticleById(id);

  if (!existingArticle) {
    return;
  }

  await updateArticle(id, { is_featured: nextValue });
  revalidateArticlePaths(existingArticle.slug);
}

export async function toggleArticlePublishedAction(id: string, publish: boolean) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseArticlesWriteEnabled())) {
    return;
  }

  const existingArticle = await getAdminArticleById(id);

  if (!existingArticle) {
    return;
  }

  await updateArticle(id, { status: publish ? "published" : "draft" });
  revalidateArticlePaths(existingArticle.slug);
}

export async function deleteArticleAction(id: string) {
  await requireAdminSession();

  if (!isValidUuid(id)) return;

  if (!(await isSupabaseArticlesWriteEnabled())) {
    return;
  }

  const existingArticle = await getAdminArticleById(id);

  if (!existingArticle) {
    return;
  }

  await deleteArticle(id);
  revalidateArticlePaths(existingArticle.slug);
  redirect("/admin/articles?status=deleted");
}
