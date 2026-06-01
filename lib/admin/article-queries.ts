import "server-only";

import { cache } from "react";

import { loadLegacyEditorialPosts } from "@/lib/data/public-articles";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import {
  canAccessSupabaseArticlesAdmin,
  getAdminArticleByIdFromSupabase,
  getAdminArticlesFromSupabase,
} from "@/lib/supabase/article-repository";
import type { BlogArticleRecord, EditorialPostRecord } from "@/lib/types/article";

export type AdminArticleRecord = BlogArticleRecord & {
  admin_source: "cms" | "legacy";
  admin_source_label: string;
  admin_can_edit: boolean;
  admin_can_mutate: boolean;
};

export type AdminArticlesRuntime = {
  articles: AdminArticleRecord[];
  adminReadSource: "supabase" | "legacy" | "mixed" | "empty";
  requestedAdminReadSource: "supabase" | "empty";
  readMessage: string;
  canWrite: boolean;
  writeTarget: "supabase" | null;
  writeMessage: string;
  warnings: string[];
};

const warningLabels: Record<string, string> = {
  "supabase-admin-read-failed":
    "Il CMS blog non e ancora raggiungibile su Supabase. Intanto vedi gli articoli legacy e puoi importarli appena la migration e applicata.",
  "supabase-admin-query-failed":
    "La lettura CMS blog ha fallito dopo il bootstrap. Sto mostrando il fallback legacy per non svuotare il backoffice.",
};

function isSupabaseAdminEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

function buildLegacyArticleContent(post: EditorialPostRecord) {
  const sections = [
    `# ${post.title}`,
    post.dek,
    post.summary,
    post.highlights.length > 0 ? `## Punti chiave\n\n${post.highlights.map((item) => `- ${item}`).join("\n")}` : "",
    post.details.length > 0 ? `## Dettagli\n\n${post.details.map((item) => `- ${item}`).join("\n")}` : "",
    post.cautions.length > 0 ? `## Attenzione\n\n${post.cautions.map((item) => `- ${item}`).join("\n")}` : "",
  ];

  return sections.filter(Boolean).join("\n\n");
}

function mapLegacyPostToAdminArticle(post: EditorialPostRecord): AdminArticleRecord {
  return {
    id: `legacy:${post.slug}`,
    slug: post.slug,
    title: post.title,
    dek: post.dek,
    summary: post.summary,
    kind: post.kind,
    status: "published",
    content_markdown: post.content_markdown ?? buildLegacyArticleContent(post),
    cover_image_url: post.cover_image_url ?? null,
    cover_image_alt: post.cover_image_alt ?? post.title,
    author_name: post.author_name ?? "TooolVibes",
    tags: post.tags ?? post.highlights.slice(0, 3),
    published_at: post.published_at,
    featured: Boolean(post.featured),
    created_at: post.published_at,
    updated_at: post.updated_at,
    admin_source: "legacy",
    admin_source_label: post.source_label,
    admin_can_edit: false,
    admin_can_mutate: false,
  };
}

function mapCmsArticleToAdminArticle(article: BlogArticleRecord): AdminArticleRecord {
  return {
    ...article,
    admin_source: "cms",
    admin_source_label: "CMS blog",
    admin_can_edit: true,
    admin_can_mutate: true,
  };
}

function mergeAdminArticles(
  cmsArticles: BlogArticleRecord[],
  legacyPosts: EditorialPostRecord[],
) {
  const cmsItems = cmsArticles.map(mapCmsArticleToAdminArticle);
  const cmsSlugs = new Set(cmsItems.map((article) => article.slug));
  const legacyItems = legacyPosts
    .filter((post) => !cmsSlugs.has(post.slug))
    .map(mapLegacyPostToAdminArticle);

  return [...cmsItems, ...legacyItems].sort((left, right) => {
    if (left.admin_source !== right.admin_source) {
      return left.admin_source === "cms" ? -1 : 1;
    }

    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    return (right.published_at || right.updated_at).localeCompare(left.published_at || left.updated_at);
  });
}

