"use server";

import "server-only";

import {
  createArticleInStorage,
  deleteArticleFromStorage,
  getArticleByIdFromArticleStorage,
  updateArticleInStorage,
} from "@/lib/supabase/article-storage-repository";
import { getArticleWriteTarget } from "@/lib/supabase/article-target";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { BlogArticleRecord } from "@/lib/types/article";

export type ArticleMutationInput = Pick<
  BlogArticleRecord,
  | "slug"
  | "title"
  | "dek"
  | "summary"
  | "kind"
  | "status"
  | "content_markdown"
  | "cover_image_url"
  | "cover_image_alt"
  | "author_name"
  | "tags"
  | "published_at"
> & {
  is_featured: boolean;
};

export async function createArticle(input: ArticleMutationInput) {
  const target = await getArticleWriteTarget();

  if (target === "storage") {
    return createArticleInStorage(input);
  }

  if (!target) {
    throw new Error("Article CMS write target is not available.");
  }

  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to create article: ${error.message}`);
  }

  return data;
}

export async function updateArticle(id: string, input: Partial<ArticleMutationInput>) {
  const target = await getArticleWriteTarget();

  if (target === "storage") {
    return updateArticleInStorage(id, input);
  }

  if (!target) {
    throw new Error("Article CMS write target is not available.");
  }

  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const storageArticle = await getStorageArticleSafely(id);

    if (storageArticle) {
      return updateArticleInStorage(id, input);
    }

    throw new Error(`Unable to update article: ${error.message}`);
  }

  return data;
}

export async function deleteArticle(id: string) {
  const target = await getArticleWriteTarget();

  if (target === "storage") {
    return deleteArticleFromStorage(id);
  }

  if (!target) {
    throw new Error("Article CMS write target is not available.");
  }

  const client = createAdminSupabaseClient();
  const { error } = await client.from("editorial_articles").delete().eq("id", id);

  if (error) {
    const storageArticle = await getStorageArticleSafely(id);

    if (storageArticle) {
      return deleteArticleFromStorage(id);
    }

    throw new Error(`Unable to delete article: ${error.message}`);
  }
}

async function getStorageArticleSafely(id: string) {
  try {
    return await getArticleByIdFromArticleStorage(id);
  } catch {
    return null;
  }
}
