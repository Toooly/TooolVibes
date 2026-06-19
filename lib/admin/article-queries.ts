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
  createArticlesInStorage,
  getArticleByIdFromArticleStorage,
  getArticlesFromArticleStorage,
} from "@/lib/supabase/article-storage-repository";
import {
  getArticleWriteTarget,
  isArticleStorageFallbackEnabled,
  type ArticleWriteTarget,
} from "@/lib/supabase/article-target";
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
    "Il salvataggio degli articoli non è ancora attivo: l'area blog resta in sola lettura.",
  "supabase-admin-read-failed":
    "L'archivio del blog non è ancora raggiungibile. Intanto vedi gli articoli da importare e potrai salvarli appena l'area sarà pronta.",
  "supabase-admin-query-failed":
    "La lettura dell'archivio blog non è riuscita. Mostro gli articoli da importare per non lasciare l'area vuota.",
  "legacy-auto-import-failed":
    "Un articolo precedente non è stato importato automaticamente.",
  "legacy-auto-import-refresh-failed":
    "Importazione completata solo in parte: non sono riuscito a rileggere l'archivio dopo il tentativo automatico.",
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

async function importLegacyPostsIntoSupabase(posts: EditorialPostRecord[]) {
  if (posts.length === 0) {
    return;
  }

  const client = createAdminSupabaseClient();
  const { error } = await client
    .from("editorial_articles")
    .upsert(posts.map(mapLegacyPostToImportInput), {
      onConflict: "slug",
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Non è stato possibile importare gli articoli storici nel blog. Dettaglio: ${error.message}`);
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

  if (writeTarget === "supabase") {
    try {
      await importLegacyPostsIntoSupabase(missingLegacyPosts);
    } catch (error) {
      warnings.push(getImportWarning({ ...missingLegacyPosts[0], slug: "batch" }, error));
    }
  } else {
    try {
      await createArticlesInStorage(missingLegacyPosts.map(mapLegacyPostToImportInput));
    } catch (error) {
      warnings.push(getImportWarning({ ...missingLegacyPosts[0], slug: "storage-batch" }, error));
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
        "Archivio blog non attivo: mostro gli articoli già disponibili per l'importazione.",
      writeMessage:
        "Il salvataggio blog non è ancora attivo. Appena sarà disponibile, gli articoli precedenti verranno importati automaticamente.",
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
        "L'archivio principale è configurato ma il blog non è raggiungibile: mostro gli articoli da importare.",
      writeMessage:
        "Il salvataggio blog non è disponibile in questo momento. Controlla la configurazione prima di riprovare.",
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
            ? "Archivio blog attivo: ho importato automaticamente gli articoli precedenti mancanti."
            : hasLegacyFallback
              ? "Archivio blog attivo con alcuni articoli precedenti ancora da verificare."
              : "Archivio blog attivo con articoli modificabili.",
        canWrite: true,
        writeTarget,
        writeMessage:
          "Salvataggi, import e upload attivi nell'archivio blog.",
        warnings: importResult.warnings,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "errore sconosciuto";

      return buildFallbackRuntime({
        articles: legacyArticles,
        adminReadSource: legacyArticles.length > 0 ? "legacy" : "empty",
        requestedAdminReadSource: "supabase",
      readMessage:
          "Lettura dell'archivio alternativo non disponibile: mostro gli articoli da importare.",
      writeMessage:
          "Il salvataggio blog non è disponibile in questo momento. Controlla la configurazione e riprova.",
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
          ? "Lettura attiva: ho importato automaticamente gli articoli precedenti mancanti."
          : hasLegacyFallback
            ? "Lettura attiva con alcuni articoli precedenti ancora da verificare."
          : "Lettura attiva con articoli e bozze del blog.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage: "Salvataggi blog attivi.",
      warnings: importResult.warnings,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "errore sconosciuto";

    if (isArticleStorageFallbackEnabled() && await canAccessArticleStorageAdmin()) {
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
              ? "L'archivio principale non risponde: uso l'archivio alternativo e ho importato gli articoli precedenti mancanti."
              : hasLegacyFallback
                ? "L'archivio principale non risponde: uso l'archivio alternativo con alcuni articoli precedenti da verificare."
                : "L'archivio principale non risponde: uso l'archivio alternativo per tenere attive le modifiche.",
          canWrite: true,
          writeTarget: "storage",
          writeMessage:
            "Salvataggi, import e upload attivi nell'archivio blog.",
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
        "Lettura blog degradata: mostro gli articoli da importare per non lasciare l'area vuota.",
      writeMessage:
        "Area blog in modalità prudente: completa la configurazione per riattivare salvataggi e upload.",
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
