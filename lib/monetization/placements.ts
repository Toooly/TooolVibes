import {
  TAYLORA_CAMPAIGN,
  type SponsorBrandAsset,
  type SponsorCreativeTheme,
  type SponsorRouteKey,
} from "@/lib/sponsors/sponsor-placements";
import {
  buildPartnerDestinationUrl,
  resolvePartnerCampaign,
  type PartnerResolutionContext,
  type PartnerResolutionStrategy,
} from "@/lib/sponsors/partner-resolver";

export type MonetizationStatus = "ready" | "reserved" | "planned";

/**
 * Launch inventory for the three public commercial slots.
 * Fill LAUNCH_SPONSOR_SLOTS with real partners before go-live.
 * Keep demos labeled (isDemo / Demo Partner*) until real data is ready.
 *
 * Insert the three definitive sponsors here:
 *   1) home-featured-tool
 *   2) catalog-native-sponsor
 *   3) tool-sponsored-alternative
 */
export type LaunchSponsorRecord = {
  active: boolean;
  placementId: "home-featured-tool" | "catalog-native-sponsor" | "tool-sponsored-alternative";
  sponsorLabel: string;
  name: string;
  logo: string | null;
  image?: string | null;
  description: string;
  href: string;
  cta: string;
  trackingId: string;
  startDate?: string | null;
  endDate?: string | null;
};

export const LAUNCH_SPONSOR_SLOTS: Record<
  LaunchSponsorRecord["placementId"],
  LaunchSponsorRecord
> = {
  "home-featured-tool": {
    active: true,
    placementId: "home-featured-tool",
    sponsorLabel: "Partner di TooolVibes",
    name: TAYLORA_CAMPAIGN.name,
    logo: TAYLORA_CAMPAIGN.logo,
    image: null,
    description: TAYLORA_CAMPAIGN.description,
    href: TAYLORA_CAMPAIGN.destinationUrl,
    cta: TAYLORA_CAMPAIGN.ctaLabel,
    trackingId: "tv-home-featured-taylora",
    startDate: TAYLORA_CAMPAIGN.startsAt,
    endDate: TAYLORA_CAMPAIGN.endsAt,
  },
  "catalog-native-sponsor": {
    active: true,
    placementId: "catalog-native-sponsor",
    sponsorLabel: "Sponsor",
    name: TAYLORA_CAMPAIGN.name,
    logo: TAYLORA_CAMPAIGN.logo,
    image: null,
    description: TAYLORA_CAMPAIGN.description,
    href: TAYLORA_CAMPAIGN.destinationUrl,
    cta: TAYLORA_CAMPAIGN.ctaLabel,
    trackingId: "tv-catalog-native-taylora",
    startDate: TAYLORA_CAMPAIGN.startsAt,
    endDate: TAYLORA_CAMPAIGN.endsAt,
  },
  "tool-sponsored-alternative": {
    active: false,
    placementId: "tool-sponsored-alternative",
    sponsorLabel: "Contenuto sponsorizzato",
    name: "",
    logo: null,
    image: null,
    description: "",
    href: "",
    cta: "",
    trackingId: "tv-tool-alternative",
    startDate: null,
    endDate: null,
  },
};

export type MonetizationPartnerIdentity = {
  name: string;
  category: string;
  href: string;
  logo?: string | null;
  image?: string | null;
  isDemo?: boolean;
};

export type MonetizationPlacement = {
  key: string;
  placementId?: string;
  surface: string;
  format: string;
  packageName: string;
  label: string;
  title: string;
  body: string;
  description?: string;
  ctaLabel: string;
  href: string;
  status: MonetizationStatus;
  /** When false, placement stays out of public surfaces even if ready. */
  active?: boolean;
  visible: boolean;
  priority: number;
  audience: string;
  partner?: MonetizationPartnerIdentity;
  editorialReason?: string;
  trackingId?: string;
  startDate?: string | null;
  endDate?: string | null;
  logo?: string | null;
  image?: string | null;
  /**
   * Partner-specific creative micro-world rendered at the centre of the
   * placement shell. Sourced from the sponsor campaign registry; unknown
   * or absent values fall back to the generic partner creative.
   */
  creativeVariant?: string;
  /** Partner creative theme (named accent roles + monogram) from the registry. */
  creativeTheme?: SponsorCreativeTheme;
  /** Canonical approved brand plate from the partner registry. */
  brandAsset?: SponsorBrandAsset;
  /**
   * Commercial inventory finalization — campaign resolution metadata.
   * route/strategy/rotationOffset drive the canonical partner resolver;
   * trackingStem keeps analytics ids stable across campaign rotation
   * (trackingId = tv-<trackingStem>-<sponsorId>).
   */
  route?: SponsorRouteKey;
  contextStrategy?: PartnerResolutionStrategy;
  rotationOffset?: number;
  trackingStem?: string;
};

