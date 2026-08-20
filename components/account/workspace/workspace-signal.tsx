"use client";

import { useEffect, useState } from "react";

import { AccountSignalProgressSection } from "@/components/account/panel/account-signal-progress-section";
import { fetchSignalHub } from "@/lib/signal-progression/client";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";

function useSignalHub() {
  const [hub, setHub] = useState<SignalProgressHub | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSignalHub().then((next) => {
      if (!cancelled) setHub(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return hub;
}

export function WorkspaceSignal() {
  const enabled = useSignalProgressUiEnabled();
  const hub = useSignalHub();

  return (
    <div className="tv-signal-view">
      <section className="tv-signal-view__progress" aria-labelledby="tv-signal-progress-title">
        <p className="account-label">Progresso</p>
        <h2 id="tv-signal-progress-title" className="tv-signal-view__title">
          {hub
            ? `Livello ${hub.level}${hub.levelTitle ? ` · ${hub.levelTitle}` : ""}`
            : "Progresso"}
        </h2>
        {enabled ? (
          <AccountSignalProgressSection />
        ) : (
          <p className="tv-signal-view__copy">
            Il segnale segue il lavoro vero nello spazio di lavoro: salvare,
            decidere, costruire uno stack. Qui non ci sono XP e non si coltivano click.
          </p>
        )}
      </section>
    </div>
  );
}
