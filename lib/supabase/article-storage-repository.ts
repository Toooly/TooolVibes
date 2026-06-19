import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { BlogArticleRecord } from "@/lib/types/article";

const ARTICLE_CONTENT_BUCKET = "editorial-content";
const ARTICLE_CONTENT_PREFIX = "articles";
const ARTICLE_CONTENT_INDEX_PATH = `${ARTICLE_CONTENT_PREFIX}/index.json`;
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

type StorageArticleIndexPayload =
  | {
      articles?: StorageArticlePayload[];
    }
  | StorageArticlePayload[];

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
    throw new Error(`Non è stato possibile preparare lo spazio per i contenuti. Dettaglio: ${error.message}`);
  }

  return client;
}

export const ensureEditorialMediaBucket = cache(async () => {
  return ensureBucket(ARTICLE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: editorialMediaMimeTypes,
  });
});

const ensureArticleContentBucket = cache(async () => {
  return ensureBucket(ARTICLE_CONTENT_BUCKET, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  });
});

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

async function uploadStorageArticleIndex(articles: BlogArticleRecord[]) {
  const client = await ensureArticleContentBucket();
  const payload = JSON.stringify({ articles: orderArticles(articles) }, null, 2);
  const { error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .upload(ARTICLE_CONTENT_INDEX_PATH, new Blob([payload], { type: "application/json" }), {
      cacheControl: "60",
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw new Error(`Non è stato possibile salvare l'indice degli articoli. Dettaglio: ${error.message}`);
  }
}

async function downloadStorageArticleIndex(): Promise<BlogArticleRecord[]> {
  const client = await ensureArticleContentBucket();
  const { data, error } = await client.storage
    .from(ARTICLE_CONTENT_BUCKET)
    .download(ARTICLE_CONTENT_INDEX_PATH);

  if (error) {
    return [];
  }

  try {
    const payload = JSON.parse(await data.text()) as StorageArticleIndexPayload;
    const rawArticles = Array.isArray(payload) ? payload : payload.articles ?? [];

    return orderArticles(rawArticles.map(normalizeStorageArticle).filter(Boolean) as BlogArticleRecord[]);
  } catch {
    return [];
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
    await ensureArticleContentBucket();
    return true;
  } catch {
    return false;
  }
});

export async function getArticlesFromArticleStorage(): Promise<BlogArticleRecord[]> {
  return downloadStorageArticleIndex();
}

export async function getPublishedArticlesFromArticleStorage(): Promise<BlogArticleRecord[]> {
  const articles = await getArticlesFromArticleStorage();
  return orderArticles(articles.filter((article) => article.status === "published"));
}

export async function getArticleByIdFromArticleStorage(id: string) {
  const articles = await getArticlesFromArticleStorage();
  return articles.find((article) => article.id === id) ?? downloadStorageArticle(id);
}

export async function createArticleInStorage(input: ArticleStorageInput) {
  const articles = await getArticlesFromArticleStorage();
  const duplicate = articles.find((article) => article.slug === input.slug);

  if (duplicate) {
    throw new Error("editorial_articles_slug_key: duplicate slug");
  }

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

  await uploadStorageArticleIndex([...articles, article]);
  return article;
}

export async function createArticlesInStorage(inputs: ArticleStorageInput[]) {
  const articles = await getArticlesFromArticleStorage();
  const existingSlugs = new Set(articles.map((article) => article.slug));
  const now = new Date().toISOString();
  const newArticles = inputs
    .filter((input) => !existingSlugs.has(input.slug))
    .map((input): BlogArticleRecord => ({
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
    }));

  if (newArticles.length === 0) {
    return articles;
  }

  const nextArticles = [...articles, ...newArticles];
  await uploadStorageArticleIndex(nextArticles);
  return orderArticles(nextArticles);
}

export async function updateArticleInStorage(id: string, input: PartialArticleStorageInput) {
  const articles = await getArticlesFromArticleStorage();
  const existingIndex = articles.findIndex((article) => article.id === id);
  const existing = existingIndex >= 0 ? articles[existingIndex] : null;

  if (!existing) {
    throw new Error("Articolo non trovato nell'archivio.");
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

  const nextArticles = [...articles];
  nextArticles[existingIndex] = article;
  await uploadStorageArticleIndex(nextArticles);
  return article;
}

export async function deleteArticleFromStorage(id: string) {
  const articles = await getArticlesFromArticleStorage();
  const nextArticles = articles.filter((article) => article.id !== id);

  if (nextArticles.length === articles.length) {
    return;
  }

  await uploadStorageArticleIndex(nextArticles);
}