export type PublicMonetizationPlacement = MonetizationPlacement & {
  status: "ready";
  visible: true;
  partner: MonetizationPartnerIdentity;
  editorialReason: string;
};

export const monetizationPlacements = [
  {
    /* Partner Spotlight — campaign-agnostic: the daily campaign is chosen
       by the canonical resolver (rotation, offset 0). Partner fields are
       overlaid from the resolved campaign at read time. */
    key: "home-featured-tool",
    placementId: "home-featured-tool",
    surface: "Homepage",
    format: "Partner Spotlight",
    packageName: "Homepage spotlight",
    label: "Partner di TooolVibes",
    title: "Partner Spotlight in homepage (disponibile).",
    body: "Superficie editoriale riservata a una Partner Experience attiva.",
    description:
      "Superficie editoriale riservata a una Partner Experience attiva.",
    ctaLabel: "Scopri il partner",
    href: "/sponsorizza",
    status: "ready" as const,
    active: true,
    visible: true,
    priority: 1,
    audience: "Utenti in esplorazione sulla home.",
    trackingId: "tv-home-featured-open",
    route: "home",
    contextStrategy: "rotation",
    rotationOffset: 0,
    trackingStem: "home-featured",
  },
  {
    /* Catalog Insert — campaign-agnostic: rotation with offset +1 so the
       archive does not automatically repeat the Home partner. */
    key: "catalog-native-sponsor",
    placementId: "catalog-native-sponsor",
    surface: "Catalogo",
    format: "Catalog Insert",
    packageName: "Category native",
    label: "Sponsor",
    title: "Catalog Insert nel catalogo (disponibile).",
    body: "Inserto editoriale riservato a una Partner Experience attiva.",
    description:
      "Inserto editoriale riservato a una Partner Experience attiva.",
    ctaLabel: "Scopri il partner",
    href: "/sponsorizza",
    status: "ready" as const,
    active: true,
    visible: true,
    priority: 2,
    audience: "Utenti che filtrano e confrontano tool nel catalogo.",
    trackingId: "tv-catalog-native-open",
    route: "archivio",
    contextStrategy: "rotation",
    rotationOffset: 1,
    trackingStem: "catalog-native",
  },
  {
    /* Contextual Experience in articles: resolver-driven by subject tags;
       renders nothing when no campaign is semantically relevant. */
    key: "guide-inline-promo",
    surface: "Guide e articoli",
    format: "Box promo in lettura",
    packageName: "Guide native box",
    label: "Contenuto sponsorizzato",
    title: "Partner Experience contestuale in lettura (disponibile).",
    body: "Pensato per guide, tutorial e contenuti editoriali: dichiarato, contestuale e con copy utile invece di banner generico.",
    ctaLabel: "Scopri il partner",
    href: "/sponsorizza",
    status: "ready" as const,
    active: false,
    visible: true,
    priority: 3,
    audience: "Prodotti che risolvono il problema trattato nella guida.",
    trackingId: "tv-guide-inline-open",
    route: "posts",
    contextStrategy: "contextual",
    rotationOffset: 0,
    trackingStem: "guide-inline",
  },
  {
    key: "article-sidebar-sponsor",
    surface: "Guide e articoli",
    format: "Sidebar sponsor",
    packageName: "Editorial rail",
    label: "Sponsor selezionato",
    title: "Presenza laterale per tool o risorse collegate.",
    body: "Rimane nella colonna dei prossimi passi, quindi lavora come suggerimento operativo e non come interruzione.",
    ctaLabel: "Diventa sponsor",
    href: "/affiliati",
    status: "planned",
    active: false,
    visible: true,
    priority: 4,
    audience: "Sponsor con contenuto, demo o risorsa da collegare alla lettura.",
  },
  {
    /* Contextual partner surface: the resolver picks a campaign by tool
       tags/segments; without a relevant campaign the record stays
       non-public and the approved Open Slot V3.1 renders. */
    key: "tool-sponsored-alternative",
    placementId: "tool-sponsored-alternative",
    surface: "Scheda tool",
    format: "Alternativa sponsorizzata",
    packageName: "Tool profile native",
    label: "Contenuto sponsorizzato",
    title: "Alternativa partner in scheda tool (disponibile).",
    body: "Placement contestuale su scheda tool / confronto. Disponibile per sponsor con tool complementari al contesto di valutazione.",
    description:
      "Placement contestuale su scheda tool / confronto. Disponibile per sponsor con tool complementari al contesto di valutazione.",
    ctaLabel: "Diventa sponsor",
    href: "/sponsorizza",
    status: "ready",
    active: false,
    visible: true,
    priority: 5,
    audience: "Utenti in fase di decisione su una scheda tool.",
    trackingId: "tv-tool-alternative-open",
    route: "tool-detail",
    contextStrategy: "contextual",
    rotationOffset: 0,
    trackingStem: "tool-alternative",
  },
  {
    /* Contextual partner inside a curated collection: resolver-driven by
       collection topic; renders nothing without semantic relevance. */
    key: "collection-native-sponsor",
    surface: "Raccolte",
    format: "Sponsor di raccolta",
    packageName: "Collection sponsor",
    label: "Contenuto sponsorizzato",
    title: "Partner di raccolta (disponibile).",
    body: "Adatta a speciali verticali, selezioni premium e percorsi tematici con sponsor coerente al contesto.",
    ctaLabel: "Scopri il partner",
    href: "/sponsorizza",
    status: "ready" as const,
    active: false,
    visible: true,
    priority: 6,
    audience: "Brand che vogliono presidiare una verticale editoriale.",
    trackingId: "tv-collection-native-open",
    route: "collections",
    contextStrategy: "contextual",
    rotationOffset: 0,
    trackingStem: "collection-native",
  },
  {
    key: "newsletter-placement",
    surface: "Newsletter",
    format: "Blocco newsletter",
    packageName: "Newsletter native",
    label: "Slot newsletter",
    title: "Un placement pronto per quando parte la newsletter.",
    body: "Lo spazio è già mappato nell'inventory, così può entrare nei pacchetti founder senza ridisegnare l'offerta.",
    ctaLabel: "Prenota slot",
    href: "/sponsorizza",
    status: "planned",
    active: false,
    visible: false,
    priority: 7,
    audience: "Sponsor che cercano reach ricorrente e contesto editoriale.",
  },
] as const satisfies readonly MonetizationPlacement[];

