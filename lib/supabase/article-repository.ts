import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { BlogArticleRecord, EditorialPostRecord } from "@/lib/types/article";

const articleSelect = [
  "id",
  "slug",
  "title",
  "dek",
  "summary",
  "kind",
  "status",
  "content_markdown",
  "cover_image_url",
  "cover_image_alt",
  "author_name",
  "tags",
  "published_at",
  "is_featured",
  "created_at",
  "updated_at",
].join(", ");

type SupabaseArticleRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapSupabaseArticle(row: SupabaseArticleRow): BlogArticleRecord {
  const slug = asString(row.slug);
  const publishedAt =
    asString(row.published_at) || asString(row.created_at).slice(0, 10) || new Date().toISOString().slice(0, 10);

  return {
    id: asString(row.id),
    slug,
    title: asString(row.title),
    dek: asString(row.dek),
    summary: asString(row.summary),
    kind: asString(row.kind, "editorial") as BlogArticleRecord["kind"],
    status: asString(row.status, "draft") as BlogArticleRecord["status"],
    content_markdown: asString(row.content_markdown),
    cover_image_url: asNullableString(row.cover_image_url),
    cover_image_alt: asString(row.cover_image_alt),
    author_name: asString(row.author_name, "TooolVibes"),
    tags: asStringArray(row.tags),
    published_at: publishedAt,
    featured: Boolean(row.is_featured),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

function orderArticles(items: BlogArticleRecord[]) {
  return [...items].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    const leftDate = left.published_at || left.updated_at;
    const rightDate = right.published_at || right.updated_at;

    return rightDate.localeCompare(leftDate);
  });
}

export function mapArticleToEditorialPost(article: BlogArticleRecord): EditorialPostRecord {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    summary: article.summary,
    kind: article.kind,
    status: article.status,
    content_markdown: article.content_markdown,
    cover_image_url: article.cover_image_url,
    cover_image_alt: article.cover_image_alt,
    author_name: article.author_name,
    tags: article.tags,
    published_at: article.published_at,
    updated_at: article.updated_at,
    source_label: "Blog TooolVibes",
    source_url: `/posts/${article.slug}`,
    featured: article.featured,
    highlights: article.tags.slice(0, 3),
    details: [],
    cautions: [],
  };
}

export const canAccessSupabaseArticlesAdmin = cache(async (): Promise<boolean> => {
  try {
    const client = createAdminSupabaseClient();
    const { error } = await client
      .from("editorial_articles")
      .select("id", { head: true, count: "estimated" })
      .limit(1);

    return !error;
  } catch {
    return false;
  }
});

export const getPublishedArticlesFromSupabase = cache(async (): Promise<BlogArticleRecord[]> => {
  const client = createPublicSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .select(articleSelect)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Non è stato possibile caricare gli articoli pubblicati. Dettaglio: ${error.message}`);
  }

  return orderArticles(((data ?? []) as unknown as SupabaseArticleRow[]).map(mapSupabaseArticle));
});

export async function getAdminArticlesFromSupabase(): Promise<BlogArticleRecord[]> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .select(articleSelect)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Non è stato possibile caricare gli articoli dell'area admin. Dettaglio: ${error.message}`);
  }

  return orderArticles(((data ?? []) as unknown as SupabaseArticleRow[]).map(mapSupabaseArticle));
}

export async function getAdminArticleByIdFromSupabase(id: string): Promise<BlogArticleRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("editorial_articles")
    .select(articleSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Non è stato possibile caricare questo articolo. Dettaglio: ${error.message}`);
  }

  return data ? mapSupabaseArticle(data as unknown as SupabaseArticleRow) : null;
}
