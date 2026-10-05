"use client";

import { ErrorRecoveryView } from "@/components/app/error-recovery-view";

export default function RadarErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorRecoveryView as="div" error={error} reset={reset} homeHref="/" />;
}
