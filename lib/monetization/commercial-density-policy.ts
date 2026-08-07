/**
 * Canonical commercial density policy for TooolVibes inventory.
 *
 * Priority (highest first):
 *   1. Paid contextual / curated Partner Experience
 *   2. TinyAdz programmatic inventory (one effective exposure)
 *   3. Open Slot / sponsor acquisition
 *
 * Geometry notes (measured 2026-08-07, production build):
 *   - Existing TinyAdz inline slot paints ~896px wide in content flow.
 *   - Outside-content gutters at 1440–1920 never reach 896px on any
 *     eligible route; even the widest measured usable gutter (~395px on
 *     long-form at 1920) cannot host the current creative without a new
 *     format. Desktop rail is therefore DISABLED.
 *   - Minimum natural edge-to-edge separation between two main-flow
 *     commercial units: ~600px desktop / ~480px mobile. Prefer a full
 *     semantic section; never invent empty spacer blocks.
 */

export const COMMERCIAL_PRIORITY = [
  "paid-partner",
  "tinyadz",
  "open-slot",
] as const;

export type CommercialPriorityKind = (typeof COMMERCIAL_PRIORITY)[number];

/** Desktop main-flow separation target (px, edge-to-edge). */
export const MIN_MAIN_FLOW_SEPARATION_DESKTOP_PX = 600;

/** Mobile main-flow separation target (px, edge-to-edge). */
export const MIN_MAIN_FLOW_SEPARATION_MOBILE_PX = 480;

/** Pages shorter than this prefer a single commercial interruption. */
export const SHORT_PAGE_HEIGHT_PX = 2200;

/**
 * Minimum usable outside-content gutter (px) before a rail may be considered.
 * Still insufficient alone — the active creative must also fit.
 */
export const RAIL_MIN_USABLE_GUTTER_PX = 280;

/**
 * Measured width of the current TinyAdz inline creative/slot in content flow.
 * A gutter rail would need at least this width to host the same creative
 * without inventing a new format.
 */
export const TINYADZ_INLINE_CREATIVE_WIDTH_PX = 896;

/**
 * Desktop rail is not active: no route provides an outside-content gutter
 * that can host the existing TinyAdz creative without shrinking content or
 * inventing a new ad format.
 */
export const TINYADZ_DESKTOP_RAIL_ENABLED = false;

/**
 * Archive organic insertion indexes (must divide 2-col and 3-col grids).
 * Partner after 6 organics; TinyAdz after 18 organics → 12 organics between
 * the two units so edge-to-edge separation clears the desktop target without
 * artificial empty spacing.
 */
export const ARCHIVE_PARTNER_AFTER_ORGANIC = 6;
export const ARCHIVE_TINYADZ_AFTER_ORGANIC = 18;

/** Archive first-paint organic batch must exceed ARCHIVE_TINYADZ_AFTER_ORGANIC. */
export const ARCHIVE_INITIAL_VISIBLE_ORGANIC = 24;

/**
 * Whether a desktop gutter rail may host the current TinyAdz creative.
 * Deterministic pure helper for tests and future activation gates.
 */
export function isTinyAdzRailGeometryEligible(input: {
  viewportWidth: number;
  usableGutterPx: number;
  creativeWidthPx?: number;
  railEnabled?: boolean;
}): boolean {
  if (!(input.railEnabled ?? TINYADZ_DESKTOP_RAIL_ENABLED)) return false;
  if (input.viewportWidth < 1440) return false;
  const creative = input.creativeWidthPx ?? TINYADZ_INLINE_CREATIVE_WIDTH_PX;
  return (
    input.usableGutterPx >= RAIL_MIN_USABLE_GUTTER_PX &&
    input.usableGutterPx >= creative
  );
}

/**
 * When a paid Partner Experience is present on a medium/short reading surface,
 * TinyAdz yields — PE is higher-value inventory and the two units would share
 * a short vertical band.
 */
export function shouldSuppressTinyAdzForPaidPartner(input: {
  hasPaidPartner: boolean;
  surface: "home" | "archivio" | "tool-detail" | "posts" | "radar" | "collections" | "other";
  /** Estimated/known main-flow separation in px; omit when unknown. */
  estimatedSeparationPx?: number;
  pageHeightPx?: number;
}): boolean {
  if (!input.hasPaidPartner) return false;

  if (input.surface === "posts") {
    /* Long-form: TinyAdz sits above the article body, PE after it. On the
       representative guide the measured gap is < desktop target while both
       remain in a medium-length page — PE wins. */
    return true;
  }

  if (
    input.estimatedSeparationPx != null &&
    input.estimatedSeparationPx < MIN_MAIN_FLOW_SEPARATION_DESKTOP_PX
  ) {
    /* Tool-detail keeps both when separation is naturally large; home keeps
       both at MEDIUM pressure with section-level structure. Only suppress
       when an explicit sub-target separation is known for a dual-mount
       surface that is not home/tool-detail. */
    if (input.surface === "archivio") return false; /* fixed via deeper insert */
    if (input.surface === "home" || input.surface === "tool-detail") return false;
    return true;
  }

  if (
    input.pageHeightPx != null &&
    input.pageHeightPx < SHORT_PAGE_HEIGHT_PX &&
    input.surface !== "home"
  ) {
    return true;
  }

  return false;
}

/**
 * Open Slot is the lowest-priority interruption. On short pages it yields to
 * TinyAdz when both would mount.
 */
export function shouldSuppressOpenSlotForTinyAdz(input: {
  hasTinyAdz: boolean;
  pageHeightPx?: number;
}): boolean {
  if (!input.hasTinyAdz) return false;
  if (input.pageHeightPx != null && input.pageHeightPx < SHORT_PAGE_HEIGHT_PX) {
    return true;
  }
  return false;
}
