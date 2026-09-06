export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "github", label: "GitHub" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return OAUTH_PROVIDERS.some((provider) => provider.id === value);
}

export function oauthProviderLabel(id: OAuthProviderId) {
  return OAUTH_PROVIDERS.find((provider) => provider.id === id)?.label ?? id;
}

export function oauthRedirectTo() {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export function parseEnabledOAuthProviders(
  external: Record<string, unknown> | null | undefined,
): OAuthProviderId[] {
  if (!external) return [];
  return OAUTH_PROVIDERS.filter((provider) => external[provider.id] === true).map(
    (provider) => provider.id,
  );
}
