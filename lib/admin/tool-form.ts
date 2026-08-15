import { toolCategories } from "@/lib/config/tool-taxonomy";
import type { ToolCategory, ToolRecord } from "@/lib/types/tool";

export type ToolFormValues = {
  name: string;
  slug: string;
  category: ToolCategory;
  tags: string;
  short_description_it: string;
  description_it: string;
  website_url: string;
  tooolvibes_post_url: string;
  affiliate_url: string | null;
  cover_image_url: string;
  source: string;
  date_discovered: string;
  is_featured: boolean;
  is_published: boolean;
};

export type ToolFormField = keyof ToolFormValues;

export type ToolFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ToolFormField, string>>;
  values?: ToolFormValues;
};

export const initialToolFormState: ToolFormState = {
  status: "idle",
};

export function getToolFormValues(tool?: ToolRecord | null): ToolFormValues {
  return {
    name: tool?.name ?? "",
    slug: tool?.slug ?? "",
    category: tool?.category ?? "Assistente AI",
    tags: tool?.tags.join(", ") ?? "",
    short_description_it: tool?.short_description_it ?? "",
    description_it: tool?.description_it ?? "",
    website_url: tool?.website_url ?? "",
    tooolvibes_post_url: tool?.tooolvibes_post_url ?? "",
    affiliate_url: tool?.affiliate_url ?? "",
    cover_image_url: tool?.cover_image_url ?? "",
    source: tool?.source ?? "",
    date_discovered: tool?.date_discovered ?? new Date().toISOString().slice(0, 10),
    is_featured: tool?.is_featured ?? false,
    is_published: tool?.is_published ?? false,
  };
}

export function slugifyToolName(value: string) {
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

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function parseToolFormData(formData: FormData) {
  const rawName = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "").trim();
  const rawShortDescription = String(formData.get("short_description_it") ?? "").trim();
  const rawDescription = String(formData.get("description_it") ?? "").trim();
  const rawWebsiteUrl = String(formData.get("website_url") ?? "").trim();
  const rawPostUrl = String(formData.get("tooolvibes_post_url") ?? "").trim();
  const rawAffiliateUrl = String(formData.get("affiliate_url") ?? "").trim();
  const rawCoverImageUrl = String(formData.get("cover_image_url") ?? "").trim();
  const rawSource = String(formData.get("source") ?? "").trim();
  const rawDateDiscovered = String(formData.get("date_discovered") ?? "").trim();
  const rawSlugOrFallback = rawSlug || slugifyToolName(rawName);
  const values: ToolFormValues = {
    name: rawName,
    slug: rawSlug,
    category: toolCategories.includes(rawCategory as ToolCategory)
      ? (rawCategory as ToolCategory)
      : "Assistente AI",
    tags: rawTags,
    short_description_it: rawShortDescription,
    description_it: rawDescription,
    website_url: rawWebsiteUrl,
    tooolvibes_post_url: rawPostUrl,
    affiliate_url: rawAffiliateUrl,
    cover_image_url: rawCoverImageUrl,
    source: rawSource,
    date_discovered: rawDateDiscovered,
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
  };

  const fieldErrors: Partial<Record<ToolFormField, string>> = {};

  if (rawName.length < 2) {
    fieldErrors.name = "Inserisci un nome più descrittivo.";
  }

  if (!rawSlugOrFallback || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawSlugOrFallback)) {
    fieldErrors.slug = "Usa solo lettere minuscole, numeri e trattini.";
  }

  if (!toolCategories.includes(rawCategory as ToolCategory)) {
    fieldErrors.category = "Seleziona una categoria valida.";
  }

  if (rawShortDescription.length < 20) {
    fieldErrors.short_description_it = "Scrivi una descrizione breve ma utile.";
  }

  if (rawDescription.length < 50) {
    fieldErrors.description_it = "Aggiungi più contesto editoriale.";
  }

  if (!isValidUrl(rawWebsiteUrl)) {
    fieldErrors.website_url = "Inserisci un URL valido.";
  }

  if (!isValidUrl(rawPostUrl)) {
    fieldErrors.tooolvibes_post_url = "Inserisci un URL valido.";
  }

  if (rawAffiliateUrl && !isValidUrl(rawAffiliateUrl)) {
    fieldErrors.affiliate_url = "Inserisci un URL valido oppure lascia vuoto.";
  }

  if (!isValidMediaRef(rawCoverImageUrl)) {
    fieldErrors.cover_image_url = "Inserisci un URL immagine valido.";
  }

  if (!rawSource) {
    fieldErrors.source = "Specifica la fonte.";
  }

  if (!rawDateDiscovered || Number.isNaN(new Date(rawDateDiscovered).getTime())) {
    fieldErrors.date_discovered = "Inserisci una data valida.";
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
      name: rawName,
      slug: rawSlugOrFallback,
      category: rawCategory as ToolCategory,
      tags: rawTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      short_description_it: rawShortDescription,
      description_it: rawDescription,
      website_url: rawWebsiteUrl,
      tooolvibes_post_url: rawPostUrl,
      affiliate_url: rawAffiliateUrl || null,
      cover_image_url: rawCoverImageUrl,
      source: rawSource,
      date_discovered: rawDateDiscovered,
      is_featured: formData.get("is_featured") === "on",
      is_published: formData.get("is_published") === "on",
    },
  };
}
