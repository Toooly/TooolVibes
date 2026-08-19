"use client";

import { useEffect, useState } from "react";

import { AccountSignalProgressSection } from "@/components/account/panel/account-signal-progress-section";
import { SignalMapRail } from "@/components/signal/marks/signal-map-rail";
import { derivePersonalRecords } from "@/lib/account/workspace-pipeline";
import { fetchSignalHub } from "@/lib/signal-progression/client";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";

import { useCanonicalWorkspace } from "./use-canonical-workspace";

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
  const workspace = useCanonicalWorkspace();
  const records = derivePersonalRecords(workspace);
  const hub = useSignalHub();
  const mapLevel = hub?.level ?? 0;

  return (
    <div className="tv-signal-view">
      <section className="tv-signal-view__map" aria-labelledby="tv-signal-map-title">
        <p className="account-label">Mappa</p>
        <h2 id="tv-signal-map-title" className="tv-signal-view__title">
          Cinque territori, un solo segnale
        </h2>
        <p className="tv-signal-view__copy">
          Esploratore, Selezionatore, Builder, Stratega, Cartografo.
          Si avanza solo con lavoro verificato.
        </p>
        {hub ? (
          <p className="tv-signal-view__level">
            Livello {hub.level}
            {hub.levelTitle ? ` · ${hub.levelTitle}` : ""}
          </p>
        ) : null}
        <SignalMapRail currentLevel={mapLevel} />
      </section>

      {records.length > 0 ? (
        <section className="tv-signal-view__records" aria-label="Record personali">
          <p className="account-label">Record</p>
          <ul className="tv-space-records">
            {records.map((record) => (
              <li key={record.id}>
                <strong>{record.value}</strong>
                <span>{record.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {enabled ? (
        <AccountSignalProgressSection />
      ) : (
        <section className="tv-signal-view__quiet">
          <p className="account-label">Segnale</p>
          <h2 className="tv-signal-view__title">Il segnale segue il lavoro vero</h2>
          <p className="tv-signal-view__copy">
            I Signal Point arrivano solo da azioni verificate: salvare, confrontare,
            decidere, tornare al Radar. Qui non ci sono XP e non si coltivano click.
          </p>
        </section>
      )}
    </div>
  );
}
