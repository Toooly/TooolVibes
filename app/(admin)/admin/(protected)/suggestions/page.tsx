import Link from "next/link";

import {
  updateSuggestionStatusAction,
  deleteSuggestionAction,
} from "@/app/(admin)/admin/actions/suggestions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { SectionHeading } from "@/components/sections/section-heading";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { formatItalianDate } from "@/lib/utils";
import type { ToolRequestStatus } from "@/lib/types/tool-request";

type SuggestionsPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusLabels: Record<string, string> = {
  created: "Suggerimento creato.",
  deleted: "Suggerimento eliminato.",
  error: "Operazione non riuscita. Controlla il runtime e riprova.",
};

const suggestionStatusConfig: Record<
  ToolRequestStatus,
  { active: boolean; activeLabel: string; inactiveLabel: string }
> = {
  received: { active: false, activeLabel: "", inactiveLabel: "Ricevuto" },
  reviewing: { active: true, activeLabel: "In revisione", inactiveLabel: "" },
  approved: { active: true, activeLabel: "Approvato", inactiveLabel: "" },
  rejected: { active: false, activeLabel: "", inactiveLabel: "Rifiutato" },
};

function StatusBadge({ status }: { status: ToolRequestStatus }) {
  const config = suggestionStatusConfig[status];
  if (config.active) {
    return <AdminStatusPill active activeLabel={config.activeLabel} inactiveLabel="" />;
  }
  return <AdminStatusPill active={false} activeLabel="" inactiveLabel={config.inactiveLabel} />;
}

