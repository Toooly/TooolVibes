import type { LucideIcon } from "lucide-react";

import type { NavReleaseFlagKey } from "./release";

/**
 * Tipi per la navigazione pubblica: ogni destinazione è descritta una sola
 * volta nel registry e risolta dai consumer tramite i selector.
 */

export const NAV_AUDIENCES = ["public", "admin"] as const;
export type NavAudience = (typeof NAV_AUDIENCES)[number];

export const NAV_DESTINATION_KINDS = ["route", "facet", "external"] as const;
export type NavDestinationKind = (typeof NAV_DESTINATION_KINDS)[number];

export const NAV_SCOPES = ["primary", "secondary"] as const;
export type NavScope = (typeof NAV_SCOPES)[number];

/**
 * Superfici di navigazione: ogni lista renderizzata da un consumer ha una
 * surface dedicata, così owner/placement/ordine di ogni destinazione sono
 * univoci e riproducibili.
 */
export const NAV_SURFACES = [
  "header-v2-desktop",
  "bottom-nav",
  "footer-v2-product",
  "footer-v2-company",
  "footer-v2-legal",
  "footer-v2-social",
] as const;
export type NavSurface = (typeof NAV_SURFACES)[number];

/** Tripla cromatica disponibile per eventuali consumer mobili. */
export type NavTone = readonly [string, string, string];

export type NavPlacement = Readonly<{
  surface: NavSurface;
  /** Ordine di rendering nella surface (0-based, univoco per surface). */
  order: number;
  /** Override di label riservato a una surface specifica. */
  label?: string;
  /** Icona lucide specifica della surface (cambia da consumer a consumer). */
  icon?: LucideIcon;
  tone?: NavTone;
}>;

export type NavDestination = Readonly<{
  /** Identificativo stabile, usato da test e lookup (es. "catalog"). */
  id: string;
  /**
   * route = pagina interna di `app/`; facet = shortcut filtrata del catalogo;
   * external = URL esterno (http/mailto), escluso dal broken-link check.
   */
  kind: NavDestinationKind;
  href: string;
  /** Label canonica (IA-501: Catalogo/Salvati/Confronto univoche). */
  label: string;
  /** Owner unico della destinazione (team responsabile). */
  owner: string;
  audience: NavAudience;
  /** KPI dichiarato (IA-503: ogni route ha owner, KPI e release status). */
  kpi: string;
  /** Release flag univoca della destinazione (vedi ./release.ts). */
  releaseFlag: NavReleaseFlagKey;
  scope: NavScope;
  /** Decisione IA-503 documentata (keep/preview/noindex…), in italiano. */
  scopeDecision: string;
  /**
   * Proposta di cambio visibilità NON applicata in questo batch: registrata
   * qui perché resti tracciata e reversibile.
   */
  proposal?: string;
  placements: readonly NavPlacement[];
}>;
