"use client";

import { useEffect, useState } from "react";

import {
  readOAuthProviderList,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";

export function useEnabledOAuthProviders() {
  const [enabled, setEnabled] = useState<OAuthProviderId[]>([]);

  useEffect(() => {
    let active = true;

    void fetch("/api/auth/config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { providers: [] }))
      .then((payload: { providers?: unknown }) => {
        if (!active) return;
        setEnabled(readOAuthProviderList(payload.providers));
      })
      .catch(() => {
        if (active) setEnabled([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
