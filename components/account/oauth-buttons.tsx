"use client";

import { useEffect, useMemo, useState } from "react";

import {
  OAUTH_PROVIDERS,
  isOAuthProviderId,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";

export function OAuthButtons({
  onSelect,
  disabled = false,
}: {
  onSelect: (provider: OAuthProviderId) => void;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState<OAuthProviderId[]>(["google"]);

  useEffect(() => {
    let active = true;

    void fetch("/api/auth/config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { providers: [] }))
      .then((payload: { providers?: unknown }) => {
        if (!active) return;
        const list = Array.isArray(payload.providers)
          ? payload.providers.filter(
              (value): value is OAuthProviderId =>
                typeof value === "string" && isOAuthProviderId(value),
            )
          : [];
        setEnabled(["google", ...list.filter((id) => id !== "google")]);
      })
      .catch(() => {
        if (active) setEnabled(["google"]);
      });

    return () => {
      active = false;
    };
  }, []);

  const providers = useMemo(
    () =>
      OAUTH_PROVIDERS.filter((provider) => enabled.includes(provider.id)),
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
