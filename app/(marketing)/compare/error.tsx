"use client";

import { ErrorRecoveryView } from "@/components/app/error-recovery-view";

export default function CompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorRecoveryView as="div" error={error} reset={reset} homeHref="/" />;
}
