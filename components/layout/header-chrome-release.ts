/**
 * BATCH 30 — Release flag del chrome di navigazione (header v2 / bottom nav),
 * con le stesse semantics di parsing del registry B04
 * (`lib/config/release-features.ts`) e delle flag B29: flag booleana via env,
 * default esplicito, errore su valori non booleani.
 *
 * `headerAccountAware` (default `true`) attiva il selector account-aware del
 * chrome (IA-502); impostando `TOOOLVIBES_HEADER_ACCOUNT_AWARE_ENABLED=0` i
 * consumer tornano all'adapter legacy pre-B30 (CTA statica
 * "Accedi / Registrati", bottom nav con solo badge Confronto).
 *
 * Come per le flag B29, le variabili env non pubbliche non sono inline nel
 * bundle client: lì valgono i default; i consumer client ricevono una release
 * diversa solo in test (mock del modulo) o da un wrapper server futuro.
 *
 * Il modulo vive in `components/layout/` (superficie B30): il registry B04 in
 * `lib/config/` resta di proprietà di altri batch.
 */

export type HeaderChromeReleaseEnvironment = Readonly<
  Record<string, string | undefined>
>;

export const HEADER_ACCOUNT_AWARE_ENV_KEY =
  "TOOOLVIBES_HEADER_ACCOUNT_AWARE_ENABLED";

export class HeaderChromeReleaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeaderChromeReleaseConfigError";
  }
}

function parseBooleanFlag(value: string | undefined, defaultEnabled: boolean) {
  if (value === undefined || value.trim() === "") {
    return defaultEnabled;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "on", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "off", "no"].includes(normalized)) {
    return false;
  }

  throw new HeaderChromeReleaseConfigError(
    `${HEADER_ACCOUNT_AWARE_ENV_KEY} must be a boolean flag (true/false or 1/0).`,
  );
}

export type HeaderChromeRelease = Readonly<{
  headerAccountAware: boolean;
}>;

export function resolveHeaderChromeRelease(
  environment: HeaderChromeReleaseEnvironment = {},
): HeaderChromeRelease {
  return Object.freeze({
    headerAccountAware: parseBooleanFlag(
      environment[HEADER_ACCOUNT_AWARE_ENV_KEY],
      true,
    ),
  });
}

export function readHeaderChromeReleaseEnvironment(): HeaderChromeReleaseEnvironment {
  // Allowlist esplicita: nessun altro valore env viene letto.
  return {
    [HEADER_ACCOUNT_AWARE_ENV_KEY]: process.env[HEADER_ACCOUNT_AWARE_ENV_KEY],
  };
}

export const headerChromeRelease = resolveHeaderChromeRelease(
  readHeaderChromeReleaseEnvironment(),
);
