"use client";

import { AccountSignalProgressSection } from "@/components/account/panel/account-signal-progress-section";
import { SignalMapRail } from "@/components/signal/marks/signal-map-rail";
import { derivePersonalRecords } from "@/lib/account/workspace-pipeline";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import { useCanonicalWorkspace } from "./use-canonical-workspace";

export function WorkspaceSignal() {
  const enabled = useSignalProgressUiEnabled();
  const workspace = useCanonicalWorkspace();
  const records = derivePersonalRecords(workspace);

  return (
    <div className="tv-space-stack">
      <section className="tv-space-card">
        <p className="account-label">Mappa</p>
        <h2 className="tv-space-card__title">Cinque territori, un solo segnale</h2>
        <p className="tv-space-card__body">
          Esploratore, Selezionatore, Builder, Stratega, Cartografo.
          Si avanza solo con lavoro verificato.
        </p>
        <SignalMapRail currentLevel={1} />
      </section>

      {records.length > 0 ? (
        <section className="tv-space-card" aria-label="Record personali">
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
        <section className="tv-space-card">
          <p className="account-label">Segnale</p>
          <h2 className="tv-space-card__title">Il segnale segue il lavoro vero</h2>
          <p className="tv-space-card__body">
            I Signal Point arrivano solo da azioni verificate: salvare, confrontare,
            decidere, tornare al Radar. Qui non ci sono XP e non si coltivano click.
          </p>
        </section>
      )}
    </div>
  );
}
