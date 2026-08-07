import type { SponsorCreativeTheme } from "@/lib/sponsors/sponsor-placements";

/**
 * Maps a campaign creative theme to the CSS theme block key consumed via
 * `data-partner-theme` on the placement shell. Returns undefined when the
 * campaign carries no theme, so the neutral treatment applies.
 *
 * Pure helper — safe to import from Server Components and client modules.
 */
export function partnerThemeKey(
  theme?: SponsorCreativeTheme,
): string | undefined {
  if (!theme?.accentPrimary) return undefined;
  return theme.accentSecondary
    ? `${theme.accentPrimary}-${theme.accentSecondary}`
    : theme.accentPrimary;
}
