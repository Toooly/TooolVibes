import "server-only";

import { cache } from "react";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import {
  canAccessSupabaseArticlesAdmin,
  getAdminArticleByIdFromSupabase,
  getAdminArticlesFromSupabase,
} from "@/lib/supabase/article-repository";
import type { BlogArticleRecord } from "@/lib/types/article";

export type AdminArticlesRuntime = {
  articles: BlogArticleRecord[];
  adminReadSource: "supabase" | "empty";
  requestedAdminReadSource: "supabase" | "empty";
  readMessage: string;
  canWrite: boolean;
  writeTarget: "supabase" | null;
  writeMessage: string;
  warnings: string[];
};

const warningLabels: Record<string, string> = {
  "supabase-admin-read-failed":
    "Il layer admin articoli non riesce a leggere Supabase. Applica la migration blog e verifica le env.",
  "supabase-admin-query-failed":
    "La query admin articoli ha fallito dopo il bootstrap della connessione.",
};

function isSupabaseAdminEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

function buildEmptyRuntime({
  requestedAdminReadSource,
  readMessage,
  writeMessage,
  warnings = [],
}: {
  requestedAdminReadSource: "supabase" | "empty";
  readMessage: string;
  writeMessage: string;
  warnings?: string[];
}): AdminArticlesRuntime {
  return {
    articles: [],
    adminReadSource: "empty",
    requestedAdminReadSource,
    readMessage,
    canWrite: false,
    writeTarget: null,
    writeMessage,
    warnings,
  };
}

export function getAdminArticleWarningLabel(warning: string) {
  return warningLabels[warning] ?? warning;
}

export const isSupabaseArticlesWriteEnabled = cache(async () => {
  if (!isSupabaseAdminEnabled()) {
    return false;
  }

  return canAccessSupabaseArticlesAdmin();
});

export const getAdminArticlesRuntime = cache(async (): Promise<AdminArticlesRuntime> => {
  if (!isSupabaseAdminEnabled()) {
    return buildEmptyRuntime({
      requestedAdminReadSource: "empty",
      readMessage:
        "Lettura blog non attiva: le env Supabase admin non sono presenti in questo ambiente.",
      writeMessage:
        "Scritture blog non attive: configura Supabase admin e applica la migration editorial_articles.",
    });
  }

  if (!(await canAccessSupabaseArticlesAdmin())) {
    return buildEmptyRuntime({
      requestedAdminReadSource: "supabase",
      readMessage:
        "Supabase admin e configurato ma la tabella editorial_articles non e raggiungibile.",
      writeMessage:
        "Scritture blog bloccate: applica la migration 0023_create_editorial_articles.sql.",
      warnings: ["supabase-admin-read-failed"],
    });
  }

  try {
    return {
      articles: await getAdminArticlesFromSupabase(),
      adminReadSource: "supabase",
      requestedAdminReadSource: "supabase",
      readMessage: "Lettura live da Supabase con articoli e bozze del blog.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage: "Scritture blog attive su Supabase.",
      warnings: [],
    };
  } catch {
    return buildEmptyRuntime({
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura admin blog degradata: la query editorial_articles ha fallito.",
      writeMessage:
        "Runtime blog in modalita prudente: le mutazioni restano bloccate finche la lettura non torna stabile.",
      warnings: ["supabase-admin-query-failed"],
    });
  }
});

export async function getAdminArticles() {
  const runtime = await getAdminArticlesRuntime();
  return runtime.articles;
}

export async function getAdminArticleById(id: string) {
  const runtime = await getAdminArticlesRuntime();
  const articleFromRuntime = runtime.articles.find((article) => article.id === id) ?? null;

  if (articleFromRuntime || !runtime.canWrite) {
    return articleFromRuntime;
  }

  return getAdminArticleByIdFromSupabase(id);
}
