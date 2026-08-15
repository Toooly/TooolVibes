import { describe, expect, it } from "vitest";

import { getQaArticle, getQaCollection, QA_COLLECTION_ID, QA_GUIDE_ID } from "@/lib/admin/qa-editorial-store";

describe("local QA editorial store", () => {
  it("exposes an editable guide fixture", () => {
    const article = getQaArticle(QA_GUIDE_ID);
    expect(article?.slug).toBe("qa-local-guide-stack-decision");
    expect(article?.kind).toBe("guide");
  });

  it("exposes an editable collection fixture", () => {
    const collection = getQaCollection(QA_COLLECTION_ID);
    expect(collection?.included_tools.length).toBeGreaterThanOrEqual(3);
  });
});
