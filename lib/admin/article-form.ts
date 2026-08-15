import type {
  ArticleStatus,
  BlogArticleRecord,
  EditorialPostKind,
  EditorialPostRecord,
} from "@/lib/types/article";

export const articleKinds: EditorialPostKind[] = ["editorial", "guide", "tool-writeup"];
export const articleStatuses: ArticleStatus[] = ["draft", "published"];

export type ArticleFormValues = {
  title: string;
  slug: string;
  dek: string;
  summary: string;
  kind: EditorialPostKind;
  status: ArticleStatus;
  content_markdown: string;
  cover_image_url: string;
  cover_image_alt: string;
  author_name: string;
  tags: string;
  published_at: string;
  is_featured: boolean;
};

export type ArticleFormField = keyof ArticleFormValues;

export type ArticleFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ArticleFormField, string>>;
  values?: ArticleFormValues;
};

export const initialArticleFormState: ArticleFormState = {
  status: "idle",
};

export function getArticleFormValues(article?: BlogArticleRecord | null): ArticleFormValues {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    dek: article?.dek ?? "",
    summary: article?.summary ?? "",
    kind: article?.kind ?? "editorial",
    status: article?.status ?? "draft",
    content_markdown: article?.content_markdown ?? "",
    cover_image_url: article?.cover_image_url ?? "",
    cover_image_alt: article?.cover_image_alt ?? "",
    author_name: article?.author_name ?? "TooolVibes",
    tags: article?.tags.join(", ") ?? "",
    published_at: article?.published_at ?? new Date().toISOString().slice(0, 10),
    is_featured: article?.featured ?? false,
  };
}

export function getArticleImportFormValues(post: EditorialPostRecord): ArticleFormValues {
  const sections = [
    `# ${post.title}`,
    post.dek,
    post.summary,
    post.highlights.length > 0
      ? `## Punti chiave\n\n${post.highlights.map((item) => `- ${item}`).join("\n")}`
      : "",
    post.details.length > 0
      ? `## Dettagli\n\n${post.details.map((item) => `- ${item}`).join("\n")}`
      : "",
    post.cautions.length > 0
      ? `## Attenzione\n\n${post.cautions.map((item) => `- ${item}`).join("\n")}`
      : "",
  ];

  return {
    title: post.title,
    slug: post.slug,
    dek: post.dek,
    summary: post.summary,
    kind: post.kind,
    status: post.status ?? "published",
    content_markdown: post.content_markdown ?? sections.filter(Boolean).join("\n\n"),
    cover_image_url: post.cover_image_url ?? "",
    cover_image_alt: post.cover_image_alt ?? post.title,
    author_name: post.author_name ?? "TooolVibes",
    tags: (post.tags ?? post.highlights.slice(0, 3)).join(", "),
    published_at: post.published_at,
    is_featured: Boolean(post.featured),
  };
}

export function slugifyArticleTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidMediaRef(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function parseArticleFormData(formData: FormData) {
  const rawTitle = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const rawDek = String(formData.get("dek") ?? "").trim();
  const rawSummary = String(formData.get("summary") ?? "").trim();
  const rawKind = String(formData.get("kind") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();
  const rawContent = String(formData.get("content_markdown") ?? "").trim();
  const rawCoverImageUrl = String(formData.get("cover_image_url") ?? "").trim();
  const rawCoverImageAlt = String(formData.get("cover_image_alt") ?? "").trim();
  const rawAuthorName = String(formData.get("author_name") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "").trim();
  const rawPublishedAt = String(formData.get("published_at") ?? "").trim();
  const rawSlugOrFallback = rawSlug || slugifyArticleTitle(rawTitle);
  const kind = articleKinds.includes(rawKind as EditorialPostKind)
    ? (rawKind as EditorialPostKind)
    : "editorial";
  const publicationStatus = articleStatuses.includes(rawStatus as ArticleStatus)
    ? (rawStatus as ArticleStatus)
    : "draft";
  const values: ArticleFormValues = {
    title: rawTitle,
    slug: rawSlug,
    dek: rawDek,
    summary: rawSummary,
    kind,
    status: publicationStatus,
    content_markdown: rawContent,
    cover_image_url: rawCoverImageUrl,
    cover_image_alt: rawCoverImageAlt,
    author_name: rawAuthorName,
    tags: rawTags,
    published_at: rawPublishedAt,
    is_featured: formData.get("is_featured") === "on",
  };

  const fieldErrors: Partial<Record<ArticleFormField, string>> = {};

  if (rawTitle.length < 3) {
    fieldErrors.title = "Inserisci un titolo piu descrittivo.";
  }

  if (!rawSlugOrFallback || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawSlugOrFallback)) {
    fieldErrors.slug = "Usa solo lettere minuscole, numeri e trattini.";
  }

  if (rawDek.length < 20) {
    fieldErrors.dek = "Scrivi un sottotitolo di almeno 20 caratteri.";
  }

  if (rawSummary.length < 30) {
    fieldErrors.summary = "Aggiungi un riassunto utile per SEO e card.";
  }

  if (!articleKinds.includes(rawKind as EditorialPostKind)) {
    fieldErrors.kind = "Seleziona una tipologia valida.";
  }

  if (!articleStatuses.includes(rawStatus as ArticleStatus)) {
    fieldErrors.status = "Seleziona uno stato valido.";
  }

  if (rawContent.length < 20) {
    fieldErrors.content_markdown = "Aggiungi corpo articolo, media o una bozza markdown.";
  }

  if (rawCoverImageUrl && !isValidMediaRef(rawCoverImageUrl)) {
    fieldErrors.cover_image_url = "Inserisci un URL immagine valido oppure lascia vuoto.";
  }

  if (rawAuthorName.length < 2) {
    fieldErrors.author_name = "Inserisci il nome autore.";
  }

  if (!rawPublishedAt || Number.isNaN(new Date(rawPublishedAt).getTime())) {
    fieldErrors.published_at = "Inserisci una data valida.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Controlla i campi evidenziati prima di salvare.",
        fieldErrors,
        values,
      },
    };
  }

  return {
    ok: true as const,
    values,
    data: {
      title: rawTitle,
      slug: rawSlugOrFallback,
      dek: rawDek,
      summary: rawSummary,
      kind,
      status: publicationStatus,
      content_markdown: rawContent,
      cover_image_url: rawCoverImageUrl || null,
      cover_image_alt: rawCoverImageAlt,
      author_name: rawAuthorName,
      tags: rawTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published_at: rawPublishedAt,
      is_featured: formData.get("is_featured") === "on",
    },
  };
}
