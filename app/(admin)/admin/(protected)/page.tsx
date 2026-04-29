import Link from "next/link";

import {
  deleteToolAction,
  toggleFeaturedAction,
  togglePublishedAction,
} from "@/app/(admin)/admin/actions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { SectionHeading } from "@/components/sections/section-heading";
import {
  getAdminToolWarningLabel,
  getAdminToolsRuntime,
} from "@/lib/admin/tool-queries";
import { formatItalianDate } from "@/lib/utils";

type AdminDashboardPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Tool creato correttamente.",
  updated: "Tool aggiornato correttamente.",
  deleted: "Tool eliminato correttamente.",
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const [{ status }, runtime] = await Promise.all([searchParams, getAdminToolsRuntime()]);
  const tools = runtime.tools;
  const canWrite = runtime.canWrite;
  const publishedCount = tools.filter((tool) => tool.is_published).length;
  const featuredCount = tools.filter((tool) => tool.is_featured).length;
  const draftCount = tools.length - publishedCount;
  const dashboardMetrics = [
    { label: "Totale tool", value: tools.length },
    { label: "Pubblicati", value: publishedCount },
    { label: "In evidenza", value: featuredCount },
    { label: "In bozza", value: draftCount },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <section className="brand-panel brand-aura rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Tools dashboard"
              title="Gestione strumenti, publishing e segnali runtime."
              description="La surface tools lavora ora con fallback intenzionale, source visibility e quick actions pi? robuste. Quando Supabase non ? pienamente accessibile, il pannello resta leggibile e smette di fingere di essere live."
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
                Crea un nuovo tool
              </Link>
              <Link
                href="/admin/collections"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Apri collections
              </Link>
            </div>
          </div>

          {status && statusMessages[status] ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(236,253,245,0.95)" }}
            >
              {statusMessages[status]}
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-8 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {dashboardMetrics.map((item) => (
              <article
                key={item.label}
                className="w-[11rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.label}
                </p>
                <p className="mt-3 text-4xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 hidden gap-4 sm:grid lg:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((item) => (
              <article
                key={item.label}
                className="rounded-[var(--radius-lg)] border p-5"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.label}
                </p>
                <p className="mt-3 text-4xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="brand-panel rounded-[28px] p-5">
              <p className="editorial-label">Workspace runtime</p>
              <h2 className="text-display-card mt-2 text-[1.46rem]">
                Read path, write path e fallback coerenti
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
                {runtime.readMessage}
              </p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                {runtime.writeMessage}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Admin read: {runtime.adminReadSource}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Requested: {runtime.requestedAdminReadSource}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Write target: {runtime.writeTarget ?? "locked"}
                </span>
              </div>
            </article>

            <article className="dark-panel rounded-[28px] p-5 text-white">
              <p className="editorial-label !text-white/60">Public delivery</p>
              <h2 className="text-display-card mt-2 text-[1.46rem] text-white">
                Il feed pubblico tools resta leggibile anche in degrado
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Source attiva: <strong>{runtime.publicSnapshot.source}</strong>. Richiesta:
                {" "}
                <strong>{runtime.publicSnapshot.requestedSource}</strong>. Tool live nel feed:
                {" "}
                <strong>{runtime.publicSnapshot.tools.length}</strong>.
              </p>
              <p className="mt-2 text-sm leading-7 text-white/66">
                Le quick actions qui sotto restano abilitate solo quando il runtime tools ?
                davvero scrivibile, non solo quando le env sembrano presenti.
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

        <section className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div>
              <p className="editorial-label">Workspace tools</p>
              <h2 className="text-display-card mt-2 text-[1.58rem] sm:text-[1.82rem]">
                Inventario editoriale completo, con azioni rapide.
              </h2>
              <p className="mt-3 max-w-[44rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
                La lista sottostante ? il punto di lavoro quotidiano: stato, tag, visibilit?
                pubblica e accesso diretto alla scheda.
              </p>
            </div>
            <div
              className="rounded-[22px] border px-4 py-3 text-sm"
              style={{
                borderColor: canWrite ? "rgba(15,118,110,0.18)" : "rgba(161,105,47,0.18)",
                background: canWrite ? "rgba(240,253,250,0.9)" : "rgba(255,251,235,0.96)",
              }}
            >
              {canWrite
                ? "Quick actions attive: featured, publish e delete scrivono su Supabase."
                : "Quick actions in pausa: il runtime tools non ? in stato scrivibile."}
            </div>
          </div>

          {tools.length > 0 ? (
            <div className="mt-6 space-y-4">
              {tools.map((tool) => (
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
                        activeLabel="Pubblicato"
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
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
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
                        Apri public page
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/${tool.id}/edit`}
                      className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-center text-[var(--muted-strong)]"
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

                    <form action={deleteToolAction.bind(null, tool.id)}>
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="button-shell w-full rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                        style={{ background: "linear-gradient(135deg, #9a4130, #7f2f22)" }}
                      >
                        Elimina
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="Nessun tool presente"
              description="Quando il database sara` popolato, qui vedrai la lista completa con azioni editoriali rapide."
              ctaHref="/admin/new"
              ctaLabel="Aggiungi il primo tool"
            />
          )}
        </section>
      </div>
    </div>
  );
}
