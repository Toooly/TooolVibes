"use client";

import { useEffect, useState } from "react";

import type {
  AccountPanelStatus,
  AccountSubmissionsPayload,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   useAccountSubmissions (B27) — fetch delle submission account.
   Effetto invariato rispetto al monolite: fetch autenticata con
   bearer token, fallback remoto non disponibile su errore, reset
   quando la sessione non è autenticata, cleanup su unmount.
   ═══════════════════════════════════════════════════════════════ */

export function useAccountSubmissions({
  status,
  accessToken,
}: {
  status: AccountPanelStatus;
  accessToken: string | undefined;
}) {
  const [submissions, setSubmissions] = useState<AccountSubmissionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) {
      setSubmissions(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    fetch("/api/account/submissions", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((payload: AccountSubmissionsPayload) => {
        if (isActive) {
          setSubmissions(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setSubmissions({
            toolRequests: [],
            affiliateRequests: [],
            remoteAvailable: false,
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, status]);

  const totalSubmissions =
    (submissions?.toolRequests.length ?? 0) + (submissions?.affiliateRequests.length ?? 0);

  return { submissions, isLoading, totalSubmissions };
}
