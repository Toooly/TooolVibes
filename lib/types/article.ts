export type EditorialPostKind = "tool-writeup" | "guide" | "editorial";
export type ArticleStatus = "draft" | "published";

export type BlogArticleRecord = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  summary: string;
  kind: EditorialPostKind;
  status: ArticleStatus;
  content_markdown: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  author_name: string;
  tags: string[];
  published_at: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type EditorialPostRecord = {
  id?: string;
  slug: string;
  title: string;
  dek: string;
  summary: string;
  kind: EditorialPostKind;
  status?: ArticleStatus;
  content_markdown?: string;
  cover_image_url?: string | null;
  cover_image_alt?: string;
  author_name?: string;
  tags?: string[];
  published_at: string;
  updated_at: string;
  source_label: string;
  source_url: string;
  tool_slug?: string;
  related_collection_slugs?: string[];
  featured?: boolean;
  highlights: string[];
  details: string[];
  cautions: string[];
};
