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
