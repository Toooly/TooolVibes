"use client";

import { ErrorRecoveryView } from "@/components/app/error-recovery-view";

/**
 * Segment error boundary (Next.js App Router).
 *
 * This boundary renders *inside* the root layout, so it must NOT return
 * `html`/`body` elements: the document shell already exists and nesting a
 * second one produces invalid HTML and breaks hydration recovery. The
 * document-level boundary lives in `app/global-error.tsx`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorRecoveryView error={error} reset={reset} homeHref="/" />;
}
