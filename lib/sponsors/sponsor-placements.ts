/**
 * TooolVibes Sponsor System — canonical registry.
 *
 * Direct first-party sponsorships: manually curated, editorial,
 * clearly labelled, sold and controlled by TooolVibes.
 * Separate from TinyAdz third-party programmatic advertising.
 */

export type SponsorCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed";

export type SponsorPlacementId =
  | "home-partner-spotlight"
  | "archive-sponsored-tool"
  | "tool-detail-partner"
  | "collections-partner"
  | "article-partner";

/**
 * Partner-specific creative micro-world selected by a campaign.
 *
 * The structural shell (disclosure, identity, CTA, analytics, responsive and
 * reduced-motion rules) is shared by every partner; the creative centre is
 * chosen here so each advertiser can have a distinct visual narrative without
 * forking the placement architecture. Unknown/absent values resolve to the
 * generic partner creative.
 */
export type SponsorCreativeVariant =
  | "taylora-flow"
  | "onweb24-build"
  | "zaplater-schedule"
  | "generic";

/**
 * Public route keys a direct campaign can be eligible for. Mirrors the
 * canonical commercial matrix (lib/monetization/commercial-placement-matrix.ts).
 */
export type SponsorRouteKey =
  | "home"
  | "archivio"
  | "tool-detail"
  | "posts"
  | "collections"
  | "radar"
  | "sponsorizza";

/**
 * Partner-specific creative theme. The campaign selects named accent roles
 * and identity primitives; the actual color values live in CSS theme blocks
 * (`[data-partner-theme="…"]`), never in this registry, so the design-token
 * pipeline stays the single source of truth for color.
 *
 * Everything is optional: absent values fall back to the neutral TooolVibes
 * partner treatment, keeping the framework reusable for future partners
 * without per-partner forks of the shell components.
 */
export type SponsorCreativeTheme = {
  /** Named accent roles, resolved by CSS theme blocks. */
  accentPrimary?: "gold" | "cyan" | "violet";
  accentSecondary?: "gold" | "cyan" | "violet";
  /** Creative motif identifier ("flow" pipeline, "pipeline" build stages,
      "timeline" scheduling narrative). */
  motif?: "flow" | "pipeline" | "timeline";
  /** Partner monogram used for identity marks (falls back to first letter). */
  monogram?: string;
};

export type SponsorBrandAsset = {
  /** Preferred web-optimized source (webp). */
  src: string;
  /** PNG fallback for environments without webp. */
  srcPng?: string;
  width: number;
  height: number;
  alt: string;
  fit?: "contain" | "cover";
  position?: string;
};

export type SponsorCampaign = {
  id: string;
  sponsorId: string;
  toolSlug?: string;
  name: string;
  logo: string | null;
  eyebrow: string;
  headline: string;
  description: string;
  contextualReason?: string;
  ctaLabel: string;
  destinationUrl: string;
  image?: string | null;
  accent?: string;
  disclosure: string;
  placements: SponsorPlacementId[];
  status: SponsorCampaignStatus;
  startsAt?: string;
  endsAt?: string;
  priority?: number;
  utmCampaign?: string;
  creativeVariant?: SponsorCreativeVariant;
  creativeTheme?: SponsorCreativeTheme;
  /** Canonical approved brand plate - dominant identity visual. */
  brandAsset?: SponsorBrandAsset;
  /**
   * Contextual eligibility signals (commercial inventory finalization).
   * categoryTags carry real catalogue segments (DirectoryFilterGroup keys);
   * contextTags carry free-topic signals matched against tool/article tags
   * and titles. preferredRoutes/excludedRoutes gate route eligibility.
   * rotationWeight biases the deterministic per-placement rotation between
   * otherwise equivalent campaigns (never influences organic ranking —
   * the name guard in __tests__/lib/sponsors/taylora-rules.test.ts allows
   * exactly this one sponsor-rotation field).
   */
  contextTags?: readonly string[];
  categoryTags?: readonly string[];
  preferredRoutes?: readonly SponsorRouteKey[];
  excludedRoutes?: readonly SponsorRouteKey[];
  rotationWeight?: number;
};

