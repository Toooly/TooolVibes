/**
 * TinyAdz publisher integration configuration.
 *
 * All values are read from `NEXT_PUBLIC_*` env vars. Next.js statically inlines
 * `NEXT_PUBLIC_*` references at build time, so this module is safe to import
 * from both server and client code. The site id is a public publisher
 * identifier supplied by the TinyAdz owner dashboard — it is not a secret.
 *
 * Safety posture:
 *  - The whole integration is behind a feature flag that defaults to OFF.
 *  - The site id defaults to null; without it no script is ever rendered.
 *  - Test mode defaults to "true" so a fresh environment can never silently
 *    serve live advertising without an explicit opt-in.
 */

export const TINYADZ_SCRIPT_URL =
  "https://cdn.apitiny.net/scripts/v2.0/main.js";

export const TINYADZ_SCRIPT_ID = "tinyadz-v2";

export const TINYADZ_ENABLED_ENV = "NEXT_PUBLIC_TINYADZ_ENABLED";
export const TINYADZ_SITE_ID_ENV = "NEXT_PUBLIC_TINYADZ_SITE_ID";
export const TINYADZ_TEST_MODE_ENV = "NEXT_PUBLIC_TINYADZ_TEST_MODE";

const TRUE_VALUES = new Set(["1", "true", "on", "yes"]);
const FALSE_VALUES = new Set(["0", "false", "off", "no"]);

export type TinyAdzEnvironment = Readonly<{
  [TINYADZ_ENABLED_ENV]?: string;
  [TINYADZ_SITE_ID_ENV]?: string;
  [TINYADZ_TEST_MODE_ENV]?: string;
}>;

export type TinyAdzConfig = Readonly<{
  enabled: boolean;
  siteId: string | null;
  testMode: "true" | "false";
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
  const enabled = parseFlag(environment[TINYADZ_ENABLED_ENV], false);
  const siteId = environment[TINYADZ_SITE_ID_ENV]?.trim() || null;
  const testMode =
    parseFlag(environment[TINYADZ_TEST_MODE_ENV], true) ? "true" : "false";

  return Object.freeze({ enabled, siteId, testMode });
}

const TINYADZ_EXCLUDED_PATH_PREFIXES: readonly string[] = [
  "/account",
  "/compare",
  "/privacy",
  "/termini",
  "/cookie",
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
