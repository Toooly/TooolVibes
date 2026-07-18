"use client";

import { ErrorRecoveryView } from "@/components/app/error-recovery-view";

/**
 * Root-level error boundary (Next.js App Router `global-error`).
 *
 * This boundary replaces the root layout when the layout itself fails, so it
 * is the ONLY error boundary allowed to own the document shell (`html`/`body`).
 * Recovery content stays shared with the segment boundary via
 * `ErrorRecoveryView`; reset behavior and copy are identical.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body className="min-h-dvh">
        <ErrorRecoveryView error={error} reset={reset} homeHref="/" />
      </body>
    </html>
  );
}
