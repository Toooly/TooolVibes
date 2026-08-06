/**
 * Canonical first-party advertising consent layer for TooolVibes.
 *
 * There is no advertising consent system elsewhere in the app; this module is
 * the single, versioned source of truth for whether advertising (TinyAdz) may
 * run. Everything else (TinyAdzLoader, lifecycle, banner, settings) must
 * consume the state produced here.
 *
 * Values are persisted to `localStorage` (or any `Storage`-like object so the
 * logic is unit-testable). A version field guards against reading payloads
 * written by older or unknown schemas — any mismatch yields the safe default
 * `unknown`, i.e. "no consent given, nothing runs".
 *
 * Security posture:
 *  - default is `unknown`; the app must NEVER assume consent.
 *  - a grant is tokenised so a subsequent withdraw is distinguishable from a
 *    fresh unknown (the token is cleared on deny/withdraw).
 */

export type AdvertisingConsent = "unknown" | "granted" | "denied";

export const ADVERTISING_CONSENT_VERSION = 1;

export const ADVERTISING_CONSENT_STORAGE_KEY =
  "tooolvibes.advertising-consent.v1";

export type AdvertisingConsentRecord = Readonly<{
  state: AdvertisingConsent;
  version: number;
  /** Present only for a `granted` state; cleared on deny/withdraw. */
  token?: string;
  updatedAt: number;
}>;

export const ADVERTISING_CONSENT_STATES: readonly AdvertisingConsent[] = [
  "unknown",
  "granted",
  "denied",
];

export function isAdvertisingConsentState(
  value: unknown,
): value is AdvertisingConsent {
  return (
    typeof value === "string" &&
    (ADVERTISING_CONSENT_STATES as readonly string[]).includes(value)
  );
}

export function createConsentToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSupportedStorage(
  storage: Storage | null | undefined,
): storage is Storage {
  if (!storage) {
    return false;
  }
  try {
    const probe = "__tooolvibes_consent_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the persisted consent record. Any missing, malformed or future-version
 * payload resolves to `unknown` (the safe default). Never throws.
 */
export function readAdvertisingConsentRecord(
  storage: Storage | null | undefined,
): AdvertisingConsentRecord {
  if (!isSupportedStorage(storage)) {
    return { state: "unknown", version: ADVERTISING_CONSENT_VERSION, updatedAt: 0 };
  }
  try {
    const raw = storage.getItem(ADVERTISING_CONSENT_STORAGE_KEY);
    if (!raw) {
      return { state: "unknown", version: ADVERTISING_CONSENT_VERSION, updatedAt: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<AdvertisingConsentRecord>;
    if (
      parsed &&
      isAdvertisingConsentState(parsed.state) &&
      parsed.version === ADVERTISING_CONSENT_VERSION
    ) {
      return {
        state: parsed.state,
        version: ADVERTISING_CONSENT_VERSION,
        token: typeof parsed.token === "string" ? parsed.token : undefined,
        updatedAt:
          typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      };
    }
    return { state: "unknown", version: ADVERTISING_CONSENT_VERSION, updatedAt: 0 };
  } catch {
    return { state: "unknown", version: ADVERTISING_CONSENT_VERSION, updatedAt: 0 };
  }
}

export function advertisingConsentFromRecord(
  record: AdvertisingConsentRecord,
): AdvertisingConsent {
  return record.state;
}

/**
 * Persist a consent choice. A `token` is generated on `granted` and cleared for
 * `unknown`/`denied` so withdrawal invalidates the previous grant.
 */
export function writeAdvertisingConsentRecord(
  storage: Storage | null | undefined,
  state: AdvertisingConsent,
  base: AdvertisingConsentRecord = readAdvertisingConsentRecord(storage),
): AdvertisingConsentRecord {
  const record: AdvertisingConsentRecord = {
    state,
    version: ADVERTISING_CONSENT_VERSION,
    updatedAt: Date.now(),
    token: state === "granted" ? base.token ?? createConsentToken() : undefined,
  };
  if (isSupportedStorage(storage)) {
    try {
      storage.setItem(ADVERTISING_CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage unavailable (private mode / quota). Consent is not persisted
      // but callers still observe the in-memory result.
    }
  }
  return record;
}

export function clearAdvertisingConsentRecord(
  storage: Storage | null | undefined,
): void {
  if (isSupportedStorage(storage)) {
    try {
      storage.removeItem(ADVERTISING_CONSENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
