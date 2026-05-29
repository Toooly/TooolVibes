import Link from "next/link";

import {
  deleteToolAction,
  toggleFeaturedAction,
  togglePublishedAction,
} from "@/app/(admin)/admin/actions/tools";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { SectionHeading } from "@/components/sections/section-heading";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import {
  getAdminToolWarningLabel,
  getAdminToolsRuntime,
} from "@/lib/admin/tool-queries";
import { formatItalianDate } from "@/lib/utils";

type AdminDashboardPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Tool creato correttamente.",
  updated: "Tool aggiornato correttamente.",
  deleted: "Tool eliminato correttamente.",
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const [{ status, view }, runtime, suggestionsRuntime] = await Promise.all([
    searchParams,
    getAdminToolsRuntime(),
    getSuggestionsRuntime(),
  ]);
  const tools = runtime.tools;
  const approvedSuggestions = suggestionsRuntime.suggestions.filter(
    (suggestion) => suggestion.status === "approved",
  );
  const canWrite = runtime.canWrite;
  const activeView = view ?? "all";
  const publishedCount = tools.filter((tool) => tool.is_published).length;
  const featuredCount = tools.filter((tool) => tool.is_featured).length;
  const draftCount = tools.length - publishedCount;
  const suggestedCount = tools.filter((tool) =>
    `${tool.source} ${tool.tags.join(" ")}`.toLowerCase().includes("suggerimento"),
  ).length;
  const filteredTools = tools.filter((tool) => {
    if (activeView === "all") return true;
    if (activeView === "published") return tool.is_published;
    if (activeView === "draft") return !tool.is_published;
    if (activeView === "featured") return tool.is_featured;
    if (activeView === "suggested") {
      return `${tool.source} ${tool.tags.join(" ")}`.toLowerCase().includes("suggerimento");
    }
    if (activeView === "workbench") return !tool.is_published;
    if (activeView === "approved-suggestions") return false;
    return true;
  });
  const visibleApprovedSuggestions =
    activeView === "approved-suggestions" || activeView === "workbench"
      ? approvedSuggestions
      : [];
  const dashboardMetrics = [
    { label: "Totale tool", value: tools.length },
    { label: "Attivi", value: publishedCount },
    { label: "Bozze", value: draftCount },
    { label: "Da suggerimenti", value: approvedSuggestions.length },
  ];
  const filterLinks = [
    { href: "/admin", label: "Tutti", value: "all", count: tools.length },
    {
      href: "/admin?view=published",
      label: "Attivi",
      value: "published",
      count: publishedCount,
    },
    { href: "/admin?view=draft", label: "Bozze", value: "draft", count: draftCount },
    {
      href: "/admin?view=workbench",
      label: "Da lavorare",
      value: "workbench",
      count: draftCount + approvedSuggestions.length,
    },
    {
      href: "/admin?view=approved-suggestions",
      label: "Approvati da modificare",
      value: "approved-suggestions",
      count: approvedSuggestions.length,
    },
    { href: "/admin?view=featured", label: "Featured", value: "featured", count: featuredCount },
    {
      href: "/admin?view=suggested",
      label: "Gia da suggerimenti",
      value: "suggested",
      count: suggestedCount,
    },
  ];

  return (
    <div className="page-shell py-7 sm:py-9">
      <div className="space-y-5">
        <section className="brand-panel rounded-[var(--radius-xl)] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Tools dashboard"
              title="Tool, bozze e suggerimenti approvati"
              description="Una lista di lavoro unica: tool attivi, tool in bozza e suggerimenti approvati che devono ancora diventare schede complete."
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/new"
                className="button-shell button-primary rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-strong), var(--accent) 70%, var(--cyan))",
                }}
              >
                Crea nuovo tool
              </Link>
              <Link
                href="/admin/suggestions"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Suggerimenti
              </Link>
            </div>
          </div>

          {status && statusMessages[status] ? (
            <div
              className="mt-5 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: "rgba(15,118,110,0.18)",
                background: "rgba(236,253,245,0.95)",
              }}
            >
              {statusMessages[status]}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((item) => (
              <article
                key={item.label}
                className="rounded-[var(--radius-lg)] border p-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-3xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.7fr)]">
            <article className="rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.68)" }}>
              <p className="editorial-label">Flusso editoriale</p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                I suggerimenti approvati rimangono nella vista &quot;Approvati da modificare&quot; finche
                non crei la scheda tool. Le bozze sono schede gia presenti nel catalogo ma non
                ancora pubblicate.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Approvati: {approvedSuggestions.length}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Bozze: {draftCount}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Write: {runtime.writeTarget ?? "locked"}
                </span>
              </div>
            </article>

            <article className="rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.68)" }}>
              <p className="editorial-label">Stato tecnico</p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                Source pubblica: <strong>{runtime.publicSnapshot.source}</strong>. Tool live:{" "}
                <strong>{runtime.publicSnapshot.tools.length}</strong>.
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                {runtime.writeMessage}
              </p>
            </article>
          </div>

          {runtime.warnings.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {runtime.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(161,105,47,0.18)",
                    background: "rgba(255,251,235,0.96)",
                  }}
                >
                  {getAdminToolWarningLabel(warning)}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="surface-card rounded-[var(--radius-xl)] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div>
              <p className="editorial-label">Workspace tools</p>
              <h2 className="text-display-card mt-2 text-[1.5rem] sm:text-[1.75rem]">
                Inventario operativo
              </h2>
              <p className="mt-3 max-w-[44rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
                Filtra per stato e lavora nello stesso punto su tool gia creati e suggerimenti
                approvati da trasformare.
              </p>
            </div>
            <div className="grid gap-3">
              <div
                className="rounded-[20px] border px-4 py-3 text-sm"
                style={{
                  borderColor: canWrite ? "rgba(15,118,110,0.18)" : "rgba(161,105,47,0.18)",
                  background: canWrite ? "rgba(240,253,250,0.9)" : "rgba(255,251,235,0.96)",
                }}
              >
                {canWrite
                  ? "Azioni rapide attive su Supabase."
                  : "Azioni rapide in pausa: runtime non scrivibile."}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterLinks.map((item) => (
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
          </div>

          {visibleApprovedSuggestions.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {visibleApprovedSuggestions.map((suggestion) => (
                <article
                  key={suggestion.id}
                  className="relative overflow-hidden rounded-[var(--radius-xl)] border p-5"
                  style={{
                    borderColor: "rgba(106,60,255,0.18)",
                    background: "rgba(246,242,255,0.82)",
                  }}
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminStatusPill
                          active
                          activeLabel="Suggerimento approvato"
                          inactiveLabel=""
                        />
                        {suggestion.category ? (
                          <span className="selection-chip rounded-full border px-3 py-1 text-xs font-medium">
                            {suggestion.category}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-2xl">{suggestion.tool_name}</h3>
                      <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                        {suggestion.message ??
                          "Approvato: ora va trasformato in una scheda tool completa prima della pubblicazione."}
                      </p>
                      <div
                        className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                        style={{ color: "var(--muted)" }}
                      >
                        <span>Livello: {suggestion.level}</span>
                        {suggestion.email ? <span>Da: {suggestion.email}</span> : null}
                        <span>Ricevuto: {formatItalianDate(suggestion.created_at)}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[14rem] lg:grid-cols-1">
                      <Link
                        href={`/admin/new?suggestion=${suggestion.id}`}
                        className="button-shell rounded-full px-4 py-2 text-center text-sm font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                        }}
                      >
                        Crea scheda tool
                      </Link>
                      <Link
                        href={suggestion.tool_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                      >
                        Apri sito
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {filteredTools.length > 0 ? (
            <div className="mt-6 space-y-4">
              {filteredTools.map((tool) => (
                <article
                  key={tool.id}
                  className="interactive-surface relative overflow-hidden rounded-[var(--radius-xl)] border p-5 lg:grid-cols-[1.5fr_1fr_auto]"
                  style={{
                    display: "grid",
                    gap: "1.25rem",
                    borderColor: "var(--line)",
                    background: "rgba(255,255,255,0.76)",
                  }}
                >
                  <div className="card-glow absolute inset-0" />
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl">{tool.name}</h2>
                      <AdminStatusPill
                        active={tool.is_published}
                        activeLabel="Attivo"
                        inactiveLabel="Bozza"
                      />
                      <AdminStatusPill
                        active={tool.is_featured}
                        activeLabel="Featured"
                        inactiveLabel="Standard"
                      />
                    </div>
                    <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                      {tool.short_description_it}
                    </p>
                    <div
                      className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>{tool.category}</span>
                      <span>Slug: {tool.slug}</span>
                      <span>Scoperto: {formatItalianDate(tool.date_discovered)}</span>
                      <span>Fonte: {tool.source}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    {tool.tags.length > 0 ? (
                      tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="selection-chip rounded-full border px-3 py-1 text-xs font-medium"
                          style={{
                            borderColor: "var(--line)",
                            background: "rgba(255,255,255,0.82)",
                          }}
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <div
                        className="rounded-[22px] border px-4 py-3 text-sm"
                        style={{
                          borderColor: "var(--line)",
                          background: "rgba(255,255,255,0.74)",
                          color: "var(--muted)",
                        }}
                      >
                        Nessun tag assegnato.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {tool.is_published ? (
                      <Link
                        href={`/toools/${tool.slug}`}
                        className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                      >
                        Apri pagina pubblica
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/${tool.id}/edit`}
                      className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                    >
                      Modifica
                    </Link>

                    <form action={toggleFeaturedAction.bind(null, tool.id, !tool.is_featured)}>
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {tool.is_featured ? "Rimuovi featured" : "Metti in featured"}
                      </button>
                    </form>

                    <form action={togglePublishedAction.bind(null, tool.id, !tool.is_published)}>
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {tool.is_published ? "Torna in bozza" : "Pubblica"}
                      </button>
                    </form>

                    <DeleteWithConfirm
                      action={deleteToolAction.bind(null, tool.id)}
                      label="Elimina"
                      disabled={!canWrite}
                      confirmMessage="Sei sicuro di voler eliminare questo tool? L'azione e irreversibile."
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : visibleApprovedSuggestions.length === 0 ? (
            <AdminEmptyState
              title="Nessun elemento in questa vista"
              description="Cambia filtro oppure crea un nuovo tool quando hai una scheda pronta da lavorare."
              ctaHref="/admin/new"
              ctaLabel="Aggiungi tool"
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
