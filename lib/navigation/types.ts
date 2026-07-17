import type { LucideIcon } from "lucide-react";

import type { NavReleaseFlagKey } from "./release";

/**
 * BATCH 29 — Tipi canonici della information architecture (IA-501, IA-503).
 *
 * Ogni destinazione di navigazione del sito è descritta una sola volta nel
 * registry (`./destinations.ts`) con owner, audience, KPI, scope, release flag
 * e placement univoci. I consumer (header v2, header legacy, bottom nav,
 * footer legacy, footer v2) non definiscono più liste locali: leggono item
 * risolti dai selector (`./selectors.ts`).
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
  "header-v2-mobile",
  "header-legacy-nav",
  "header-legacy-actions",
  "bottom-nav",
  "footer-nav",
  "footer-categories",
  "footer-meta",
  "footer-v2-explore",
  "footer-v2-community",
  "footer-v2-legal",
  "footer-v2-social",
] as const;
export type NavSurface = (typeof NAV_SURFACES)[number];

/** Tripla cromatica usata dai link mobile dell'header v2 (CSS vars). */
export type NavTone = readonly [string, string, string];

export type NavPlacement = Readonly<{
  surface: NavSurface;
  /** Ordine di rendering nella surface (0-based, univoco per surface). */
  order: number;
  /**
   * Override di label specifico della surface. Riproduce il copy corrente
   * dove diverge dal canonical (es. "Radar live" su header legacy,
   * "Shop digitale" su footer legacy) senza cambiare la visibilità.
   */
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
