"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  GitCompare,
  Layers,
  RotateCcw,
  Save,
  Star,
} from "lucide-react";

import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-context";

import type { SavedToolCardView, WorkspaceSnapshot } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountSelectionSection (B27) — pannello "La tua selezione".
   Conteggi workspace, tool salvati recenti, consigliati e CTA.
   Riceve dati già derivati da useAccountWorkspaceSummary;
   markup e classi invariati rispetto al monolite.
   ═══════════════════════════════════════════════════════════════ */

export function AccountSelectionSection({
  workspace,
  savedToolCards,
  recommendedTools,
}: {
  workspace: WorkspaceSnapshot;
  savedToolCards: SavedToolCardView[];
  recommendedTools: PublicToolCatalogItem[];
}) {
  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">La tua selezione</p>
      </div>
      <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
        La selezione che hai già costruito resta leggibile.
      </h2>
      <p className="account-subtitle mt-3">
        La pagina account non serve solo per entrare: rende visibile quanta selezione reale hai già costruito e da dove conviene ripartire adesso.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          { label: "Salvati", value: workspace.saved, detail: "tool salvati", icon: Save },
          { label: "Confronto", value: workspace.compare, detail: "profili da confrontare", icon: GitCompare },
          { label: "Priorità alta", value: workspace.top, detail: "priorità alte", icon: Star },
          { label: "Da rivedere", value: workspace.review, detail: "tool ancora aperti", icon: RotateCcw },
        ].map((item) => (
          <div key={item.label} className="account-selection-card p-4">
            <div className="flex items-center gap-2">
              <item.icon size={14} className="text-[var(--accent-purple)]" />
              <p className="account-label">{item.label}</p>
            </div>
            <p className="account-number mt-3">{item.value}</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="account-label">Tool salvati recenti</p>
          {workspace.saved > 0 ? (
            <Link href="/shortlist" className="account-link text-sm">
              Vedi tutti
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
        {savedToolCards.length > 0 ? (
          <div className="grid gap-3">
            {savedToolCards.map((tool) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="account-selection-card block p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--account-ink)]">{tool.name}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                      {tool.category} · {tool.stage === "top" ? "Priorita alta" : tool.stage === "review" ? "Da rivedere" : "Salvato"}
                    </p>
                  </div>
                  {tool.pinned ? <Star size={15} className="shrink-0 text-[var(--accent-purple)]" /> : <ExternalLink size={15} className="shrink-0 text-[var(--muted)]" />}
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {tool.note || tool.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
              Nessun tool salvato ancora. Parti dal catalogo e questa area diventera la tua base di lavoro.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <p className="account-label">Consigliati per continuare</p>
        <div className="grid gap-2">
          {recommendedTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
            >
              <span className="min-w-0 truncate">{tool.name}</span>
              <span className="shrink-0 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                {tool.categoryLabel}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={workspace.saved > 0 ? "/shortlist" : "/archivio"}
          className="account-btn-secondary"
        >
          <BookOpen size={16} />
          {workspace.saved > 0 ? `Apri salvati (${workspace.saved})` : "Inizia dal catalogo"}
        </Link>
        <Link
          href={workspace.compare > 1 ? "/compare" : "/archivio"}
          className="account-link"
        >
          {workspace.compare > 1 ? "Continua il confronto" : "Aggiungi candidati"}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
