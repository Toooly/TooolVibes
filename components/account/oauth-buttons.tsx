"use client";

import { useMemo } from "react";

import {
  OAUTH_PROVIDERS,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";
import { useEnabledOAuthProviders } from "@/lib/auth/use-enabled-oauth-providers";

export function OAuthButtons({
  onSelect,
  disabled = false,
}: {
  onSelect: (provider: OAuthProviderId) => void;
  disabled?: boolean;
}) {
  const enabled = useEnabledOAuthProviders();

  const providers = useMemo(
    () =>
      enabled.flatMap((id) => {
        const provider = OAUTH_PROVIDERS.find((item) => item.id === id);
        return provider ? [provider] : [];
      }),
    [enabled],
  );

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="tv-oauth">
      <p className="tv-oauth__kicker">Entra in un attimo</p>
      <div className="tv-oauth__row" data-count={providers.length}>
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="tv-oauth__btn"
            disabled={disabled}
            onClick={() => onSelect(provider.id)}
          >
            Continua con {provider.label}
          </button>
        ))}
      </div>
      <p className="tv-oauth__or">
        <span>oppure con email</span>
      </p>
    </div>
  );
}
