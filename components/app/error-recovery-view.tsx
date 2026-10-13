"use client";

import { useEffect } from "react";
import { isChunkLoadError, recoverChunkLoadError } from "@/lib/shell/chunk-recovery";

export type ErrorRecoveryViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  as?: "main" | "div";
  /** Navigation recovery target rendered as a plain anchor so it also works
   * when the app router tree is unavailable (global error). */
  homeHref?: string;
};

/**
 * Presentational recovery UI shared by the segment error boundary
 * (`app/error.tsx`) and the document-level boundary (`app/global-error.tsx`).
 * It preserves the copy, digest display and reset behavior of the previous
 * boundary and never renders document elements (`html`/`body`): those belong
 * exclusively to `app/global-error.tsx`.
 */
export function ErrorRecoveryView({
  error,
  reset,
  as: Component = "main",
  homeHref,
}: ErrorRecoveryViewProps) {
  const assetFailure = isChunkLoadError(error.message ?? "");
  useEffect(() => {
    recoverChunkLoadError(error);
  }, [error]);

  return (
    <Component className="error-recovery-view">
      <section className="error-recovery-view__panel" aria-labelledby="error-recovery-title">
        <p className="error-recovery-view__eyebrow">
          <span className="tv-brand-signal-dot" aria-hidden="true" />
          TooolVibes · recupero
        </p>
        <h1 id="error-recovery-title">Qualcosa è andato storto</h1>
        <p className="error-recovery-view__copy">
          La pagina non è riuscita a completare il caricamento. Puoi riprovare senza perdere il contesto.
        </p>
        {error.digest ? (
          <p className="error-recovery-view__digest">Codice errore: {error.digest}</p>
        ) : null}
        <div className="error-recovery-view__actions">
          <button
            type="button"
            onClick={() => assetFailure ? window.location.reload() : reset()}
            className="error-recovery-view__primary"
          >
            {assetFailure ? "Ricarica pagina" : "Riprova"}
          </button>
          {homeHref ? (
            <a
              href={homeHref}
              className="error-recovery-view__secondary"
            >
              Torna alla home
            </a>
          ) : null}
        </div>
      </section>
    </Component>
  );
}
