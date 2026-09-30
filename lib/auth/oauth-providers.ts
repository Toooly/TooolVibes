import { isSafeReturnTo } from "@/lib/auth/pending-auth-intent";

/* Canonical social providers (public IDs used across TooolVibes UI).
   Microsoft authenticates through the Supabase SDK provider "azure". */
export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "microsoft", label: "Microsoft" },
  { id: "github", label: "GitHub" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

/* Exact Supabase SDK identifiers (verified against @supabase/auth-js Provider:
   'apple' | 'azure' | ... | 'github' | 'google' | ...). */
export type SupabaseOAuthProvider = "google" | "apple" | "azure" | "github";

const SUPABASE_PROVIDER_MAP: Record<OAuthProviderId, SupabaseOAuthProvider> = {
  google: "google",
  apple: "apple",
  microsoft: "azure",
  github: "github",
};

const PUBLIC_PROVIDER_ALIASES: Record<string, OAuthProviderId> = {
  google: "google",
  apple: "apple",
  microsoft: "microsoft",
  azure: "microsoft",
  github: "github",
};

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return OAUTH_PROVIDERS.some((provider) => provider.id === value);
}

/** Accepts the public id plus the "azure" SDK alias for Microsoft. */
export function normalizeOAuthProviderId(value: unknown): OAuthProviderId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return PUBLIC_PROVIDER_ALIASES[normalized] ?? null;
}

export function toSupabaseProvider(id: OAuthProviderId): SupabaseOAuthProvider {
  return SUPABASE_PROVIDER_MAP[id];
}

/** Supabase identity rows use the SDK name ("azure"); normalize to public id. */
export function normalizeIdentityProvider(value: unknown): OAuthProviderId | null {
  return normalizeOAuthProviderId(value);
}

export function oauthProviderLabel(id: OAuthProviderId) {
  return OAUTH_PROVIDERS.find((provider) => provider.id === id)?.label ?? id;
}

export function oauthRedirectTo(next?: string) {
  const callback = typeof window === "undefined" ? "/auth/callback" : `${window.location.origin}/auth/callback`;
  const safeNext = typeof next === "string" && isSafeReturnTo(next) ? next : null;
  if (!safeNext) return callback;
  const separator = callback.includes("?") ? "&" : "?";
  return `${callback}${separator}next=${encodeURIComponent(safeNext)}`;
}

/** Resolve a safe post-auth destination; falls back to the canonical default. */
export function resolveSafeNextPath(value: unknown, fallback = "/account?connected=1"): string {
  if (typeof value === "string" && isSafeReturnTo(value)) return value;
  return fallback;
}

export function readOAuthProviderList(value: unknown): OAuthProviderId[] {
  if (!Array.isArray(value)) return [];
  const out: OAuthProviderId[] = [];
  for (const item of value) {
    const normalized = normalizeOAuthProviderId(item);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  // Deterministic canonical order regardless of config order.
  const order = OAUTH_PROVIDERS.map((provider) => provider.id);
  return out.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const SUPABASE_EXTERNAL_KEYS: Record<OAuthProviderId, string[]> = {
  google: ["google"],
  apple: ["apple"],
  microsoft: ["azure"],
  github: ["github"],
};

export function parseEnabledOAuthProviders(
  external: Record<string, unknown> | null | undefined,
): OAuthProviderId[] {
  if (!external) return [];
  return OAUTH_PROVIDERS.filter((provider) =>
    SUPABASE_EXTERNAL_KEYS[provider.id].some((key) => external[key] === true),
  ).map((provider) => provider.id);
}