function isWithinDateWindow(startsAt?: string, endsAt?: string): boolean {
  const now = Date.now();
  if (startsAt) {
    const start = Date.parse(startsAt);
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

export function isCampaignActive(campaign: SponsorCampaign): boolean {
  return (
    campaign.status === "active" &&
    isWithinDateWindow(campaign.startsAt, campaign.endsAt)
  );
}

export function getActiveCampaignForPlacement(
  placementId: SponsorPlacementId,
  campaigns: readonly SponsorCampaign[] = ALL_SPONSOR_CAMPAIGNS,
): SponsorCampaign | null {
  const active = campaigns
    .filter((c) => isCampaignActive(c) && c.placements.includes(placementId))
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

  return active[0] ?? null;
}

export function getActiveCampaigns(
  campaigns?: readonly SponsorCampaign[],
): SponsorCampaign[] {
  return (campaigns ?? ALL_SPONSOR_CAMPAIGNS).filter(isCampaignActive);
}

// ============================================================
// TAYLORA — canonical first sponsor campaign
// ============================================================
/**
 * Copy contract: every claim below is supported by the current public
 * partner website (audited 2026-08-07):
 *  - Taylora  → https://discover.taylora.com/it/
 *  - OnWeb24  → https://onweb24.com
 *  - ZapLater → https://www.zaplater.com/it
 * Do not add capabilities that the partner site does not state.
 */
export const TAYLORA_CAMPAIGN: SponsorCampaign = {
  id: "taylora-v1-2026",
  sponsorId: "taylora",
  toolSlug: "taylora",
  name: "Taylora",
  logo: null,
  eyebrow: "Formazione digitale",
  headline:
    "Onboarding digitale, procedure e formazione obbligatoria in un'unica piattaforma.",
  description:
    "Corsi pronti su Sicurezza, GDPR e AI Act, procedure digitalizzate e percorsi di onboarding replicabili: ogni completamento è tracciato, ogni certificato è automatico.",
  contextualReason:
    "Partner selezionato per chi organizza conoscenza e formazione del team: percorsi strutturati, tracciamento dei completamenti e report pronti per ogni audit.",
  ctaLabel: "Scopri Taylora",
  destinationUrl: "https://discover.taylora.com/it/",
  disclosure: "Partner di TooolVibes",
  placements: ["home-partner-spotlight", "archive-sponsored-tool"],
  status: "active",
  startsAt: "2026-08-01",
  priority: 1,
  rotationWeight: 1,
  utmCampaign: "taylora",
  creativeVariant: "taylora-flow",
  creativeTheme: {
    accentPrimary: "gold",
    accentSecondary: "cyan",
    motif: "flow",
    monogram: "T",
  },
  brandAsset: {
    src: "/partners/taylora/taylora-brand-plate.webp",
    srcPng: "/partners/taylora/taylora-brand-plate.png",
    width: 1774,
    height: 887,
    alt: "Taylora",
    fit: "contain",
  },
  contextTags: [
    "onboarding",
    "formazione",
    "procedure",
    "procedures",
    "training",
    "learning",
    "conoscenza",
    "knowledge",
    "hr",
    "hse",
    "operations",
    "team",
    "employee",
    "corporate",
    "compliance",
    "audit",
    "certificati",
  ],
  categoryTags: ["productivity"],
  preferredRoutes: ["home", "archivio", "tool-detail", "posts", "collections"],
};

export const ONWEB24_CAMPAIGN: SponsorCampaign = {
  id: "onweb24-v1-2026",
  sponsorId: "onweb24",
  name: "OnWeb24",
  logo: null,
  eyebrow: "Siti web done-for-you",
  headline:
    "Il sito web che ti porta clienti: bello, velocissimo, pronto in 24 ore.",
  description:
    "Rispondi a poche domande: design, copy, SEO tecnico, performance e integrazioni li gestisce il team OnWeb24. Hosting e dominio inclusi, disdici quando vuoi.",
  contextualReason:
    "Partner selezionato per chi sta valutando come costruire la propria presenza online: un sito completo — design, copy, SEO e sistema di contatto — realizzato dal team OnWeb24.",
  ctaLabel: "Scopri OnWeb24",
  destinationUrl: "https://onweb24.com",
  disclosure: "Partner di TooolVibes",
  placements: ["home-partner-spotlight", "archive-sponsored-tool"],
  status: "active",
  startsAt: "2026-08-07",
  priority: 1,
  rotationWeight: 1,
  utmCampaign: "onweb24",
  creativeVariant: "onweb24-build",
  creativeTheme: {
    accentPrimary: "violet",
    accentSecondary: "cyan",
    motif: "pipeline",
    monogram: "O",
  },
  brandAsset: {
    src: "/partners/onweb24/onweb24-brand-plate.webp",
    srcPng: "/partners/onweb24/onweb24-brand-plate.png",
    width: 1774,
    height: 887,
    alt: "OnWeb24",
    fit: "contain",
  },
  contextTags: [
    "sito",
    "siti web",
    "website",
    "web builder",
    "landing",
    "landing page",
    "cms",
    "seo",
    "conversione",
    "conversioni",
    "presenza online",
    "web design",
    "web development",
    "business website",
  ],
  categoryTags: ["website-builder", "no-code", "ui-builder", "headless-cms"],
  preferredRoutes: ["home", "archivio", "tool-detail", "posts", "collections"],
};

export const ZAPLATER_CAMPAIGN: SponsorCampaign = {
  id: "zaplater-v1-2026",
  sponsorId: "zaplater",
  name: "ZapLater",
  logo: null,
  eyebrow: "WhatsApp scheduling",
  headline:
    "Scrivi ora, invia quando conta: messaggi WhatsApp programmati.",
  description:
    "Programmi il messaggio e scegli quando: invio singolo, ricorrente o nei gruppi. ZapLater lo consegna al momento giusto.",
  contextualReason:
    "Partner selezionato per chi coordina community, clienti o promemoria su WhatsApp: invio programmato, anche ricorrente e nei gruppi.",
  ctaLabel: "Scopri ZapLater",
  destinationUrl: "https://www.zaplater.com/it",
  disclosure: "Partner di TooolVibes",
  placements: ["home-partner-spotlight", "archive-sponsored-tool"],
  status: "active",
  startsAt: "2026-08-07",
  priority: 1,
  rotationWeight: 1,
  utmCampaign: "zaplater",
  creativeVariant: "zaplater-schedule",
  creativeTheme: {
    accentPrimary: "cyan",
    accentSecondary: "violet",
    motif: "timeline",
    monogram: "Z",
  },
  brandAsset: {
    src: "/partners/zaplater/zaplater-brand-plate.webp",
    srcPng: "/partners/zaplater/zaplater-brand-plate.png",
    width: 1774,
    height: 887,
    alt: "ZapLater",
    fit: "contain",
  },
  contextTags: [
    "whatsapp",
    "messaging",
    "communication",
    "scheduling",
    "scheduled",
    "recurring",
    "reminder",
    "reminders",
    "promemoria",
    "groups",
    "community",
    "comunità",
    "chat",
    "messaggi",
  ],
  categoryTags: [
    "customer-support",
    "sales",
    "ai-agents",
  ],
  preferredRoutes: ["home", "archivio", "tool-detail", "posts", "collections"],
};

export const ALL_SPONSOR_CAMPAIGNS: readonly SponsorCampaign[] = [
  TAYLORA_CAMPAIGN,
  ONWEB24_CAMPAIGN,
  ZAPLATER_CAMPAIGN,
];

// ============================================================
// PLACEMENT ID → legacy monetization placement key mapping
// ============================================================
export const SPONSOR_TO_MONETIZATION_KEY: Record<
  SponsorPlacementId,
  string
> = {
  "home-partner-spotlight": "home-featured-tool",
  "archive-sponsored-tool": "catalog-native-sponsor",
  "tool-detail-partner": "tool-sponsored-alternative",
  "collections-partner": "collection-native-sponsor",
  "article-partner": "guide-inline-promo",
};