export type MonetizationPlacementKey = (typeof monetizationPlacements)[number]["key"];

export function resolutionNowMs(context?: Partial<PartnerResolutionContext>) {
  const now = context?.now as unknown;
  if (now instanceof Date) return now.getTime();
  if (typeof now === "number" && Number.isFinite(now)) return now;
  if (typeof now === "string") {
    const parsed = Date.parse(now);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function resolvePublicMonetizationPlacement(
  key: MonetizationPlacementKey,
  context?: Partial<PartnerResolutionContext>,
): PublicMonetizationPlacement | null {
  const placement = getMonetizationPlacement(key, context);
  return isPublicMonetizationPlacement(placement, resolutionNowMs(context))
    ? placement
    : null;
}

/**
 * Overlay the resolved partner campaign onto a placement record.
 *
 * Records carry no partner copy of their own: the canonical resolver picks
 * the active campaign (rotation or contextual, per record strategy) and the
 * public view is built from campaign fields. When no campaign is eligible
 * or relevant, partner fields are stripped so the record is not public —
 * open-slot surfaces (tool detail) then render the approved Open Slot.
 */
function applyPartnerCampaign(
  record: MonetizationPlacement,
  context?: Partial<PartnerResolutionContext>,
): MonetizationPlacement {
  if (!record.route || !record.contextStrategy) return record;

  const campaign = resolvePartnerCampaign({
    placementKey: record.key,
    route: record.route,
    strategy: record.contextStrategy,
    rotationOffset: record.rotationOffset ?? 0,
    toolSlug: context?.toolSlug,
    tags: context?.tags,
    text: context?.text,
    now: new Date(resolutionNowMs(context)),
  });

  if (!campaign) {
    const fallback: MonetizationPlacement = {
      ...record,
      active: false,
      partner: undefined,
      editorialReason: undefined,
      creativeVariant: undefined,
      creativeTheme: undefined,
      brandAsset: undefined,
      startDate: null,
      endDate: null,
    };
    return fallback;
  }

  const destination = buildPartnerDestinationUrl(campaign, record.key);

  return {
    ...record,
    active: true,
    title: campaign.headline,
    body: campaign.description,
    description: campaign.description,
    ctaLabel: campaign.ctaLabel,
    href: destination,
    trackingId: `tv-${record.trackingStem ?? record.key}-${campaign.sponsorId}`,
    startDate: campaign.startsAt,
    endDate: campaign.endsAt,
    creativeVariant: campaign.creativeVariant,
    creativeTheme: campaign.creativeTheme,
    brandAsset: campaign.brandAsset,
    partner: {
      name: campaign.name,
      category: campaign.eyebrow,
      href: destination,
      isDemo: false,
    },
    editorialReason: campaign.contextualReason ?? campaign.description,
  };
}

/**
 * Read a placement with its partner campaign resolved. `context` carries
 * the current subject (tool slug, catalogue segments/tags, free text) for
 * contextual surfaces; rotation surfaces need no context.
 */
export function getMonetizationPlacement(
  key: MonetizationPlacementKey,
  context?: Partial<PartnerResolutionContext>,
): MonetizationPlacement | undefined {
  const record = monetizationPlacements.find(
    (placement) => placement.key === key,
  );
  if (!record) return undefined;
  return applyPartnerCampaign(record, context);
}

export function getLaunchSponsorSlot(
  placementId: LaunchSponsorRecord["placementId"],
): LaunchSponsorRecord {
  return LAUNCH_SPONSOR_SLOTS[placementId];
}

function hasPublicText(value: string | undefined) {
  return Boolean(value?.trim());
}

function isAllowedPartnerUrl(value: string | undefined) {
  if (!hasPublicText(value)) return false;

  const raw = (value as string).trim();
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw.length > 1 && !raw.includes("://");
  }

  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isWithinFlightWindow(
  placement: MonetizationPlacement,
  now: number = Date.now(),
) {
  if (placement.startDate) {
    const start = Date.parse(placement.startDate);
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (placement.endDate) {
    const end = Date.parse(placement.endDate);
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

/**
 * Reserved and planned inventory belongs to the commercial back office, not
 * to the public reading journey. A placement is public only when a real
 * partner identity and an explicit editorial-relevance reason are present.
 *
 * Demo / fixture / development / placeholder records are explicitly filtered
 * out so the home never renders a sponsored block without an approved real
 * partner. The rule mirrors the V2 home-copy contract: "Non renderizzare il
 * modulo quando il record è: demo; fixture; development; placeholder; privo
 * di un partner reale approvato."
 */
export function isPublicMonetizationPlacement(
  placement: MonetizationPlacement | undefined,
  now: number = Date.now(),
): placement is PublicMonetizationPlacement {
  if (!placement) return false;
  if (placement.active === false) return false;
  if (!isWithinFlightWindow(placement, now)) return false;
  if (placement.partner?.isDemo) return false;

  return Boolean(
    placement.visible &&
      placement.status === "ready" &&
      hasPublicText(placement.partner?.name) &&
      hasPublicText(placement.partner?.category) &&
      isAllowedPartnerUrl(placement.partner?.href) &&
      hasPublicText(placement.editorialReason) &&
      hasPublicText(placement.title) &&
      hasPublicText(placement.ctaLabel),
  );
}

export function getMonetizationPlacementStats() {
  const placements: readonly MonetizationPlacement[] = monetizationPlacements;
  const total = placements.length;
  const visible = placements.filter((placement) => placement.visible).length;
  const ready = placements.filter((placement) => placement.status === "ready").length;
  const reserved = placements.filter((placement) => placement.status === "reserved").length;
  const planned = placements.filter((placement) => placement.status === "planned").length;
  const launchReady = Object.values(LAUNCH_SPONSOR_SLOTS).filter((slot) => slot.active).length;

  return { total, visible, ready, reserved, planned, launchReady };
}
