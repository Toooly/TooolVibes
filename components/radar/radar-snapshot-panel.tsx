"use client";

import { useId, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { LocalizedText } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import type { RadarTool, RadarView } from "@/lib/radar/radar-domain";
import { formatAge } from "@/lib/radar/radar-trend";

const PAGE_SIZE = 4;

function SignalIdentity({ tool }: { tool: RadarTool }) {
  const [failed, setFailed] = useState(false);
  return <span className="tv-rx-signal-identity" aria-hidden="true">
    {tool.thumbnailUrl && !failed
      // eslint-disable-next-line @next/next/no-img-element -- factual source artwork, cached by the browser
      ? <img src={tool.thumbnailUrl} alt="" width={36} height={36} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <span>{Array.from(tool.name)[0]}</span>}
  </span>;
}

/** Every real signal remains reachable without resolving a small map target. */
export function RadarSnapshotPanel({ view, tools, clusterId, loading, onSelect, onBrowse }: {
  view: RadarView;
  tools: readonly RadarTool[];
  clusterId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onBrowse: () => void;
}) {
  const { locale } = useLocale();
  const en = locale === "en";
  const [page, setPage] = useState(0);
  const listId = useId();
  const pages = Math.max(1, Math.ceil(tools.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * PAGE_SIZE;
  const cluster = view.clusters.find(entry => entry.id === clusterId);

  return <section className="tv-rx-rail tv-rx-signal-browser" aria-busy={loading} aria-labelledby="tv-rx-context-title">
    <header className="tv-rx-signal-browser__head">
      <div>
        <p className="tv-rx__eyebrow">{en ? "Explore the signals" : "Esplora i segnali"}</p>
        <h2 id="tv-rx-context-title" className="tv-rx-context__title"><LocalizedText>{cluster?.label ?? "Tutte le aree"}</LocalizedText></h2>
      </div>
      <span className="tv-rx-signal-browser__total">{loading ? "—" : tools.length}</span>
    </header>
    <p className="tv-rx-context__caption">{en ? "Open a tool to read it, then move to the next one." : "Apri un tool per approfondire, poi passa al successivo."}</p>
    {tools.length === 0 ? <p className="tv-rx-state" role="status"><LocalizedText>{loading ? "Lettura dei segnali…" : "Nessun segnale nel periodo selezionato."}</LocalizedText></p> : <>
      <ol id={listId} className="tv-rx-rail__list" start={start + 1}>
        {tools.slice(start, start + PAGE_SIZE).map((tool, index) => <li key={tool.id}>
          <button type="button" className="tv-rx-rail__signal" onClick={() => onSelect(tool.id)} aria-label={`${en ? "Open details for" : "Apri dettagli di"} ${tool.name}`}>
            <span className="tv-rx-rail__rank" aria-hidden="true">{String(start + index + 1).padStart(2, "0")}</span>
            <SignalIdentity tool={tool} />
            <span className="tv-rx-rail__identity"><strong>{tool.name}</strong><span className="tv-rx-rail__meta"><LocalizedText>{tool.topicCluster.label}</LocalizedText> · <LocalizedText>{formatAge(tool.ageHours)}</LocalizedText></span></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </li>)}
      </ol>
      <nav className="tv-rx-signal-pages" aria-label={en ? "Signal pages" : "Pagine dei segnali"}>
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-controls={listId} aria-label={en ? "Previous signals" : "Segnali precedenti"}><ChevronLeft size={18} aria-hidden="true" /></button>
        <span aria-live="polite">{start + 1}–{Math.min(start + PAGE_SIZE, tools.length)} / {tools.length}</span>
        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pages - 1} aria-controls={listId} aria-label={en ? "Next signals" : "Segnali successivi"}><ChevronRight size={18} aria-hidden="true" /></button>
      </nav>
      <button className="tv-rx-signal-browser__all" type="button" onClick={onBrowse}>{en ? "Read all signals" : "Leggi tutti i segnali"}<ArrowRight size={15} aria-hidden="true" /></button>
    </>}
    <p className="tv-rx-signal-browser__source"><LocalizedText>{view.snapshot.sourceLabel}</LocalizedText> · {en ? "Attention = votes + comments." : "Attenzione = voti + commenti."}</p>
  </section>;
}

/** Persistent selection controls live inside the inspector, including on touch. */
export function RadarSignalNavigation({ tools, selectedId, onSelect }: {
  tools: readonly RadarTool[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { locale } = useLocale();
  const en = locale === "en";
  const index = tools.findIndex(tool => tool.id === selectedId);
  if (index < 0) return null;
  return <nav className="tv-rx-signal-navigation" aria-label={en ? "Browse signals" : "Sfoglia i segnali"}>
    <button type="button" disabled={index === 0} onClick={() => onSelect(tools[index - 1].id)} aria-label={en ? "Previous signal" : "Segnale precedente"}><ChevronLeft size={18} aria-hidden="true" /></button>
    <label>
      <span className="tv-rx-sr-only">{en ? "Choose a signal" : "Scegli un segnale"}</span>
      <select value={selectedId} onChange={event => onSelect(event.target.value)}>
        {tools.map((tool, i) => <option key={tool.id} value={tool.id}>{i + 1} / {tools.length} · {tool.name}</option>)}
      </select>
    </label>
    <button type="button" disabled={index === tools.length - 1} onClick={() => onSelect(tools[index + 1].id)} aria-label={en ? "Next signal" : "Segnale successivo"}><ChevronRight size={18} aria-hidden="true" /></button>
  </nav>;
}