async function getLegacyAdminArticles() {
  try {
    return await loadLegacyEditorialPosts();
  } catch {
    return [];
  }
}

function buildFallbackRuntime({
  articles,
  requestedAdminReadSource,
  adminReadSource,
  readMessage,
  writeMessage,
  warnings = [],
}: {
  articles: AdminArticleRecord[];
  adminReadSource: AdminArticlesRuntime["adminReadSource"];
  requestedAdminReadSource: "supabase" | "empty";
  readMessage: string;
  writeMessage: string;
  warnings?: string[];
}): AdminArticlesRuntime {
  return {
    articles,
    adminReadSource,
    requestedAdminReadSource,
    readMessage,
    canWrite: false,
    writeTarget: null,
    writeMessage,
    warnings,
  };
}

export function getAdminArticleWarningLabel(warning: string) {
  const [code, detail] = warning.split("::");
  const label = warningLabels[code] ?? code;

  return detail ? `${label} Dettaglio: ${detail}` : label;
}

export const isSupabaseArticlesWriteEnabled = cache(async () => {
  if (!isSupabaseAdminEnabled()) {
    return false;
  }

  return canAccessSupabaseArticlesAdmin();
});

export const getAdminArticlesRuntime = cache(async (): Promise<AdminArticlesRuntime> => {
  const legacyPosts = await getLegacyAdminArticles();
  const legacyArticles = mergeAdminArticles([], legacyPosts);

  if (!isSupabaseAdminEnabled()) {
    return buildFallbackRuntime({
      articles: legacyArticles,
      adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
      requestedAdminReadSource: "empty",
      readMessage:
        "Lettura CMS blog non attiva: mostro gli articoli legacy disponibili.",
      writeMessage:
        "Scritture blog non attive: configura Supabase admin e applica la migration editorial_articles per creare bozze modificabili.",
    });
  }

  if (!(await canAccessSupabaseArticlesAdmin())) {
    return buildFallbackRuntime({
      articles: legacyArticles,
      adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
      requestedAdminReadSource: "supabase",
      readMessage:
        "Supabase admin e configurato ma il CMS blog non e raggiungibile: mostro il fallback legacy.",
      writeMessage:
        "Scritture blog bloccate: applica la migration 0023_create_editorial_articles.sql, poi potrai creare e importare articoli.",
      warnings: ["supabase-admin-read-failed"],
    });
  }

  try {
    const cmsArticles = await getAdminArticlesFromSupabase();
    const articles = mergeAdminArticles(cmsArticles, legacyPosts);

    return {
      articles,
      adminReadSource: legacyPosts.length > 0 ? "mixed" : "supabase",
      requestedAdminReadSource: "supabase",
      readMessage:
        legacyPosts.length > 0
          ? "Lettura live da Supabase con articoli CMS e fallback legacy importabile."
          : "Lettura live da Supabase con articoli e bozze del blog.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage: "Scritture blog attive su Supabase.",
      warnings: [],
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "errore sconosciuto";

    return buildFallbackRuntime({
      articles: legacyArticles,
      adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura CMS blog degradata: mostro gli articoli legacy per non svuotare il backoffice.",
      writeMessage:
        "Runtime blog in modalita prudente: correggi la tabella editorial_articles per riattivare salvataggi e upload.",
      warnings: [`supabase-admin-query-failed::${detail}`],
    });
  }
});

export async function getAdminArticles() {
  const runtime = await getAdminArticlesRuntime();
  return runtime.articles;
}

export async function getAdminArticleById(id: string) {
  const runtime = await getAdminArticlesRuntime();
  const articleFromRuntime =
    runtime.articles.find((article) => article.id === id && article.admin_source === "cms") ?? null;

  if (articleFromRuntime || !runtime.canWrite) {
    return articleFromRuntime;
  }

  return getAdminArticleByIdFromSupabase(id);
}

export const getLegacyPostForImport = cache(async (
  slug: string,
): Promise<EditorialPostRecord | null> => {
  const legacyPosts = await getLegacyAdminArticles();
  return legacyPosts.find((post) => post.slug === slug) ?? null;
});
