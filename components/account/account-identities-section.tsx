"use client";

import { useEffect, useMemo, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import {
  isOAuthProviderId,
  oauthProviderLabel,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";

export function AccountIdentitiesSection() {
  const account = useAccount();
  const [enabled, setEnabled] = useState<OAuthProviderId[]>(["google"]);
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const linked = useMemo(() => {
    const ids = new Set(
      (account.user?.identities ?? []).map((identity) => identity.provider),
    );
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
