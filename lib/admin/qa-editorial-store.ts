import qaJson from "@/data/qa-editorial.json";
import type { BlogArticleRecord } from "@/lib/types/article";
import type { CuratedCollectionRecord } from "@/lib/types/collection";

export const QA_GUIDE_ID = "11111111-1111-4111-8111-111111111111";
export const QA_COLLECTION_ID = "22222222-2222-4222-8222-222222222222";

export type QaEditorialStore = {
  articles: BlogArticleRecord[];
  collections: CuratedCollectionRecord[];
};

export function isQaArticleId(id: string) {
  return id === QA_GUIDE_ID;
}

export function isQaCollectionId(id: string) {
  return id === QA_COLLECTION_ID;
}

export function isQaEditorialEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function getQaEditorialStore(): QaEditorialStore {
  if (!isQaEditorialEnabled()) {
    return { articles: [], collections: [] };
  }
  const raw = qaJson as Partial<QaEditorialStore>;
  return {
    articles: raw.articles ?? [],
    collections: raw.collections ?? [],
  };
}

export function getQaArticle(id: string) {
  return getQaEditorialStore().articles.find((article) => article.id === id) ?? null;
}

export function getQaCollection(id: string) {
  return getQaEditorialStore().collections.find((collection) => collection.id === id) ?? null;
}
