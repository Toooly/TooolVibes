"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { ArrowUpRight } from "lucide-react";
import { MetricStrip } from "@/components/ui/metric-strip";
import type { RadarTool, RadarView } from "@/lib/radar/radar-domain";
import { RADAR_RANGE_HOURS } from "@/lib/radar/radar-geometry";
import { formatAge } from "@/lib/radar/radar-trend";

/** Snapshot graphics only. No history, geometry or ranking engine changes. */
export function RadarSnapshotPanel({ view, tools, clusterId, loading, onSelect, onCluster }: {
  view: RadarView;
  tools: readonly RadarTool[];
  clusterId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onCluster: (id: string | null) => void;
}) {
  const cluster = view.clusters.find((entry) => entry.id === clusterId);
  const linked = tools.filter((tool) => tool.catalogStatus === "linked").length;
  const attention = tools.reduce((sum, tool) => sum + tool.attention, 0);
  const top = [...tools].sort((a, b) => b.attention - a.attention || a.rank - b.rank).slice(0, 4);
  const boundaries = view.snapshot.range === "day" ? [6, 12, 24] : view.snapshot.range === "week" ? [24, 72, 168] : [24, 168, 720];
  const buckets = boundaries.map((end, index) => {
    const start = index === 0 ? 0 : boundaries[index - 1];
    return {
      label: `${start}–${end}h`,
      count: tools.filter((tool) => tool.ageHours !== null && tool.ageHours <= end && (index === 0 || tool.ageHours > start)).length,
    };
  });
  const unknown = tools.filter((tool) => tool.ageHours === null).length;
  const total = Math.max(tools.length, 1);

  return (
    <div className="tv-rx-rail" aria-busy={loading}>
      <section className="tv-rx-rail__block" aria-labelledby="tv-rx-context-title">
        <p className="tv-rx__eyebrow"><LocalizedText>{cluster ? "02 / Area locale" : "01 / Mercato"}</LocalizedText></p>
        <h2 id="tv-rx-context-title" className="tv-rx-context__title"><LocalizedText>{cluster?.label ?? "Il mercato, adesso"}</LocalizedText></h2>
        <p className="tv-rx-context__caption"><LocalizedText>{"Snapshot · "}</LocalizedText><LocalizedText>{view.snapshot.sourceLabel}</LocalizedText> · {RADAR_RANGE_HOURS[view.snapshot.range]}<LocalizedText>{"h"}</LocalizedText></p>
        <MetricStrip label="Metriche del contesto" className="tv-rx-context__metrics" items={[
          { label: "Segnali", value: loading ? "—" : tools.length },
          { label: "Voti + commenti", value: loading ? "—" : attention.toLocaleString("it-IT") },
          { label: "Nel Catalogo", value: loading ? "—" : linked },
        ]} />
        <p className="tv-rx-context__caption">{tools.length - linked}<LocalizedText>{" segnali esterni · nessuna variazione storica"}</LocalizedText></p>
      </section>

      {tools.length > 0 ? (
        <section className="tv-rx-rail__block" aria-labelledby="tv-rx-age-title">
          <h3 id="tv-rx-age-title" className="tv-rx-rail__title"><LocalizedText>{"Quando sono emersi"}</LocalizedText></h3>
          <LocalizedAttributes><ul className="tv-rx-distribution" aria-label="Distribuzione temporale dello snapshot">
            {[...buckets, ...(unknown ? [{ label: "Data ignota", count: unknown }] : [])].map((bucket) => (
              <li key={bucket.label}>
                <span><LocalizedText>{bucket.label}</LocalizedText></span>
                <span className="tv-rx-distribution__track" aria-hidden="true"><i style={{ inlineSize: `${bucket.count / total * 100}%` }} /></span>
                <strong>{bucket.count}</strong>
              </li>
            ))}
          </ul></LocalizedAttributes>
        </section>
      ) : null}

      <section className="tv-rx-rail__block" aria-labelledby="tv-rx-rail-signals">
        <h3 id="tv-rx-rail-signals" className="tv-rx-rail__title"><LocalizedText>{"Più attenzione nello snapshot"}</LocalizedText></h3>
        {top.length === 0 ? <p className="tv-rx-context__caption"><LocalizedText>{loading ? "Lettura dei segnali…" : "Nessuna classifica disponibile."}</LocalizedText></p> : (
          <ol className="tv-rx-rail__list">
            {top.map((tool, index) => (
              <li key={tool.id}>
                <button type="button" className="tv-rx-rail__signal" onClick={() => onSelect(tool.id)}>
                  <span className="tv-rx-rail__rank" aria-hidden="true"><LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText></span>
                  <span className="tv-rx-rail__identity"><strong>{tool.name}</strong><span className="tv-rx-rail__meta"><LocalizedText>{tool.topicCluster.label}</LocalizedText> · <LocalizedText>{formatAge(tool.ageHours)}</LocalizedText></span></span>
                  <span className="tv-rx-rail__signal-value">{tool.attention}<span><LocalizedText>{"voti + commenti"}</LocalizedText></span></span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {!cluster && view.clusters.length > 0 ? (
        <section className="tv-rx-rail__block" aria-labelledby="tv-rx-rail-cats">
          <h3 id="tv-rx-rail-cats" className="tv-rx-rail__title"><LocalizedText>{"Aree attive"}</LocalizedText></h3>
          <ul className="tv-rx-rail__cats">
            {view.clusters.map((entry) => (
              <li key={entry.id}>
                <button type="button" className="tv-rx-rail__cluster" onClick={() => onCluster(entry.id)}>
                  <span className="tv-rx-chip__swatch" data-color-index={entry.colorIndex} aria-hidden="true" />
                  <span><LocalizedText>{entry.label}</LocalizedText></span>
                  <span className="tv-rx-rail__count">{entry.count}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
