import "server-only";

import { cache } from "react";

import { loadLegacyEditorialPosts } from "@/lib/data/public-articles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import {
  getAdminArticleByIdFromSupabase,
  getAdminArticlesFromSupabase,
} from "@/lib/supabase/article-repository";
import {
  canAccessArticleStorageAdmin,
  createArticleInStorage,
  getArticleByIdFromArticleStorage,
  getArticlesFromArticleStorage,
} from "@/lib/supabase/article-storage-repository";
import { getArticleWriteTarget, type ArticleWriteTarget } from "@/lib/supabase/article-target";
import type { BlogArticleRecord, EditorialPostRecord } from "@/lib/types/article";

export type AdminArticleRecord = BlogArticleRecord & {
  admin_source: "cms" | "legacy";
  admin_source_label: string;
  admin_can_edit: boolean;
  admin_can_mutate: boolean;
};

export type AdminArticlesRuntime = {
  articles: AdminArticleRecord[];
  adminReadSource: "supabase" | "storage" | "legacy" | "mixed" | "empty";
  requestedAdminReadSource: "supabase" | "empty";
  readMessage: string;
  canWrite: boolean;
  writeTarget: ArticleWriteTarget | null;
  writeMessage: string;
  warnings: string[];
};

const warningLabels: Record<string, string> = {
  "supabase-service-role-missing":
    "Manca SUPABASE_SERVICE_ROLE_KEY nell'ambiente server: il CMS resta in sola lettura e non puo importare o modificare articoli.",
  "supabase-admin-read-failed":
    "Il CMS blog non e ancora raggiungibile su Supabase. Intanto vedi gli articoli legacy e puoi importarli appena la migration e applicata.",
  "supabase-admin-query-failed":
    "La lettura CMS blog ha fallito dopo il bootstrap. Sto mostrando il fallback legacy per non svuotare il backoffice.",
  "legacy-auto-import-failed":
    "Un articolo legacy non e stato importato automaticamente nel CMS.",
  "legacy-auto-import-refresh-failed":
    "Import legacy completato solo in parte: non sono riuscito a rileggere il CMS dopo il bootstrap automatico.",
};

function isSupabaseAdminEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

function getMissingSupabaseAdminWarnings() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return url && !serviceRoleKey ? ["supabase-service-role-missing"] : [];
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

function dedupeLegacyPostsBySlug(posts: EditorialPostRecord[]) {
  const seen = new Set<string>();
  const uniquePosts: EditorialPostRecord[] = [];

  for (const post of posts) {
    if (seen.has(post.slug)) {
      continue;
    }

    seen.add(post.slug);
    uniquePosts.push(post);
  }

  return uniquePosts;
}

function mapCmsArticleToAdminArticle(
  article: BlogArticleRecord,
  sourceLabel = "CMS blog",
): AdminArticleRecord {
  return {
    ...article,
    admin_source: "cms",
    admin_source_label: sourceLabel,
    admin_can_edit: true,
    admin_can_mutate: true,
  };
}

function mergeAdminArticles(
  cmsArticles: BlogArticleRecord[],
  legacyPosts: EditorialPostRecord[],
) {
  const cmsItems = cmsArticles.map((article) => mapCmsArticleToAdminArticle(article));
  const cmsSlugs = new Set(cmsItems.map((article) => article.slug));
  const legacyItems = dedupeLegacyPostsBySlug(legacyPosts)
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
    return dedupeLegacyPostsBySlug(await loadLegacyEditorialPosts());
  } catch {
    return [];
  }
}

type LegacyArticleImportInput = Pick<
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

