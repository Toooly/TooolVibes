import { Activity, MessageCircle, Radar, TrendingUp } from "lucide-react";

import { DesktopRadarCanvas } from "@/components/desktop/desktop-radar-canvas";
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PremiumBadge, PremiumLink } from "@/components/ui/premium";

const radarSignals = [
  { icon: Activity, label: "Rank", value: "Giorno, settimana, mese" },
  { icon: MessageCircle, label: "Segnali", value: "Voti e commenti quando disponibili" },
  { icon: TrendingUp, label: "Fallback", value: "Stati puliti se l'API non risponde" },
];

export function DesktopVibeRadar() {
  return (
    <div className="desktop-vibe desktop-vibe-radar hidden lg:block">
      <section className="desktop-vibe-section desktop-vibe-radar-hero">
        <div className="desktop-vibe-copy" data-orbit-shield>
          <p className="desktop-vibe-eyebrow">Radar live</p>
          <h1>I lanci si muovono dentro un radar 3D.</h1>
          <p>
            La classifica Product Hunt come una sala di segnali: orbite, sweep e card
            agganciate alla profondità del sito. Nessun blocco statico, solo segnali in movimento.
          </p>
          <div className="desktop-vibe-actions">
            <PremiumLink href="/archivio" size="lg">
              Esplora directory
            </PremiumLink>
            <PremiumLink href="/wishlist" tone="secondary" size="lg">
              Suggerisci un tool
            </PremiumLink>
          </div>
        </div>

        <div className="desktop-vibe-radar-stage" aria-label="Radar 3D Product Hunt">
          <DesktopRadarCanvas />
          <span className="desktop-vibe-radar-core" aria-hidden="true">
            <Radar />
          </span>

          {radarSignals.map((item, index) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className={`desktop-vibe-radar-signal desktop-vibe-radar-signal--${index + 1}`}>
                <span>
                  <Icon aria-hidden="true" />
                </span>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            );
          })}
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-radar-console">
        <div className="desktop-vibe-radar-console__header">
          <div data-orbit-shield>
            <p className="desktop-vibe-eyebrow">Classifica live</p>
            <h2>Tutti i segnali Product Hunt in una plancia unica.</h2>
          </div>
          <PremiumBadge tone="warning">Radar live</PremiumBadge>
        </div>
        <div id="rankings">
          <ProductHuntRankings variant="wide" />
        </div>
      </section>
    </div>
  );
}
