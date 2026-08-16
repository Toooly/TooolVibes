"use client";

import { useState } from "react";
import Link from "next/link";

import { DecisionNoteDialog } from "@/components/admin/editor-ux";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { updateToolDecisionMemory } from "@/lib/discovery/local-storage";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";

export function DecisionMemorySection() {
  const snapshot = useDiscoverySnapshot();
  const catalog = usePublicToolCatalog();
  const [editing, setEditing] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const entries = Object.entries(snapshot.decisionMemories).filter(
    ([, memory]) => memory.note || memory.save_reason || memory.is_pinned,
  );
  const editingEntry = editing
    ? entries.find(([slug]) => slug === editing)
    : undefined;

  return (
    <section className="account-section-panel p-5 sm:p-6 space-y-3">
      <p className="account-label">Decisioni</p>
        {entries.length === 0 ? (
          <Link className="account-link" href="/archivio">
            Annota perché lo stai considerando
          </Link>
        ) : (
          entries.map(([slug, memory]) => {
            const tool = catalog.find((item) => item.slug === slug);
            return (
              <article key={slug} className="account-decision-card rounded-2xl p-4">
                <p className="text-sm font-semibold">Perché {tool?.name ?? slug}</p>
                <p className="mt-1 text-sm opacity-70">
                  {memory.save_reason || (memory.note ? "Nota personale salvata" : "Appuntato nella memoria.")}
                </p>
                {memory.updated_at ? (
                  <p className="mt-1 text-xs opacity-50">Aggiornata {memory.updated_at.slice(0, 10)}</p>
                ) : null}
                {savedSlug === slug ? (
                  <p className="mt-2 text-sm font-semibold text-[var(--account-violet)]" role="status">Nota aggiornata.</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link className="account-link" href={`/toools/${slug}`}>Riapri</Link>
                  <button type="button" className="account-link" onClick={() => setEditing(slug)}>
                    {memory.note ? "Modifica nota" : "Annota perché lo stai considerando"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      <DecisionNoteDialog
        open={Boolean(editing)}
        title={editing ? `Nota su ${catalog.find((item) => item.slug === editing)?.name ?? editing}` : "Nota"}
        initialValue={editingEntry?.[1].note ?? ""}
        onClose={() => setEditing(null)}
        onSave={(note) => {
          if (!editing) return;
          updateToolDecisionMemory(editing, { note, updated_at: new Date().toISOString() });
          setSavedSlug(editing);
        }}
      />
    </section>
  );
}
