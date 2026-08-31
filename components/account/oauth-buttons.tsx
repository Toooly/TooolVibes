"use client";

import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/auth/oauth-providers";

export function OAuthButtons({
  onSelect,
  disabled = false,
}: {
  onSelect: (provider: OAuthProviderId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="tv-oauth">
      <p className="tv-oauth__kicker">Entra in un attimo</p>
      <div className="tv-oauth__row">
        {OAUTH_PROVIDERS.map((provider) => (
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
