import type {
  CollectionAccess,
  CollectionAudience,
  CollectionDifficulty,
  CollectionEditorialState,
  CollectionFeaturedSlot,
  CollectionSurface,
  CollectionTheme,
  CollectionTone,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

export const collectionThemes: CollectionTheme[] = [
  "founder-stack",
  "design-sprint",
  "creator-video",
  "research-synthesis",
  "indie-launch",
];

export const collectionAudiences: CollectionAudience[] = [
  "Solo founders",
  "Designer-builders",
  "Creator teams",
  "Research-led teams",
  "Indie launchers",
];

export const collectionDifficulties: CollectionDifficulty[] = [
  "starter",
  "growing",
  "advanced",
];

export const collectionTones: CollectionTone[] = [
  "starter-stack",
  "focused-bundle",
  "editorial-picks",
  "special-issue",
];

export const collectionAccessModes: CollectionAccess[] = ["open", "premium-preview", "premium"];
export const collectionEditorialStates: CollectionEditorialState[] = [
  "draft",
  "scheduled",
  "published",
  "featured",
  "archived",
];
export const collectionSurfaces: CollectionSurface[] = ["collection", "special-issue"];
export const collectionFeaturedSlots: Array<CollectionFeaturedSlot | ""> = [
  "",
  "home-hero",
  "home-secondary",
  "archive-strip",
  "special-issue",
];

export type CollectionFormToolSlotValues = {
  tool_slug: string;
  role: string;
  note: string;
  featured: boolean;
  order: string;
};

export type CollectionFormValues = {
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  cover_kicker: string;
  rationale: string;
  highlights: string;
  premium_teaser: string;
  theme: CollectionTheme;
  audience: CollectionAudience;
  difficulty: CollectionDifficulty;
  tone: CollectionTone;
  access: CollectionAccess;
  editorial_state: CollectionEditorialState;
  surface: CollectionSurface;
  featured_slot: CollectionFeaturedSlot | "";
  editorial_order: string;
  scheduled_for: string;
  first_published_at: string;
  published_at: string;
  archived_at: string;
  included_tools: CollectionFormToolSlotValues[];
};

export type CollectionFormField = keyof Omit<CollectionFormValues, "included_tools"> | "included_tools";

export type CollectionFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<CollectionFormField, string>>;
  values?: CollectionFormValues;
};

export const initialCollectionFormState: CollectionFormState = {
  status: "idle",
};

function formatDateTimeInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function slugifyCollectionTitle(value: string) {
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

function normalizeDateTimeValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getCollectionFormValues(
  collection?: CuratedCollectionRecord | null,
): CollectionFormValues {
  const slotValues = collection?.included_tools.map((slot) => ({
    tool_slug: slot.tool_slug,
    role: slot.role,
    note: slot.note ?? "",
    featured: slot.featured ?? false,
    order: String(slot.order ?? ""),
  })) ?? [
    { tool_slug: "", role: "", note: "", featured: true, order: "1" },
    { tool_slug: "", role: "", note: "", featured: false, order: "2" },
    { tool_slug: "", role: "", note: "", featured: false, order: "3" },
  ];

  return {
    title: collection?.title ?? "",
    slug: collection?.slug ?? "",
    description: collection?.description ?? "",
    cover_image_url: collection?.cover_image_url ?? "",
    cover_kicker: collection?.cover_kicker ?? "",
    rationale: collection?.rationale ?? "",
    highlights: collection?.highlights.join("\n") ?? "",
    premium_teaser: collection?.premium_teaser ?? "",
    theme: collection?.theme ?? "founder-stack",
    audience: collection?.audience ?? "Solo founders",
    difficulty: collection?.difficulty ?? "starter",
    tone: collection?.tone ?? "starter-stack",
    access: collection?.access ?? "open",
    editorial_state: collection?.editorial_state ?? "draft",
    surface: collection?.surface ?? "collection",
    featured_slot: collection?.featured_slot ?? "",
    editorial_order: String(collection?.editorial_order ?? 999),
    scheduled_for: formatDateTimeInput(collection?.scheduled_for),
    first_published_at: formatDateTimeInput(collection?.first_published_at),
    published_at: formatDateTimeInput(collection?.published_at),
    archived_at: formatDateTimeInput(collection?.archived_at),
    included_tools: slotValues,
  };
}

export type CollectionMutationInput = Omit<
  CuratedCollectionRecord,
  "id" | "created_at" | "updated_at" | "source_kind"
>;

export function toCollectionMutationInput(
  collection: CuratedCollectionRecord,
): CollectionMutationInput {
  return {
    title: collection.title,
    slug: collection.slug,
    description: collection.description,
    cover_image_url: collection.cover_image_url,
    cover_kicker: collection.cover_kicker,
    rationale: collection.rationale,
    highlights: collection.highlights,
    premium_teaser: collection.premium_teaser ?? undefined,
    theme: collection.theme,
    audience: collection.audience,
    difficulty: collection.difficulty,
    tone: collection.tone,
    access: collection.access,
    editorial_state: collection.editorial_state,
    surface: collection.surface,
    featured_slot: collection.featured_slot ?? null,
    editorial_order: collection.editorial_order ?? 999,
    scheduled_for: collection.scheduled_for ?? null,
    first_published_at: collection.first_published_at ?? null,
    published_at: collection.published_at ?? null,
    archived_at: collection.archived_at ?? null,
    included_tools: collection.included_tools.map((slot, index) => ({
      tool_slug: slot.tool_slug,
      role: slot.role,
      note: slot.note ?? undefined,
      featured: slot.featured ?? false,
      order: slot.order ?? index,
    })),
  };
}

export function parseCollectionFormData(
  formData: FormData,
  availableToolSlugs: Set<string>,
) {
  const slotCount = Number(formData.get("slot_count") ?? "6");
  const rawTitle = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "").trim();
  const rawCoverImageUrl = String(formData.get("cover_image_url") ?? "").trim();
  const rawCoverKicker = String(formData.get("cover_kicker") ?? "").trim();
  const rawRationale = String(formData.get("rationale") ?? "").trim();
  const rawHighlights = String(formData.get("highlights") ?? "").trim();
  const rawPremiumTeaser = String(formData.get("premium_teaser") ?? "").trim();
  const rawTheme = String(formData.get("theme") ?? "").trim();
  const rawAudience = String(formData.get("audience") ?? "").trim();
  const rawDifficulty = String(formData.get("difficulty") ?? "").trim();
  const rawTone = String(formData.get("tone") ?? "").trim();
  const rawAccess = String(formData.get("access") ?? "").trim();
  const rawEditorialState = String(formData.get("editorial_state") ?? "").trim();
  const rawSurface = String(formData.get("surface") ?? "").trim();
  const rawFeaturedSlot = String(formData.get("featured_slot") ?? "").trim();
  const rawEditorialOrder = String(formData.get("editorial_order") ?? "").trim();
  const rawScheduledFor = String(formData.get("scheduled_for") ?? "").trim();
  const rawFirstPublishedAt = String(formData.get("first_published_at") ?? "").trim();
  const rawPublishedAt = String(formData.get("published_at") ?? "").trim();
  const rawArchivedAt = String(formData.get("archived_at") ?? "").trim();
  const slug = rawSlug || slugifyCollectionTitle(rawTitle);

  const includedTools: CollectionFormToolSlotValues[] = [];

  for (let index = 0; index < slotCount; index += 1) {
    includedTools.push({
      tool_slug: String(formData.get(`tool_slug_${index}`) ?? "").trim(),
      role: String(formData.get(`tool_role_${index}`) ?? "").trim(),
      note: String(formData.get(`tool_note_${index}`) ?? "").trim(),
      featured: formData.get(`tool_featured_${index}`) === "on",
      order: String(formData.get(`tool_order_${index}`) ?? "").trim(),
    });
  }

  const values: CollectionFormValues = {
    title: rawTitle,
    slug: rawSlug,
    description: rawDescription,
    cover_image_url: rawCoverImageUrl,
    cover_kicker: rawCoverKicker,
    rationale: rawRationale,
    highlights: rawHighlights,
    premium_teaser: rawPremiumTeaser,
    theme: collectionThemes.includes(rawTheme as CollectionTheme)
      ? (rawTheme as CollectionTheme)
      : "founder-stack",
    audience: collectionAudiences.includes(rawAudience as CollectionAudience)
      ? (rawAudience as CollectionAudience)
      : "Solo founders",
    difficulty: collectionDifficulties.includes(rawDifficulty as CollectionDifficulty)
      ? (rawDifficulty as CollectionDifficulty)
      : "starter",
    tone: collectionTones.includes(rawTone as CollectionTone)
      ? (rawTone as CollectionTone)
      : "starter-stack",
    access: collectionAccessModes.includes(rawAccess as CollectionAccess)
      ? (rawAccess as CollectionAccess)
      : "open",
    editorial_state: collectionEditorialStates.includes(
      rawEditorialState as CollectionEditorialState,
    )
      ? (rawEditorialState as CollectionEditorialState)
      : "draft",
    surface: collectionSurfaces.includes(rawSurface as CollectionSurface)
      ? (rawSurface as CollectionSurface)
      : "collection",
    featured_slot: collectionFeaturedSlots.includes(rawFeaturedSlot as CollectionFeaturedSlot | "")
      ? (rawFeaturedSlot as CollectionFeaturedSlot | "")
      : "",
    editorial_order: rawEditorialOrder,
    scheduled_for: rawScheduledFor,
    first_published_at: rawFirstPublishedAt,
    published_at: rawPublishedAt,
    archived_at: rawArchivedAt,
    included_tools: includedTools,
  };

  const fieldErrors: Partial<Record<CollectionFormField, string>> = {};

  if (rawTitle.length < 2) {
    fieldErrors.title = "Inserisci un titolo più descrittivo.";
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug = "Usa solo lettere minuscole, numeri e trattini.";
  }

  if (rawDescription.length < 20) {
    fieldErrors.description = "Scrivi una descrizione utile e leggibile.";
  }

  if (!isValidMediaRef(rawCoverImageUrl)) {
    fieldErrors.cover_image_url = "Inserisci un URL immagine valido.";
  }

  if (rawCoverKicker.length < 2) {
    fieldErrors.cover_kicker = "Aggiungi un kicker breve ma chiaro.";
  }

  if (rawRationale.length < 50) {
    fieldErrors.rationale = "Il rationale deve aiutare davvero la lettura editoriale.";
  }

  if (!collectionThemes.includes(rawTheme as CollectionTheme)) {
    fieldErrors.theme = "Seleziona un tema valido.";
  }

  if (!collectionAudiences.includes(rawAudience as CollectionAudience)) {
    fieldErrors.audience = "Seleziona un'audience valida.";
  }

  if (!collectionDifficulties.includes(rawDifficulty as CollectionDifficulty)) {
    fieldErrors.difficulty = "Seleziona un livello valido.";
  }

  if (!collectionTones.includes(rawTone as CollectionTone)) {
    fieldErrors.tone = "Seleziona un tone valido.";
  }

  if (!collectionAccessModes.includes(rawAccess as CollectionAccess)) {
    fieldErrors.access = "Seleziona un access valido.";
  }

  if (!collectionEditorialStates.includes(rawEditorialState as CollectionEditorialState)) {
    fieldErrors.editorial_state = "Seleziona uno stato editoriale valido.";
  }

  if (!collectionSurfaces.includes(rawSurface as CollectionSurface)) {
    fieldErrors.surface = "Seleziona un formato valido.";
  }

  if (
    rawFeaturedSlot &&
    !collectionFeaturedSlots.includes(rawFeaturedSlot as CollectionFeaturedSlot | "")
  ) {
    fieldErrors.featured_slot = "Seleziona un featured slot valido.";
  }

  const editorialOrder = Number(rawEditorialOrder);

  if (!rawEditorialOrder || Number.isNaN(editorialOrder) || editorialOrder < 0) {
    fieldErrors.editorial_order = "Inserisci un ordering valido.";
  }

  if (values.editorial_state === "scheduled" && !normalizeDateTimeValue(rawScheduledFor)) {
    fieldErrors.scheduled_for = "Una raccolta programmata richiede una data.";
  }

  if (values.editorial_state === "featured" && !rawFeaturedSlot) {
    fieldErrors.featured_slot = "Una raccolta in evidenza ha bisogno di uno spazio dedicato.";
  }

  const highlights = rawHighlights
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (highlights.length === 0) {
    fieldErrors.highlights = "Aggiungi almeno un highlight leggibile.";
  }

  if (values.access !== "open" && rawPremiumTeaser.length < 24) {
    fieldErrors.premium_teaser =
      "Le raccolte in anteprima o premium hanno bisogno di un teaser più chiaro.";
  }

  const normalizedSlots = includedTools
    .map((slot) => ({
      ...slot,
      order: slot.order || "",
    }))
    .filter((slot) => Boolean(slot.tool_slug || slot.role || slot.note));

  if (normalizedSlots.length === 0) {
    fieldErrors.included_tools = "Aggiungi almeno un tool alla raccolta.";
  }

  const usedToolSlugs = new Set<string>();
  const featuredToolCount = normalizedSlots.filter((slot) => slot.featured).length;

  normalizedSlots.forEach((slot) => {
    if (!slot.tool_slug || !slot.role) {
      fieldErrors.included_tools =
        "Ogni slot compilato deve avere sia tool sia ruolo editoriale.";
      return;
    }

    if (!availableToolSlugs.has(slot.tool_slug)) {
      fieldErrors.included_tools = "Uno o più tool selezionati non sono disponibili.";
      return;
    }

    if (usedToolSlugs.has(slot.tool_slug)) {
      fieldErrors.included_tools = "Non puoi usare lo stesso tool due volte nella stessa raccolta.";
      return;
    }

    usedToolSlugs.add(slot.tool_slug);

    if (!slot.order || Number.isNaN(Number(slot.order))) {
      fieldErrors.included_tools = "Ogni slot ha bisogno di un ordine numerico.";
    }
  });

  if (featuredToolCount > 1) {
    fieldErrors.included_tools = "Seleziona un solo anchor tool.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Controlla i campi evidenziati prima di salvare la raccolta.",
        fieldErrors,
        values: {
          ...values,
          slug,
          included_tools: includedTools,
        },
      },
    };
  }

  return {
    ok: true as const,
    values: {
      ...values,
      slug,
      included_tools: includedTools,
    },
    data: {
      title: rawTitle,
      slug,
      description: rawDescription,
      cover_image_url: rawCoverImageUrl,
      cover_kicker: rawCoverKicker,
      rationale: rawRationale,
      highlights,
      premium_teaser: rawPremiumTeaser || undefined,
      theme: rawTheme as CollectionTheme,
      audience: rawAudience as CollectionAudience,
      difficulty: rawDifficulty as CollectionDifficulty,
      tone: rawTone as CollectionTone,
      access: rawAccess as CollectionAccess,
      editorial_state: rawEditorialState as CollectionEditorialState,
      surface: rawSurface as CollectionSurface,
      featured_slot: (rawFeaturedSlot as CollectionFeaturedSlot) || null,
      editorial_order: editorialOrder,
      included_tools: normalizedSlots
        .filter((slot) => slot.tool_slug && slot.role)
        .map((slot) => ({
          tool_slug: slot.tool_slug,
          role: slot.role,
          note: slot.note || undefined,
          featured: slot.featured,
          order: Number(slot.order),
        })),
      scheduled_for: normalizeDateTimeValue(rawScheduledFor),
      first_published_at: normalizeDateTimeValue(rawFirstPublishedAt),
      published_at: normalizeDateTimeValue(rawPublishedAt),
      archived_at: normalizeDateTimeValue(rawArchivedAt),
    } satisfies CollectionMutationInput,
  };
}
