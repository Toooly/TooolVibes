"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
/**
 * Radar legend (spec §17). Deliberately concise — the map must explain itself
 * without a tutorial. A property with no data meaning is never presented as a
 * signal: the movement row states plainly that it is future-only.
 */

export function RadarLegend() {
  return (
    <details className="tv-rx-legend">
      <summary className="tv-rx-legend__summary"><LocalizedText>{"Come leggere la mappa"}</LocalizedText></summary>
      <dl className="tv-rx-legend__list">
        <div className="tv-rx-legend__row">
          <dt><LocalizedText>{"Distanza dal centro"}</LocalizedText></dt>
          <dd><LocalizedText>{"Quando è emerso. Al centro = più recente."}</LocalizedText></dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt><LocalizedText>{"Colore"}</LocalizedText></dt>
          <dd><LocalizedText>{"Area Radar."}</LocalizedText></dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt><LocalizedText>{"Dimensione"}</LocalizedText></dt>
          <dd><LocalizedText>{"Attenzione relativa (voti + commenti)."}</LocalizedText></dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt><LocalizedText>{"Tipo"}</LocalizedText></dt>
          <dd><LocalizedText>{"Punto pieno = segnale esterno. Punto con marcatore = nel Catalogo TooolVibes. "}</LocalizedText></dd>
        </div>
        <div className="tv-rx-legend__row" data-unavailable="true">
          <dt><LocalizedText>{"Movimento"}</LocalizedText></dt>
          <dd><LocalizedText>{"Disponibile in futuro, quando esistono dati storici reali."}</LocalizedText></dd>
        </div>
      </dl>
    </details>
  );
}
