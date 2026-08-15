import { promises as fs } from "node:fs";
import path from "node:path";

import { getQaEditorialStore, isQaEditorialEnabled, QA_COLLECTION_ID, QA_GUIDE_ID } from "@/lib/admin/qa-editorial-store";
import type { BlogArticleRecord } from "@/lib/types/article";
import type { CuratedCollectionRecord } from "@/lib/types/collection";

async function writeStore(next: ReturnType<typeof getQaEditorialStore>) {
  await fs.writeFile(
    path.join(process.cwd(), "data/qa-editorial.json"),
    `${JSON.stringify(next, null, 2)}\n`,
    "utf8",
  );
}

export async function persistQaArticle(article: BlogArticleRecord) {
  if (!isQaEditorialEnabled()) return;
  const store = getQaEditorialStore();
  const articles = [...store.articles.filter((item) => item.id !== article.id), article];
  await writeStore({ ...store, articles });
}

export async function persistQaCollection(collection: CuratedCollectionRecord) {
  if (!isQaEditorialEnabled()) return;
  const store = getQaEditorialStore();
  const collections = [...store.collections.filter((item) => item.id !== collection.id), collection];
  await writeStore({ ...store, collections });
}

export { QA_COLLECTION_ID, QA_GUIDE_ID };
