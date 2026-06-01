"use server";

import "server-only";

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
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to update article: ${error.message}`);
  }

  return data;
}

export async function deleteArticle(id: string) {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("editorial_articles").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete article: ${error.message}`);
  }
}
