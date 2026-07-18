import type { Metadata } from "next";

import { ErrorTriggerClient } from "./error-trigger-client";

export const metadata: Metadata = {
  title: "Error Trigger | TooolVibes",
  description:
    "Dev harness per verificare le error boundary: throw SSR via query, throw client via bottone.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Dev-only harness for the error boundaries (STATE-1001).
 * - `?mode=ssr` throws during server rendering -> segment `app/error.tsx`.
 * - default render exposes a button that throws during client render.
 * The default render never throws, so static prerendering stays green.
 */
export default async function ErrorTriggerPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (mode === "ssr") {
    throw new Error("TooolVibes dev SSR error trigger (STATE-1001)");
  }
  return <ErrorTriggerClient />;
}
