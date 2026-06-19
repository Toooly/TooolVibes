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
      label: "Raccolta aperta",
      subtle_label: "Aperta",
      chip_label: "Accesso aperto",
      description: "La raccolta è interamente leggibile: tool, punti chiave e percorso sono già aperti.",
      entry_label: "Apri raccolta completa",
      upgrade_label: "Apri raccolta completa",
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
      label: entitlement === "member" ? "Accesso riservato" : "Anteprima premium",
      subtle_label: entitlement === "member" ? "Sbloccata" : "Anteprima",
      chip_label: entitlement === "member" ? "Accesso riservato" : "Anteprima aperta",
      description:
        entitlement === "member"
          ? "La raccolta è disponibile per intero, con tutti i tool, i punti chiave e la lettura completa."
          : "L'anteprima mostra il percorso, i primi tool e i punti chiave. L'accesso riservato aggiunge il resto della lettura e gli approfondimenti più utili.",
      entry_label: entitlement === "member" ? "Apri raccolta completa" : "Apri anteprima",
      upgrade_label: entitlement === "member" ? "Apri raccolta completa" : "Vedi cosa sblocchi",
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
    label: entitlement === "member" ? "Accesso riservato" : "Raccolta riservata",
    subtle_label: entitlement === "member" ? "Sbloccata" : "Riservata",
    chip_label: entitlement === "member" ? "Accesso riservato" : "Raccolta riservata",
    description:
      entitlement === "member"
        ? "La raccolta speciale è disponibile per intero, compresi i moduli centrali, l'ordine di lettura e le note operative."
        : "Qui vedi il taglio della raccolta. La versione completa include i moduli centrali, il percorso completo e le note più operative.",
    entry_label: entitlement === "member" ? "Apri raccolta completa" : "Apri anteprima",
    upgrade_label: entitlement === "member" ? "Apri raccolta completa" : "Vedi cosa sblocchi",
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
      label: "Accesso riservato attivo",
      short_label: "Riservato",
      description:
        "Anteprime, raccolte riservate e speciali complete sono sbloccate. Puoi passare da archivio, raccolte e selezione personale senza perdere il filo.",
      badge: "Accesso riservato",
      cta_label: "Apri raccolte e anteprime",
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
        "La tua selezione può già seguire il tuo account. L'accesso riservato non è attivo, ma puoi vedere cosa resta aperto e cosa si sblocca dopo.",
      badge: "Account attivo",
      cta_label: "Vedi anteprime e raccolte",
      cta_href: "/collections",
    };
  }

  return {
    status,
    tier: "free",
    label: "Anteprime disponibili",
    short_label: "Visitatore",
    description:
      "Puoi usare archivio, salvati, confronto e note senza attrito. Le raccolte premium mostrano il taglio prima di chiederti un account.",
    badge: "Anteprime attive",
    cta_label: "Capisci cosa sblocchi",
    cta_href: PREMIUM_ACCESS_HREF,
  };
}
