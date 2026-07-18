"use client";

import { useState } from "react";

/**
 * Client half of the dev error-trigger harness: clicking the button arms the
 * component, which then throws during render so the segment error boundary
 * catches it (error boundaries do not catch event-handler throws).
 */
export function ErrorTriggerClient() {
  const [armed, setArmed] = useState(false);

  if (armed) {
    throw new Error("TooolVibes dev client error trigger (STATE-1001)");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f5ff] px-6 py-12 text-[#171225]">
      <section className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a3cff]">
          TooolVibes Dev
        </p>
        <h1 className="mt-3 text-2xl font-black">Error trigger</h1>
        <p className="mt-3 text-sm leading-6 text-[#5d566f]">
          Harness di sviluppo per verificare la recovery delle error boundary.
          Per il throw SSR usa <code>?mode=ssr</code>.
        </p>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#171225] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(23,18,37,0.18)] transition hover:bg-[#2a2140] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a3cff] focus-visible:ring-offset-2"
        >
          Scatena errore client
        </button>
      </section>
    </main>
  );
}
