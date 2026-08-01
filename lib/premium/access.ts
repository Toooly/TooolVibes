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

export function resolveCollectionPremiumAccess(
  _access: CollectionAccess,
  options: {
    entitlement?: PremiumEntitlementStatus;
    surface?: CollectionSurface;
  } = {},
): ResolvedCollectionPremiumAccess {
  const entitlement = options.entitlement ?? "guest";

  // Historical records still carry legacy access values, but V1 deliberately
  // ships every public collection as a complete, ungated editorial resource.
  return {
    tier: "free",
    entitlement,
    state: "open",
    label: "Raccolta aperta",
    subtle_label: "Aperta",
    chip_label: "Accesso aperto",
    description: "La raccolta è interamente leggibile: tool, punti chiave e percorso sono già disponibili.",
    entry_label: "Apri raccolta",
    upgrade_label: "Apri raccolta",
    upgrade_href: "#collection-content",
    is_premium: false,
    is_previewable: false,
    is_locked: false,
    has_full_access: true,
    preview_tool_limit: 999,
    preview_highlight_limit: 999,
  };
}

export function getPremiumEntitlementMeta(
  status: PremiumEntitlementStatus,
): PremiumEntitlementMeta {
  if (status === "member") {
    return {
      status,
      tier: "free",
      label: "Account con selezione sincronizzata",
      short_label: "Account",
      description:
        "Puoi passare da archivio, raccolte e selezione personale senza perdere il filo.",
      badge: "Account attivo",
      cta_label: "Apri raccolte",
      cta_href: "/collections",
    };
  }

  if (status === "account") {
    return {
      status,
      tier: "free",
      label: "Account attivo",
      short_label: "Account",
      description:
        "La tua selezione può già seguire il tuo account tra archivio, raccolte e salvati.",
      badge: "Account attivo",
      cta_label: "Apri raccolte",
      cta_href: "/collections",
    };
  }

  return {
    status,
    tier: "free",
    label: "Esplora senza limiti",
    short_label: "Visitatore",
    description:
      "Puoi usare archivio, salvati, confronto e raccolte senza attrito.",
    badge: "Accesso aperto",
    cta_label: "Apri raccolte",
    cta_href: "/collections",
  };
}