export default async function SuggestionsPage({ searchParams }: SuggestionsPageProps) {
  const [{ status, view }, runtime] = await Promise.all([searchParams, getSuggestionsRuntime()]);
  const suggestions = runtime.suggestions;
  const activeView = view ?? "open";
  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (activeView === "all") return true;
    if (activeView === "open") {
      return suggestion.status === "received" || suggestion.status === "reviewing";
    }
    return suggestion.status === activeView;
  });
  const viewLinks = [
    { href: "/admin/suggestions", label: "Aperti", count: runtime.pendingCount, value: "open" },
    {
      href: "/admin/suggestions?view=approved",
      label: "Approvati",
      count: runtime.approvedCount,
      value: "approved",
    },
    {
      href: "/admin/suggestions?view=rejected",
      label: "Rifiutati",
      count: runtime.rejectedCount,
      value: "rejected",
    },
    { href: "/admin/suggestions?view=all", label: "Tutti", count: suggestions.length, value: "all" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <section className="brand-panel brand-aura rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Suggerimenti"
              title="Richieste e suggerimenti tool dagli utenti"
              description="Gli utenti possono suggerire tool da aggiungere al catalogo. Qui puoi revisionare, approvare o rifiutare ogni suggerimento."
            />
            <Link
              href="/admin"
              className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
            >
              Torna alla dashboard
            </Link>
          </div>

          {status && statusLabels[status] ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: "rgba(15,118,110,0.18)",
                background: "rgba(236,253,245,0.95)",
              }}
            >
              {statusLabels[status]}
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-8 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {[
              { label: "Totali", value: suggestions.length },
              { label: "In attesa", value: runtime.pendingCount },
              { label: "Approvati", value: runtime.approvedCount },
              { label: "Rifiutati", value: runtime.rejectedCount },
            ].map((item) => (
              <article
                key={item.label}
                className="w-[11rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
              >
                <p
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </p>
                <p className="mt-3 text-4xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 hidden gap-4 sm:grid lg:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Totali", value: suggestions.length },
              { label: "In attesa", value: runtime.pendingCount },
              { label: "Approvati", value: runtime.approvedCount },
              { label: "Rifiutati", value: runtime.rejectedCount },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-[var(--radius-lg)] border p-5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
              >
                <p
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </p>
                <p className="mt-3 text-4xl">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div>
              <p className="editorial-label">Workspace suggerimenti</p>
              <h2 className="text-display-card mt-2 text-[1.58rem] sm:text-[1.82rem]">
                Tutte le richieste tool
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewLinks.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  className="button-shell button-secondary rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)]"
                  style={{
                    background:
                      activeView === item.value ? "rgba(106,60,255,0.12)" : undefined,
                  }}
                >
                  {item.label} ({item.count})
                </Link>
              ))}
            </div>
          </div>

          {filteredSuggestions.length > 0 ? (
            <div className="mt-6 space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <article
                  key={suggestion.id}
                  className="interactive-surface relative overflow-hidden rounded-[var(--radius-xl)] border p-5"
                  style={{
                    borderColor: "var(--line)",
                    background: "rgba(255,255,255,0.76)",
                  }}
                >
                  <div className="card-glow absolute inset-0" />
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl">{suggestion.tool_name}</h2>
                      <StatusBadge status={suggestion.status} />
                    </div>

                    <div className="grid gap-3 text-sm" style={{ color: "var(--muted)" }}>
                      {suggestion.tool_url ? (
                        <p>
                          URL:{" "}
                          <a
                            href={suggestion.tool_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                            style={{ color: "var(--accent-strong)" }}
                          >
                            {suggestion.tool_url}
                          </a>
                        </p>
                      ) : null}
                      {suggestion.category ? <p>Categoria: {suggestion.category}</p> : null}
                      {suggestion.level ? <p>Livello: {suggestion.level}</p> : null}
                      {suggestion.email ? <p>Email: {suggestion.email}</p> : null}
                      {suggestion.message ? (
                        <p>Messaggio: {suggestion.message}</p>
                      ) : null}
                      {suggestion.admin_notes ? (
                        <p>
                          Note admin:{" "}
                          <span style={{ color: "var(--muted-strong)" }}>
                            {suggestion.admin_notes}
                          </span>
                        </p>
                      ) : null}
                      <p>Ricevuto: {formatItalianDate(suggestion.created_at)}</p>
                    </div>

                    <form action={updateSuggestionStatusAction} className="space-y-3">
                      <input type="hidden" name="id" value={suggestion.id} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold">Note admin</span>
                        <textarea
                          name="admin_notes"
                          rows={2}
                          defaultValue={suggestion.admin_notes ?? ""}
                          placeholder="Aggiungi note interne su questo suggerimento..."
                          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(suggestion.status === "received" || suggestion.status === "reviewing") ? (
                          <>
                            <button
                              type="submit"
                              name="status"
                              value="reviewing"
                              disabled={!runtime.canWrite}
                              className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              In revisione
                            </button>
                            <button
                              type="submit"
                              name="status"
                              value="approved"
                              disabled={!runtime.canWrite}
                              className="button-shell rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                              }}
                            >
                              Approva
                            </button>
                            <button
                              type="submit"
                              name="status"
                              value="rejected"
                              disabled={!runtime.canWrite}
                              className="button-shell rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                              style={{
                                background: "linear-gradient(135deg, #9a4130, #7f2f22)",
                              }}
                            >
                              Rifiuta
                            </button>
                          </>
                        ) : (
                          <button
                            type="submit"
                            name="status"
                            value={suggestion.status}
                            disabled={!runtime.canWrite}
                            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            Salva note
                          </button>
                        )}
                      </div>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.status === "approved" ? (
                        <Link
                          href={`/admin/new?suggestion=${suggestion.id}`}
                          className="button-shell rounded-full px-4 py-2 text-sm font-semibold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                          }}
                        >
                          Crea tool da suggerimento
                        </Link>
                      ) : null}
                      <DeleteWithConfirm
                        action={deleteSuggestionAction.bind(null, suggestion.id)}
                        label="Elimina"
                        disabled={!runtime.canWrite}
                        confirmMessage="Sei sicuro di voler eliminare questo suggerimento?"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="Nessun suggerimento"
              description="Non ci sono ancora richieste tool dagli utenti. Quando arriveranno, le troverai qui."
            />
          )}
        </section>
      </div>
    </div>
  );
}
