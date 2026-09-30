"use client";

import { useMemo, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import {
  normalizeIdentityProvider,
  oauthProviderLabel,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";
import { useEnabledOAuthProviders } from "@/lib/auth/use-enabled-oauth-providers";

export function AccountIdentitiesSection() {
  const account = useAccount();
  const enabled = useEnabledOAuthProviders();
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const linked = useMemo(() => {
    const ids = new Set<string>();
    for (const identity of account.user?.identities ?? []) {
      const normalized = normalizeIdentityProvider(
        (identity as { provider?: unknown } | null)?.provider,
      );
      if (normalized) ids.add(normalized);
    }
    if (account.user?.email) ids.add("email");
    return ids;
  }, [account.user]);

  const email = account.user?.email ?? null;

  return (
    <section className="tv-settings-section" aria-labelledby="settings-identities">
      <h2 id="settings-identities" className="tv-settings-heading">
        Metodi di accesso
      </h2>
      <p className="tv-settings-lead">
        Email e social con la stessa email restano lo stesso spazio.
      </p>
      <ul className="tv-identity-list">
        <li className="tv-identity-row">
          <span>Email</span>
          <span>{email ?? "collegata"}</span>
        </li>
        {enabled.map((provider) => {
          const isLinked = linked.has(provider);
          return (
            <li key={provider} className="tv-identity-row">
              <span>{oauthProviderLabel(provider)}</span>
              {isLinked ? (
                <span>Collegato</span>
              ) : (
                <button
                  type="button"
                  className="account-btn-secondary"
                  disabled={!account.linkIdentity || busy !== null}
                  onClick={() => {
                    if (!account.linkIdentity) return;
                    setBusy(provider);
                    setMessage(null);
                    void account.linkIdentity(provider).then((result) => {
                      setBusy(null);
                      if (!result.ok) setMessage(result.message);
                    });
                  }}
                >
                  {busy === provider
                    ? "Collegamento…"
                    : `Collega ${oauthProviderLabel(provider)}`}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {message ? (
        <p className="tv-settings-copy" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
