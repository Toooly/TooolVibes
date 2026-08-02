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
    active: false,
    placementId: "home-featured-tool",
    sponsorLabel: "Partner editoriale",
    name: "",
    logo: null,
    image: null,
    description: "",
    href: "",
    cta: "",
    trackingId: "tv-home-featured",
    startDate: null,
    endDate: null,
  },
  "catalog-native-sponsor": {
    active: false,
    placementId: "catalog-native-sponsor",
    sponsorLabel: "Sponsor",
    name: "",
    logo: null,
    image: null,
    description: "",
    href: "",
    cta: "",
    trackingId: "tv-catalog-native",
    startDate: null,
    endDate: null,
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
};

export type PublicMonetizationPlacement = MonetizationPlacement & {
  status: "ready";
  visible: true;
  partner: MonetizationPartnerIdentity;
  editorialReason: string;
};

export const monetizationPlacements = [
  {
    key: "home-featured-tool",
    placementId: "home-featured-tool",
    surface: "Homepage",
    format: "Featured tool nativo",
    packageName: "Homepage spotlight",
    label: "Partner editoriale",
    title: "Slot partner in home (demo sviluppo).",
    body: "Placement di lancio per validare layout, disclosure e CTA. Non è una sponsorizzazione pubblicata di un brand reale.",
    description:
      "Placement di lancio per validare layout, disclosure e CTA. Non è una sponsorizzazione pubblicata di un brand reale.",
    ctaLabel: "Scopri come funziona",
    href: "/affiliati",
    status: "ready",
    active: true,
    visible: true,
    priority: 1,
    audience: "Utenti in esplorazione sulla home.",
    trackingId: "tv-home-featured-demo",
    partner: {
      name: "Demo Partner Home",
      category: "Dato di sviluppo",
      href: "/affiliati",
      isDemo: true,
    },
    editorialReason:
      "Record demo per il launch: mostra come appare un partner editoriale in home senza fingere un brand reale.",
  },
  {
    key: "catalog-native-sponsor",
    placementId: "catalog-native-sponsor",
    surface: "Catalogo",
    format: "Placement categoria",
    packageName: "Category native",
    label: "Sponsor",
    title: "Partner contestuale nel catalogo (demo sviluppo).",
    body: "Placement nativo nel flusso di scoperta. Contenuto di sviluppo chiaramente etichettato, non un brand inventato presentato come sponsor reale.",
    description:
      "Placement nativo nel flusso di scoperta. Contenuto di sviluppo chiaramente etichettato, non un brand inventato presentato come sponsor reale.",
    ctaLabel: "Vedi i pacchetti",
    href: "/affiliati",
    status: "ready",
    active: true,
    visible: true,
    priority: 2,
    audience: "Utenti che filtrano e confrontano tool nel catalogo.",
    trackingId: "tv-catalog-native-demo",
    partner: {
      name: "Demo Partner Catalogo",
      category: "Dato di sviluppo",
      href: "/affiliati",
      isDemo: true,
    },
    editorialReason:
      "Serve a verificare densità, disclosure e responsive del catalogo prima del go-live commerciale.",
  },
  {
    key: "guide-inline-promo",
    surface: "Guide e articoli",
    format: "Box promo in lettura",
    packageName: "Guide native box",
    label: "Lettura partner",
    title: "Un box promo coerente con il tema della guida.",
    body: "Pensato per guide, tutorial e contenuti editoriali: dichiarato, contestuale e con copy utile invece di banner generico.",
    ctaLabel: "Apri partnership",
    href: "/affiliati",
    status: "reserved",
    active: false,
    visible: true,
    priority: 3,
    audience: "Prodotti che risolvono il problema trattato nella guida.",
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
    key: "tool-sponsored-alternative",
    placementId: "tool-sponsored-alternative",
    surface: "Scheda tool",
    format: "Alternativa sponsorizzata",
    packageName: "Tool profile native",
    label: "Contenuto sponsorizzato",
    title: "Alternativa partner in scheda tool (demo sviluppo).",
    body: "Placement contestuale su scheda tool / confronto. Demo di sviluppo con disclosure esplicita, senza brand finti presentati come sponsor reali.",
    description:
      "Placement contestuale su scheda tool / confronto. Demo di sviluppo con disclosure esplicita, senza brand finti presentati come sponsor reali.",
    ctaLabel: "Come diventare partner",
    href: "/affiliati",
    status: "ready",
    active: true,
    visible: true,
    priority: 5,
    audience: "Utenti in fase di decisione su una scheda tool.",
    trackingId: "tv-tool-alternative-demo",
    partner: {
      name: "Demo Partner Tool",
      category: "Dato di sviluppo",
      href: "/affiliati",
      isDemo: true,
    },
    editorialReason:
      "Valida layout, CTA e fallback su scheda tool e superfici di decisione prima dell'inventory commerciale reale.",
  },
  {
    key: "collection-native-sponsor",
    surface: "Raccolte",
    format: "Sponsor di raccolta",
    packageName: "Collection sponsor",
    label: "Partner raccolta",
    title: "Sponsorship nativa dentro una raccolta curata.",
    body: "Adatta a speciali verticali, selezioni premium e percorsi tematici con sponsor coerente al contesto.",
    ctaLabel: "Parla con TooolVibes",
    href: "/affiliati",
    status: "reserved",
    active: false,
    visible: true,
    priority: 6,
    audience: "Brand che vogliono presidiare una verticale editoriale.",
  },
  {
    key: "newsletter-placement",
    surface: "Newsletter",
    format: "Blocco newsletter",
    packageName: "Newsletter native",
    label: "Slot newsletter",
    title: "Un placement pronto per quando parte la newsletter.",
    body: "Lo spazio e' gia' mappato nell'inventory, cosi' puo' entrare nei pacchetti founder senza ridisegnare l'offerta.",
    ctaLabel: "Prenota slot",
    href: "/affiliati",
    status: "planned",
    active: false,
    visible: false,
    priority: 7,
    audience: "Sponsor che cercano reach ricorrente e contesto editoriale.",
  },
] as const satisfies readonly MonetizationPlacement[];

export type MonetizationPlacementKey = (typeof monetizationPlacements)[number]["key"];

export function getMonetizationPlacement(key: MonetizationPlacementKey): MonetizationPlacement | undefined {
  return monetizationPlacements.find((placement) => placement.key === key);
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
  // Same-site relative paths are valid for internal partner CTAs / demo slots.
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

function isWithinFlightWindow(placement: MonetizationPlacement) {
  const now = Date.now();
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
 * Demo partners remain allowed only while explicitly labeled (Demo / isDemo).
 */
export function isPublicMonetizationPlacement(
  placement: MonetizationPlacement | undefined,
): placement is PublicMonetizationPlacement {
  if (!placement) return false;
  if (placement.active === false) return false;
  if (!isWithinFlightWindow(placement)) return false;

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