function mapLegacyPostToImportInput(post: EditorialPostRecord): LegacyArticleImportInput {
  return {
    slug: post.slug,
    title: post.title,
    dek: post.dek,
    summary: post.summary,
    kind: post.kind,
    status: post.status ?? "published",
    content_markdown: post.content_markdown ?? buildLegacyArticleContent(post),
    cover_image_url: post.cover_image_url ?? null,
    cover_image_alt: post.cover_image_alt ?? post.title,
    author_name: post.author_name ?? "TooolVibes",
    tags: (post.tags ?? post.highlights.slice(0, 3)).slice(0, 16),
    published_at: post.published_at,
    is_featured: Boolean(post.featured),
  };
}

function getMissingLegacyPosts(
  cmsArticles: BlogArticleRecord[],
  legacyPosts: EditorialPostRecord[],
) {
  const cmsSlugs = new Set(cmsArticles.map((article) => article.slug));

  return dedupeLegacyPostsBySlug(legacyPosts).filter((post) => !cmsSlugs.has(post.slug));
}

function getImportWarning(post: EditorialPostRecord, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);

  return `legacy-auto-import-failed::${post.slug}: ${detail}`;
}

function isDuplicateImportError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("duplicate slug") ||
    message.includes("duplicate key") ||
    message.includes("editorial_articles_slug_key")
  );
}

