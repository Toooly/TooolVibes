"use client";

/**
 * Radar legend (spec §17). Deliberately concise — the map must explain itself
 * without a tutorial. A property with no data meaning is never presented as a
 * signal: the movement row states plainly that it is future-only.
 */

export function RadarLegend() {
  return (
    <details className="tv-rx-legend">
      <summary className="tv-rx-legend__summary">Come leggere la mappa</summary>
      <dl className="tv-rx-legend__list">
        <div className="tv-rx-legend__row">
          <dt>Distanza dal centro</dt>
          <dd>Quando è emerso. Al centro = più recente.</dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt>Colore</dt>
          <dd>Area Radar.</dd>
        </div>
        <div className="tv-rx-legend__row">
          <dt>Dimensione</dt>
          <dd>Attenzione relativa (voti + commenti).</dd>
        </div>
        <div className="tv-rx-legend__row" data-unavailable="true">
          <dt>Movimento</dt>
          <dd>Disponibile in futuro, quando esistono dati storici reali.</dd>
        </div>
      </dl>
    </details>
  );
}
