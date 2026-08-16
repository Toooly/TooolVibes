import Link from "next/link";

import {
  updateSuggestionStatusAction,
  deleteSuggestionAction,
} from "@/app/(admin)/admin/actions/suggestions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterFilters,
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { formatItalianDate } from "@/lib/utils";
import type { ToolRequestStatus } from "@/lib/types/tool-request";

type SuggestionsPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusLabels: Record<string, string> = {
  created: "Suggerimento creato.",
  deleted: "Suggerimento eliminato.",
  error: "Operazione non riuscita. Controlla lo stato e riprova.",
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
    { href: "/admin/suggestions?view=approved", label: "Approvati", count: runtime.approvedCount, value: "approved" },
    { href: "/admin/suggestions?view=rejected", label: "Rifiutati", count: runtime.rejectedCount, value: "rejected" },
    { href: "/admin/suggestions?view=all", label: "Tutti", count: suggestions.length, value: "all" },
  ];

  return (
    <div className="page-shell py-6">
      <ControlCenterHeader
        title="Suggerimenti"
        description="Revisiona, approva o rifiuta le richieste tool della community."
        metrics={[
          { label: "Aperti", value: runtime.pendingCount },
          { label: "Approvati", value: runtime.approvedCount },
          { label: "Totali", value: suggestions.length },
        ]}
      />

      {status && statusLabels[status] ? (
        <ControlCenterNotice tone={status === "error" ? "warn" : "ok"}>
          {statusLabels[status]}
        </ControlCenterNotice>
      ) : null}

      <ControlCenterFilters items={viewLinks} active={activeView} />

      {filteredSuggestions.length > 0 ? (
        <div>
          {filteredSuggestions.map((suggestion) => (
            <article key={suggestion.id} className="tv-cc-card">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="tv-cc-card__title">{suggestion.tool_name}</h2>
                  <AdminStatusPill
                    active={suggestion.submitter_type === "founder"}
                    activeLabel="Founder"
                    inactiveLabel="Community"
                  />
                  <StatusBadge status={suggestion.status} />
                </div>
                <p className="tv-cc-card__meta">
                  {suggestion.category ? <span>{suggestion.category}</span> : null}
                  {suggestion.email ? <span>{suggestion.email}</span> : null}
                  <span>{formatItalianDate(suggestion.created_at)}</span>
                </p>
                {suggestion.message ? (
                  <p className="tv-cc-card__meta">{suggestion.message}</p>
                ) : null}
                <form action={updateSuggestionStatusAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={suggestion.id} />
                  <label className="block">
                    <span className="tv-cc-kicker">Note interne</span>
                    <textarea
                      name="admin_notes"
                      rows={2}
                      defaultValue={suggestion.admin_notes ?? ""}
                      className="mt-1 w-full rounded-[var(--tv-radius-card)] border border-[var(--tv-border-default)] bg-[var(--tv-input-bg)] px-3 py-2 text-sm text-[var(--tv-input-text)]"
                    />
                  </label>
                  <div className="tv-cc-card__actions">
                    {(suggestion.status === "received" || suggestion.status === "reviewing") ? (
                      <>
                        <button type="submit" name="status" value="reviewing" disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--ghost">
                          In revisione
                        </button>
                        <button type="submit" name="status" value="approved" disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--primary">
                          Approva
                        </button>
                        <button type="submit" name="status" value="rejected" disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--danger">
                          Rifiuta
                        </button>
                      </>
                    ) : (
                      <button type="submit" name="status" value={suggestion.status} disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--secondary">
                        Salva note
                      </button>
                    )}
                    {suggestion.status === "approved" ? (
                      <Link href={`/admin/tools/new?suggestion=${suggestion.id}`} className="tv-cc-btn tv-cc-btn--primary">
                        Crea tool
                      </Link>
                    ) : null}
                    <DeleteWithConfirm
                      action={deleteSuggestionAction.bind(null, suggestion.id)}
                      label="Elimina"
                      disabled={!runtime.canWrite}
                      confirmMessage="Sei sicuro di voler eliminare questo suggerimento?"
                      variant="menu"
                    />
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Nessun suggerimento"
          description="Quando arrivano richieste dalla community, le trovi qui."
        />
      )}
    </div>
  );
}
