import type {
  CollectionAccess,
  CollectionSurface,
  PremiumEntitlementStatus,
  PremiumEntitlementTier,
  PremiumSurfaceState,
} from "@/lib/types/collection";

type ResolvedCollectionPremiumAccess = {
  tier: PremiumEntitlementTier;
  entitlement: PremiumEntitlementStatus;
  state: PremiumSurfaceState;
  label: string;
  subtle_label: string;
  chip_label: string;
  description: string;
  entry_label: string;
  upgrade_label: string;
  upgrade_href: string;
  is_premium: boolean;
  is_previewable: boolean;
  is_locked: boolean;
  has_full_access: boolean;
  preview_tool_limit: number;
  preview_highlight_limit: number;
};

type PremiumEntitlementMeta = {
  status: PremiumEntitlementStatus;
  tier: PremiumEntitlementTier;
  label: string;
  short_label: string;
  description: string;
  badge: string;
  cta_label: string;
  cta_href: string;
};

const PREMIUM_ACCESS_HREF = "/account#member-access";

export function resolveCollectionPremiumAccess(
  access: CollectionAccess,
  {
    entitlement = "guest",
    surface = "collection",
  }: {
    entitlement?: PremiumEntitlementStatus;
    surface?: CollectionSurface;
  } = {},
): ResolvedCollectionPremiumAccess {
  const previewToolLimit = surface === "special-issue" ? 3 : 2;
  const previewHighlightLimit = surface === "special-issue" ? 3 : 2;

  if (access === "open") {
    return {
      tier: "free",
      entitlement,
      state: "open",
      label: "Collection aperta",
      subtle_label: "Aperta",
      chip_label: "Accesso aperto",
      description: "La collection resta interamente leggibile: tool, highlights e percorso sono già aperti.",
      entry_label: "Apri collection completa",
      upgrade_label: "Apri collection completa",
      upgrade_href: "#collection-content",
      is_premium: false,
      is_previewable: false,
      is_locked: false,
      has_full_access: true,
      preview_tool_limit: 999,
      preview_highlight_limit: 999,
    };
  }

  if (access === "premium-preview") {
    return {
      tier: "member",
      entitlement,
      state: entitlement === "member" ? "unlocked" : "preview",
      label: entitlement === "member" ? "Accesso member" : "Preview premium",
      subtle_label: entitlement === "member" ? "Sbloccata" : "Anteprima",
      chip_label: entitlement === "member" ? "Accesso member" : "Accesso preview",
      description:
        entitlement === "member"
          ? "La collection ? disponibile per intero, con tutti i tool, gli highlight e il framing curatoriale completo."
          : "La preview lascia vedere il percorso, i primi tool e gli highlight chiave. Il layer member aggiunge il resto della lettura e i moduli più densi.",
      entry_label: entitlement === "member" ? "Apri issue completa" : "Apri preview",
      upgrade_label: entitlement === "member" ? "Apri issue completa" : "Vedi cosa sblocchi",
      upgrade_href: entitlement === "member" ? "#collection-content" : PREMIUM_ACCESS_HREF,
      is_premium: true,
      is_previewable: true,
      is_locked: false,
      has_full_access: entitlement === "member",
      preview_tool_limit: previewToolLimit,
      preview_highlight_limit: previewHighlightLimit,
    };
  }

  return {
    tier: "member",
    entitlement,
    state: entitlement === "member" ? "unlocked" : "locked",
    label: entitlement === "member" ? "Accesso member" : "Member issue",
    subtle_label: entitlement === "member" ? "Sbloccata" : "Riservata",
    chip_label: entitlement === "member" ? "Accesso member" : "Issue riservata",
    description:
      entitlement === "member"
        ? "La special issue ? disponibile per intero, compresi moduli centrali, sequencing e note member."
        : "Qui vedi il taglio della issue. Il layer completo tiene i moduli centrali, il sequencing pieno e le note member più operative.",
    entry_label: entitlement === "member" ? "Apri issue completa" : "Apri teaser",
    upgrade_label: entitlement === "member" ? "Apri issue completa" : "Vedi cosa sblocchi",
    upgrade_href: entitlement === "member" ? "#collection-content" : PREMIUM_ACCESS_HREF,
    is_premium: true,
    is_previewable: false,
    is_locked: entitlement !== "member",
    has_full_access: entitlement === "member",
    preview_tool_limit: 2,
    preview_highlight_limit: 2,
  };
}

export function getPremiumEntitlementMeta(
  status: PremiumEntitlementStatus,
): PremiumEntitlementMeta {
  if (status === "member") {
    return {
      status,
      tier: "member",
      label: "Accesso member attivo",
      short_label: "Member",
      description:
        "Preview, member issue e special issue complete sono sbloccate. Puoi passare da archivio, collection e workspace senza perdere il contesto della selezione.",
      badge: "Accesso member",
      cta_label: "Apri issue e preview",
      cta_href: "/collections",
    };
  }

  if (status === "account") {
    return {
      status,
      tier: "free",
      label: "Account pronto per l'accesso premium",
      short_label: "Account",
      description:
        "La workspace può già essere collegata a un account reale. Il layer member non è attivo, ma il confine tra open, preview e issue completa è già leggibile.",
      badge: "Sync attiva",
      cta_label: "Vedi preview e issue",
      cta_href: "/collections",
    };
  }

  return {
    status,
    tier: "free",
    label: "Preview disponibili",
    short_label: "Guest",
    description:
      "Da guest puoi usare archivio, shortlist, compare e note senza attrito. Le superfici premium mostrano il taglio e il boundary prima di chiederti un account.",
    badge: "Preview attive",
    cta_label: "Capisci cosa sblocchi",
    cta_href: PREMIUM_ACCESS_HREF,
  };
}
