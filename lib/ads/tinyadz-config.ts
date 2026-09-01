/**
 * TinyAdz publisher integration configuration.
 *
 * All values are read from `NEXT_PUBLIC_*` env vars. Next.js statically inlines
 * `NEXT_PUBLIC_*` references at build time, so this module is safe to import
 * from both server and client code. The site id is a public publisher
 * identifier supplied by the TinyAdz owner dashboard — it is not a secret.
 *
 * Safety posture:
 *  - Local/test defaults stay off / test-mode on.
 *  - Production with a site id stays on (live mode) unless explicitly disabled.
 */

export const TINYADZ_SCRIPT_URL =
  "https://cdn.apitiny.net/scripts/v2.0/main.js";

export const TINYADZ_SCRIPT_ID = "tinyadz-v2";

export const TINYADZ_ENABLED_ENV = "NEXT_PUBLIC_TINYADZ_ENABLED";
export const TINYADZ_SITE_ID_ENV = "NEXT_PUBLIC_TINYADZ_SITE_ID";
export const TINYADZ_TEST_MODE_ENV = "NEXT_PUBLIC_TINYADZ_TEST_MODE";
export const TINYADZ_INLINE_WIDGET_ID_ENV = "NEXT_PUBLIC_TINYADZ_INLINE_WIDGET_ID";
export const TINYADZ_WAS_ORIGIN = "https://cdn.apitiny.net";

const TRUE_VALUES = new Set(["1", "true", "on", "yes"]);
const FALSE_VALUES = new Set(["0", "false", "off", "no"]);

export type TinyAdzEnvironment = Readonly<{
  [TINYADZ_ENABLED_ENV]?: string;
  [TINYADZ_SITE_ID_ENV]?: string;
  [TINYADZ_TEST_MODE_ENV]?: string;
  [TINYADZ_INLINE_WIDGET_ID_ENV]?: string;
}>;

export type TinyAdzConfig = Readonly<{
  enabled: boolean;
  siteId: string | null;
  testMode: "true" | "false";
  inlineWidgetId: string | null;
}>;

function parseFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }
  return defaultValue;
}

export function readTinyAdzConfig(
  environment: Readonly<Record<string, string | undefined>> = {},
): TinyAdzConfig {
  const siteId = environment[TINYADZ_SITE_ID_ENV]?.trim() || null;
  const inlineWidgetId =
    environment[TINYADZ_INLINE_WIDGET_ID_ENV]?.trim() || null;
  const production = process.env.NODE_ENV === "production";
  const enabled = parseFlag(
    environment[TINYADZ_ENABLED_ENV],
    production && Boolean(siteId),
  );
  const testMode = parseFlag(
    environment[TINYADZ_TEST_MODE_ENV],
    !production,
  )
    ? "true"
    : "false";

  return Object.freeze({ enabled, siteId, testMode, inlineWidgetId });
}

export function buildTinyAdzInlineFrameSrc(input: {
  widgetId: string;
  siteId: string;
  pageUrl: string;
  testMode: boolean;
  timeZone?: string;
}): string {
  const url = new URL(`${TINYADZ_WAS_ORIGIN}/was/${input.widgetId}`);
  url.searchParams.set("showInPopup", "false");
  url.searchParams.set("ref", input.pageUrl);
  url.searchParams.set("theme", "light");
  url.searchParams.set("renderMode", "INLINED");
  url.searchParams.set("siteId", input.siteId);
  url.searchParams.set("testMode", input.testMode ? "true" : "false");
  if (input.timeZone) {
    url.searchParams.set("timeZone", input.timeZone);
  }
  return url.toString();
}

const TINYADZ_EXCLUDED_PATH_PREFIXES: readonly string[] = [
  "/account",
  "/compare",
  "/privacy",
  "/termini",
  "/cookie",
  /* Commercial acquisition page: never programmatic advertising. */
  "/sponsorizza",
];

export function isTinyAdzEligiblePath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) {
    return false;
  }
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return !TINYADZ_EXCLUDED_PATH_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
