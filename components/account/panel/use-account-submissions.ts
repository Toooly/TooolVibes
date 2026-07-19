"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AccountPanelStatus,
  AccountSubmissionsPayload,
} from "./account-panel-model";
import {
  classifySubmissionsHttpStatus,
  type AccountSubmissionsErrorKind,
} from "./account-state-matrix";

/* ═══════════════════════════════════════════════════════════════
   useAccountSubmissions (B27) — fetch delle submission account.
   Effetto invariato rispetto al monolite: fetch autenticata con
   bearer token, fallback remoto non disponibile su errore, reset
   quando la sessione non è autenticata, cleanup su unmount.
   B59 (additivo): classifica l'esito fallito (401/429/5xx/offline)
   in `error` ed espone `reload` come retry esplicito. I campi
   submissions/isLoading/totalSubmissions restano identici.
   ═══════════════════════════════════════════════════════════════ */

type SubmissionsHttpError = Error & { status?: number };

export function useAccountSubmissions({
  status,
  accessToken,
}: {
  status: AccountPanelStatus;
  accessToken: string | undefined;
}) {
  const [submissions, setSubmissions] = useState<AccountSubmissionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AccountSubmissionsErrorKind | null>(null);
  const [reloadAttempt, setReloadAttempt] = useState(0);

  const reload = useCallback(() => {
    setReloadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) {
      setSubmissions(null);
      setError(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    fetch("/api/account/submissions", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        // Mock canonici dei test espongono solo json(): in assenza di
        // ok/status la risposta si considera valida (compatibilità B27).
        const httpStatus =
          typeof response?.status === "number" ? response.status : undefined;
        const ok =
          typeof response?.ok === "boolean"
            ? response.ok
            : httpStatus === undefined || httpStatus < 400;
        if (!ok) {
          const failure: SubmissionsHttpError = new Error("submissions-http-error");
          failure.status = httpStatus;
          return Promise.reject(failure);
        }
        return response.json();
      })
      .then((payload: AccountSubmissionsPayload) => {
        if (isActive) {
          setSubmissions(payload);
        }
      })
      .catch((reason: unknown) => {
        if (isActive) {
          const offline =
            typeof navigator !== "undefined" && navigator.onLine === false;
          setError(
            classifySubmissionsHttpStatus(
              (reason as SubmissionsHttpError | undefined)?.status,
              offline,
            ),
          );
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
  }, [accessToken, status, reloadAttempt]);

  const totalSubmissions =
    (submissions?.toolRequests.length ?? 0) + (submissions?.affiliateRequests.length ?? 0);

  return { submissions, isLoading, totalSubmissions, error, reload };
}