async function importLegacyPostIntoSupabase(post: EditorialPostRecord) {
  const client = createAdminSupabaseClient();
  const { error } = await client
    .from("editorial_articles")
    .upsert(mapLegacyPostToImportInput(post), {
      onConflict: "slug",
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Unable to import ${post.slug} into Supabase CMS: ${error.message}`);
  }
}

async function materializeMissingLegacyArticles({
  cmsArticles,
  legacyPosts,
  writeTarget,
}: {
  cmsArticles: BlogArticleRecord[];
  legacyPosts: EditorialPostRecord[];
  writeTarget: ArticleWriteTarget;
}) {
  const missingLegacyPosts = getMissingLegacyPosts(cmsArticles, legacyPosts);
  const warnings: string[] = [];

  if (missingLegacyPosts.length === 0) {
    return { articles: cmsArticles, warnings, importedCount: 0 };
  }

  for (const post of missingLegacyPosts) {
    try {
      if (writeTarget === "storage") {
        await createArticleInStorage(mapLegacyPostToImportInput(post));
      } else {
        await importLegacyPostIntoSupabase(post);
      }
    } catch (error) {
      if (!isDuplicateImportError(error)) {
        warnings.push(getImportWarning(post, error));
      }
    }
  }

  try {
    const articles =
      writeTarget === "storage"
        ? await getArticlesFromArticleStorage()
        : await getAdminArticlesFromSupabase();

    return {
      articles,
      warnings,
      importedCount: Math.max(0, articles.length - cmsArticles.length),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    return {
      articles: cmsArticles,
      warnings: [...warnings, `legacy-auto-import-refresh-failed::${detail}`],
      importedCount: 0,
    };
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

  return Boolean(await getArticleWriteTarget());
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
        "Scritture blog non attive: aggiungi SUPABASE_SERVICE_ROLE_KEY nell'ambiente server. Appena il CMS diventa scrivibile, gli articoli legacy vengono importati automaticamente.",
      warnings: getMissingSupabaseAdminWarnings(),
    });
  }

  const writeTarget = await getArticleWriteTarget();

  if (!writeTarget) {
    return buildFallbackRuntime({
      articles: legacyArticles,
      adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
      requestedAdminReadSource: "supabase",
      readMessage:
        "Supabase admin e configurato ma il CMS blog non e raggiungibile: mostro il fallback legacy.",
      writeMessage:
        "Scritture blog non disponibili: controlla service role, storage e migration editorial_articles.",
      warnings: ["supabase-admin-read-failed"],
    });
  }

  if (writeTarget === "storage") {
    try {
      const storageArticles = await getArticlesFromArticleStorage();
      const importResult = await materializeMissingLegacyArticles({
        cmsArticles: storageArticles,
        legacyPosts,
        writeTarget,
      });
      const articles = mergeAdminArticles(importResult.articles, legacyPosts);
      const hasLegacyFallback = articles.some((article) => article.admin_source === "legacy");

      return {
        articles,
        adminReadSource: hasLegacyFallback ? "mixed" : "storage",
        requestedAdminReadSource: "supabase",
        readMessage:
          importResult.importedCount > 0
            ? "CMS storage Supabase attivo: ho importato automaticamente gli articoli legacy mancanti."
            : hasLegacyFallback
              ? "CMS storage Supabase attivo con fallback legacy residuo da verificare."
              : "CMS storage Supabase attivo con archivio articoli modificabile.",
        canWrite: true,
        writeTarget,
        writeMessage:
          "Salvataggi, import e upload attivi nel CMS storage Supabase.",
        warnings: importResult.warnings,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "errore sconosciuto";

      return buildFallbackRuntime({
        articles: legacyArticles,
        adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
        requestedAdminReadSource: "supabase",
        readMessage:
          "Lettura CMS storage non disponibile: mostro gli articoli legacy.",
        writeMessage:
          "Scritture blog non disponibili: controlla Supabase Storage e service role.",
        warnings: [`supabase-admin-query-failed::${detail}`],
      });
    }
  }

  try {
    const cmsArticles = await getAdminArticlesFromSupabase();
    const importResult = await materializeMissingLegacyArticles({
      cmsArticles,
      legacyPosts,
      writeTarget: "supabase",
    });
    const articles = mergeAdminArticles(importResult.articles, legacyPosts);
    const hasLegacyFallback = articles.some((article) => article.admin_source === "legacy");

    return {
      articles,
      adminReadSource: hasLegacyFallback ? "mixed" : "supabase",
      requestedAdminReadSource: "supabase",
      readMessage:
        importResult.importedCount > 0
          ? "Lettura live da Supabase: ho importato automaticamente gli articoli legacy mancanti."
          : hasLegacyFallback
            ? "Lettura live da Supabase con fallback legacy residuo da verificare."
          : "Lettura live da Supabase con articoli e bozze del blog.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage: "Scritture blog attive su Supabase.",
      warnings: importResult.warnings,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "errore sconosciuto";

    if (await canAccessArticleStorageAdmin()) {
      try {
        const storageArticles = await getArticlesFromArticleStorage();
        const importResult = await materializeMissingLegacyArticles({
          cmsArticles: storageArticles,
          legacyPosts,
          writeTarget: "storage",
        });
        const articles = mergeAdminArticles(importResult.articles, legacyPosts);
        const hasLegacyFallback = articles.some((article) => article.admin_source === "legacy");

        return {
          articles,
          adminReadSource: hasLegacyFallback ? "mixed" : "storage",
          requestedAdminReadSource: "supabase",
          readMessage:
            importResult.importedCount > 0
              ? "La tabella blog non risponde: uso il CMS storage Supabase e ho importato i legacy mancanti."
              : hasLegacyFallback
                ? "La tabella blog non risponde: uso il CMS storage Supabase con fallback legacy residuo."
                : "La tabella blog non risponde: uso il CMS storage Supabase per tenere attive le modifiche.",
          canWrite: true,
          writeTarget: "storage",
          writeMessage:
            "Salvataggi, import e upload attivi nel CMS storage Supabase.",
          warnings: importResult.warnings,
        };
      } catch {
        // Keep the original SQL error below: it is the most useful diagnostic.
      }
    }

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

  if (articleFromRuntime || !runtime.canWrite || !runtime.writeTarget) {
    return articleFromRuntime;
  }

  if (runtime.writeTarget === "storage") {
    return getArticleByIdFromArticleStorage(id);
  }

  return getAdminArticleByIdFromSupabase(id);
}

export const getLegacyPostForImport = cache(async (
  slug: string,
): Promise<EditorialPostRecord | null> => {
  const legacyPosts = await getLegacyAdminArticles();
  return legacyPosts.find((post) => post.slug === slug) ?? null;
});
