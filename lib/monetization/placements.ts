export type MonetizationStatus = "ready" | "reserved" | "planned";

export type MonetizationPartnerIdentity = {
  name: string;
  category: string;
  href: string;
};

export type MonetizationPlacement = {
  key: string;
  surface: string;
  format: string;
  packageName: string;
  label: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  status: MonetizationStatus;
  visible: boolean;
  priority: number;
  audience: string;
  partner?: MonetizationPartnerIdentity;
  editorialReason?: string;
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
    surface: "Homepage",
    format: "Featured tool nativo",
    packageName: "Homepage spotlight",
    label: "Spazio partner",
    title: "Uno slot per tool che meritano una prova vera.",
    body: "Pensato per un tool sponsorizzato ma curato come contenuto TooolVibes: promessa chiara, contesto editoriale e passaggio naturale al profilo.",
    ctaLabel: "Proponi partnership",
    href: "/affiliati",
    status: "reserved",
    visible: true,
    priority: 1,
    audience: "Founder, SaaS e tool AI con fit editoriale forte.",
  },
  {
    key: "catalog-native-sponsor",
    surface: "Catalogo",
    format: "Placement categoria",
    packageName: "Category native",
    label: "Partner editoriale",
    title: "Un ingresso sponsorizzato dentro il flusso di scoperta.",
    body: "Lo slot resta vicino a filtri e categorie, utile per promuovere un tool senza interrompere la ricerca dell'utente.",
    ctaLabel: "Scopri i pacchetti",
    href: "/affiliati",
    status: "reserved",
    visible: true,
    priority: 2,
    audience: "Tool che vogliono presidiare una categoria o un caso d'uso.",
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
    visible: true,
    priority: 4,
    audience: "Sponsor con contenuto, demo o risorsa da collegare alla lettura.",
  },
  {
    key: "tool-sponsored-alternative",
    surface: "Scheda tool",
    format: "Alternativa sponsorizzata",
    packageName: "Tool profile native",
    label: "Alternativa partner",
    title: "Uno spazio per alternative sponsorizzate ma dichiarate.",
    body: "Compare vicino al profilo del tool, con una logica di confronto e scelta. Non sostituisce la selezione editoriale.",
    ctaLabel: "Richiedi listing",
    href: "/affiliati",
    status: "reserved",
    visible: true,
    priority: 5,
    audience: "Tool concorrenti o complementari con proposta chiara.",
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
    visible: false,
    priority: 7,
    audience: "Sponsor che cercano reach ricorrente e contesto editoriale.",
  },
] as const satisfies readonly MonetizationPlacement[];

export type MonetizationPlacementKey = (typeof monetizationPlacements)[number]["key"];

export function getMonetizationPlacement(key: MonetizationPlacementKey): MonetizationPlacement | undefined {
  return monetizationPlacements.find((placement) => placement.key === key);
}

/**
 * Reserved and planned inventory belongs to the commercial back office, not
 * to the public reading journey. A placement is public only when a real
 * partner identity and an explicit editorial-relevance reason are present.
 */
export function isPublicMonetizationPlacement(
  placement: MonetizationPlacement | undefined,
): placement is PublicMonetizationPlacement {
  return Boolean(
    placement?.visible &&
      placement.status === "ready" &&
      placement.partner?.name &&
      placement.partner.href &&
      placement.editorialReason,
  );
}

export function getMonetizationPlacementStats() {
  const placements: readonly MonetizationPlacement[] = monetizationPlacements;
  const total = placements.length;
  const visible = placements.filter((placement) => placement.visible).length;
  const ready = placements.filter((placement) => placement.status === "ready").length;
  const reserved = placements.filter((placement) => placement.status === "reserved").length;
  const planned = placements.filter((placement) => placement.status === "planned").length;

  return { total, visible, ready, reserved, planned };
}
