import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { BlogArticleRecord } from "@/lib/types/article";

const ARTICLE_CONTENT_BUCKET = "editorial-content";
const ARTICLE_CONTENT_PREFIX = "articles";
export const ARTICLE_MEDIA_BUCKET = "editorial-media";

const editorialMediaMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

type ArticleStorageInput = Pick<
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

type PartialArticleStorageInput = Partial<ArticleStorageInput>;

type StorageArticlePayload = Partial<BlogArticleRecord> & {
  is_featured?: boolean;
};

function isAlreadyExistsError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("resource already exists")
  );
}

async function ensureBucket(
  bucket: string,
  options: {
    public: boolean;
    fileSizeLimit?: number;
    allowedMimeTypes?: string[];
  },
) {
  const client = createAdminSupabaseClient();
  const { data: buckets, error: listError } = await client.storage.listBuckets();

  if (!listError && buckets?.some((item) => item.name === bucket)) {
    return client;
  }

  const { error } = await client.storage.createBucket(bucket, {
    public: options.public,
    fileSizeLimit: options.fileSizeLimit,
    allowedMimeTypes: options.allowedMimeTypes,
  });

  if (error && !isAlreadyExistsError(error.message)) {
    throw new Error(`Unable to prepare storage bucket ${bucket}: ${error.message}`);
  }

  return client;
}

export async function ensureEditorialMediaBucket() {
  return ensureBucket(ARTICLE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: editorialMediaMimeTypes,
  });
}

async function ensureArticleContentBucket() {
  return ensureBucket(ARTICLE_CONTENT_BUCKET, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  });
}

function storagePathForArticle(id: string) {
  return `${ARTICLE_CONTENT_PREFIX}/${id}.json`;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeStorageArticle(payload: StorageArticlePayload): BlogArticleRecord | null {
  const id = asString(payload.id);
  const slug = asString(payload.slug);
  const title = asString(payload.title);

  if (!id || !slug || !title) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id,
    slug,
    title,
    dek: asString(payload.dek),
    summary: asString(payload.summary),
    kind: asString(payload.kind, "editorial") as BlogArticleRecord["kind"],
    status: asString(payload.status, "draft") as BlogArticleRecord["status"],
    content_markdown: asString(payload.content_markdown),
    cover_image_url: asNullableString(payload.cover_image_url),
    cover_image_alt: asString(payload.cover_image_alt),
    author_name: asString(payload.author_name, "TooolVibes"),
    tags: asStringArray(payload.tags),
    published_at: asString(payload.published_at, now.slice(0, 10)),
    featured: Boolean(payload.featured ?? payload.is_featured),
    created_at: asString(payload.created_at, now),
    updated_at: asString(payload.updated_at, now),
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

async function uploadStorageArticle(article: BlogArticleRecord, upsert: boolean) {
  const client = await ensureArticleContentBucket();
  const payload = JSON.stringify(article, null, 2);
  const { error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .upload(storagePathForArticle(article.id), new Blob([payload], { type: "application/json" }), {
      cacheControl: "60",
      contentType: "application/json",
      upsert,
    });

  if (error) {
    throw new Error(`Unable to save article in storage CMS: ${error.message}`);
  }
}

async function downloadStorageArticle(id: string): Promise<BlogArticleRecord | null> {
  const client = await ensureArticleContentBucket();
  const { data, error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .download(storagePathForArticle(id));

  if (error) {
    return null;
  }

  try {
    const payload = JSON.parse(await data.text()) as StorageArticlePayload;
    return normalizeStorageArticle(payload);
  } catch {
    return null;
  }
}

async function assertUniqueSlug(slug: string, currentId?: string) {
  const articles = await getArticlesFromArticleStorage();
  const duplicate = articles.find((article) => article.slug === slug && article.id !== currentId);

  if (duplicate) {
    throw new Error("editorial_articles_slug_key: duplicate slug");
  }
}

export const canAccessArticleStorageAdmin = cache(async () => {
  try {
    const client = await ensureArticleContentBucket();
    const { error } = await client.storage
      .from(ARTICLE_CONTENT_BUCKET)
      .list(ARTICLE_CONTENT_PREFIX, { limit: 1 });

    return !error;
  } catch {
    return false;
  }
});

export async function getArticlesFromArticleStorage(): Promise<BlogArticleRecord[]> {
  const client = await ensureArticleContentBucket();
  const { data, error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .list(ARTICLE_CONTENT_PREFIX, {
      limit: 1000,
      sortBy: { column: "updated_at", order: "desc" },
    });

  if (error) {
    throw new Error(`Unable to load articles from storage CMS: ${error.message}`);
  }

  const jsonFiles = (data ?? []).filter((item) => item.name.endsWith(".json"));
  const articles = await Promise.all(
    jsonFiles.map((item) => downloadStorageArticle(item.name.replace(/\.json$/, ""))),
  );

  return orderArticles(articles.filter((article): article is BlogArticleRecord => Boolean(article)));
}

export async function getPublishedArticlesFromArticleStorage(): Promise<BlogArticleRecord[]> {
  const articles = await getArticlesFromArticleStorage();
  return orderArticles(articles.filter((article) => article.status === "published"));
}

export async function getArticleByIdFromArticleStorage(id: string) {
  return downloadStorageArticle(id);
}

export async function createArticleInStorage(input: ArticleStorageInput) {
  await assertUniqueSlug(input.slug);

  const now = new Date().toISOString();
  const article: BlogArticleRecord = {
    id: crypto.randomUUID(),
    slug: input.slug,
    title: input.title,
    dek: input.dek,
    summary: input.summary,
    kind: input.kind,
    status: input.status,
    content_markdown: input.content_markdown,
    cover_image_url: input.cover_image_url,
    cover_image_alt: input.cover_image_alt,
    author_name: input.author_name,
    tags: input.tags,
    published_at: input.published_at,
    featured: input.is_featured,
    created_at: now,
    updated_at: now,
  };

  await uploadStorageArticle(article, false);
  return article;
}

export async function updateArticleInStorage(id: string, input: PartialArticleStorageInput) {
  const existing = await getArticleByIdFromArticleStorage(id);

  if (!existing) {
    throw new Error("Article not found in storage CMS.");
  }

  if (input.slug) {
    await assertUniqueSlug(input.slug, id);
  }

  const { is_featured, ...articleFields } = input;
  const article: BlogArticleRecord = {
    ...existing,
    ...articleFields,
    featured: typeof is_featured === "boolean" ? is_featured : existing.featured,
    updated_at: new Date().toISOString(),
  };

  await uploadStorageArticle(article, true);
  return article;
}

export async function deleteArticleFromStorage(id: string) {
  const client = await ensureArticleContentBucket();
  const { error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .remove([storagePathForArticle(id)]);

  if (error) {
    throw new Error(`Unable to delete article from storage CMS: ${error.message}`);
  }
}
