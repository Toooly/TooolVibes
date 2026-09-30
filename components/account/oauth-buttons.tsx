"use client";

import { useMemo, useState } from "react";

import {
  OAUTH_PROVIDERS,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";
import { useEnabledOAuthProviders } from "@/lib/auth/use-enabled-oauth-providers";

function ProviderIcon({ provider }: { provider: OAuthProviderId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
  } as const;
  if (provider === "google") {
    return (
      <svg {...common}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
      </svg>
    );
  }
  if (provider === "apple") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.36 12.94c.03 2.73 2.4 3.64 2.43 3.65-.02.07-.38 1.3-1.25 2.58-.75 1.1-1.53 2.2-2.76 2.22-1.21.02-1.6-.72-2.98-.71-1.38.01-1.82.73-3.02.71-1.21-.02-2.13-1.22-2.88-2.32C3.4 16.55 2.7 12.6 4.33 10.2c.8-1.18 2.05-1.87 3.22-1.87 1.2 0 1.95.66 2.94.66.91 0 1.46-.67 2.77-.67 1.02 0 2.1.56 2.87 1.52-.03.02-2.73 1.6-2.77 4.1ZM14.16 5.9c.64-.78 1.07-1.86.95-2.94-.92.04-2.03.61-2.69 1.39-.59.68-1.11 1.77-.97 2.81 1.02.08 2.07-.52 2.71-1.26Z" />
      </svg>
    );
  }
  if (provider === "microsoft") {
    return (
      <svg {...common}>
        <path fill="#F25022" d="M2.5 2.5h9v9h-9z" />
        <path fill="#7FBA00" d="M12.5 2.5h9v9h-9z" />
        <path fill="#00A4EF" d="M2.5 12.5h9v9h-9z" />
        <path fill="#FFB900" d="M12.5 12.5h9v9h-9z" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.93c.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .31.2.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function OAuthButtons({
  onSelect,
  disabled = false,
}: {
  onSelect: (provider: OAuthProviderId) => void;
  disabled?: boolean;
}) {
  const enabled = useEnabledOAuthProviders();
  const [active, setActive] = useState<OAuthProviderId | null>(null);

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

  const busy = disabled || active !== null;

  return (
    <div className="tv-oauth">
      <p className="tv-oauth__kicker">Entra in un attimo</p>
      <div className="tv-oauth__row" data-count={providers.length}>
        {providers.map((provider) => {
          const loading = active === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              className="tv-oauth__btn"
              disabled={busy}
              aria-busy={loading || undefined}
              aria-live="polite"
              onClick={() => {
                if (busy) return;
                setActive(provider.id);
                try {
                  onSelect(provider.id);
                } finally {
                  // Redirect unmounts the page; fallback reset keeps keyboard/AT state sane if it doesn't.
                  window.setTimeout(() => {
                    setActive((current) => (current === provider.id ? null : current));
                  }, 4000);
                }
              }}
            >
              <span className="tv-oauth__icon" aria-hidden="true">
                <ProviderIcon provider={provider.id} />
              </span>
              <span>{loading ? "Apertura…" : `Continua con ${provider.label}`}</span>
            </button>
          );
        })}
      </div>
      <p className="tv-oauth__or">
        <span>oppure</span>
      </p>
    </div>
  );
}
