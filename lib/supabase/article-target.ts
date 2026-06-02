import "server-only";

import { cache } from "react";

import { canAccessArticleStorageAdmin } from "@/lib/supabase/article-storage-repository";
import { canAccessSupabaseArticlesAdmin } from "@/lib/supabase/article-repository";

export type ArticleWriteTarget = "supabase" | "storage";

export function isArticleStorageFallbackEnabled() {
  return process.env.TOOOLVIBES_ARTICLE_CMS_STORAGE_FALLBACK === "1";
}

export const getArticleWriteTarget = cache(async (): Promise<ArticleWriteTarget | null> => {
  if (await canAccessSupabaseArticlesAdmin()) {
    return "supabase";
  }

  if (isArticleStorageFallbackEnabled() && await canAccessArticleStorageAdmin()) {
    return "storage";
  }

  return null;
});
