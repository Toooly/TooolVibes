"use client";

import { useEffect, useMemo, useState } from "react";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import type { ToolRecord } from "@/lib/types/tool";
import {
  toggleToolPin,
  updateToolDecisionMemory,
} from "@/lib/discovery/local-storage";
import {
  formatDecisionTimestamp,
  getSaveReasonMeta,
  getToolMemorySignals,
  saveReasonOptions,
} from "@/lib/tools/discovery";

import { useDiscoveryPersistence } from "@/components/discovery/discovery-persistence-provider";
import { ShortlistStageToggle } from "@/components/tools/shortlist-stage-toggle";

type ToolWorkspacePanelProps = {
  tool: ToolRecord;
};

export function ToolWorkspacePanel({ tool }: ToolWorkspacePanelProps) {
  const persistence = useDiscoveryPersistence();
  const discovery = useDiscoverySnapshot();
  const memory = useMemo(
    () => discovery.decisionMemories[tool.slug] ?? {},
    [discovery.decisionMemories, tool.slug],
  );
  const [noteDraft, setNoteDraft] = useState(memory.note ?? "");

  useEffect(() => {
    setNoteDraft(memory.note ?? "");
  }, [memory.note, tool.slug]);

  const noteIsDirty = noteDraft.trim() !== (memory.note ?? "");
  const memorySignals = useMemo(() => getToolMemorySignals(memory), [memory]);
  const persistenceLabel =
    persistence.mode === "remote"
      ? persistence.phase === "saving"
        ? "Sync in corso"
        : persistence.phase === "error"
          ? "Sync in pausa"
          : "Workspace sincronizzata"
      : "Salvato nel browser";

  return (
    <div className="metadata-block shortlist-workspace-panel rounded-[24px] px-3.5 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="editorial-label">Workspace personale</p>
          <p className="mt-2 text-[0.86rem] leading-6" style={{ color: "var(--muted-strong)" }}>
            Il punto in cui segnare perche&apos; {tool.name} merita ancora un passaggio nel tuo stack.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleToolPin(tool.slug)}
          className={`selection-chip text-ui-strong inline-flex items-center gap-2 rounded-full border px-2.75 py-1.25 text-[0.64rem] font-semibold uppercase tracking-[0.14em] ${
            memory.is_pinned ? "quick-filter-chip is-active" : ""
          }`}
          style={
            memory.is_pinned
              ? undefined
              : {
                  borderColor: "var(--line)",
                  background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
                  color: "var(--muted-strong)",
                }
          }
        >
          {memory.is_pinned ? "In primo piano" : "Metti in primo piano"}
        </button>
      </div>

      {memorySignals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {memorySignals.map((signal) => (
            <span
              key={signal.label}
              className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: "var(--line)", background: signal.background, color: signal.tone }}
            >
              {signal.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <p className="editorial-label">Stato decisionale</p>
        <div className="mt-3">
          <ShortlistStageToggle slug={tool.slug} />
        </div>
      </div>

      <div className="mt-4">
        <p className="editorial-label">Motivo del salvataggio</p>
        <div className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {saveReasonOptions.map((option) => {
            const meta = getSaveReasonMeta(option);
            const active = memory.save_reason === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateToolDecisionMemory(tool.slug, {
                    save_reason: active ? undefined : option,
                  })
                }
              className={`selection-chip text-ui-strong inline-flex shrink-0 rounded-full border px-2.75 py-1.25 text-[0.64rem] font-semibold uppercase tracking-[0.14em] ${
                active ? "quick-filter-chip is-active" : ""
              }`}
                style={
                  active
                    ? {
                        borderColor: "rgba(112,82,255,0.24)",
                        background: meta.background,
                        color: meta.tone,
                      }
                    : {
                        borderColor: "var(--line)",
                        background: "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
                        color: "var(--muted-strong)",
                      }
                }
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label className="editorial-label" htmlFor={`${tool.slug}-workspace-note`}>
          Nota personale
        </label>
        <textarea
          id={`${tool.slug}-workspace-note`}
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          rows={2}
          placeholder={`Segnati cosa ti interessa davvero di ${tool.name}...`}
          className="filter-control mt-3 w-full rounded-[18px] border px-4 py-3 outline-none"
          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.84)" }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              Ultimo salvataggio: {formatDecisionTimestamp(memory.updated_at)}
            </p>
            <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              {persistenceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateToolDecisionMemory(tool.slug, { note: noteDraft })}
            disabled={!noteIsDirty}
            className="selection-chip text-ui-strong inline-flex items-center rounded-full border px-2.75 py-1.25 text-[0.64rem] font-semibold uppercase tracking-[0.14em] disabled:cursor-default disabled:opacity-55"
            style={{
              borderColor: noteIsDirty ? "rgba(112,82,255,0.24)" : "var(--line)",
              background: noteIsDirty
                ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
                : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
              color: noteIsDirty ? "var(--accent-strong)" : "var(--muted)",
            }}
          >
            {noteIsDirty ? "Salva nota" : "Nota salvata"}
          </button>
        </div>
      </div>
    </div>
  );
}
