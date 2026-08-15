import Link from "next/link";

import {
  deleteToolAction,
  toggleFeaturedAction,
  togglePublishedAction,
} from "@/app/(admin)/admin/actions/tools";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { SectionHeader } from "@/components/ui/section-header";
import {
  getAdminToolWarningLabel,
  getAdminToolsRuntime,
} from "@/lib/admin/tool-queries";
import { formatItalianDate } from "@/lib/utils";

type AdminToolsPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Tool creato correttamente.",
  updated: "Tool aggiornato correttamente.",
  deleted: "Tool eliminato correttamente.",
};

function getReadSourceLabel(source: string) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "snapshot":
      return "Copia locale";
    default:
      return source;
  }
}

export default async function AdminToolsPage({ searchParams }: AdminToolsPageProps) {
  const [{ status, view }, runtime] = await Promise.all([
    searchParams,
    getAdminToolsRuntime(),
  ]);
  const activeView = view ?? "all";
  const publishedCount = runtime.tools.filter((tool) => tool.is_published).length;
  const draftCount = runtime.tools.length - publishedCount;
  const featuredCount = runtime.tools.filter((tool) => tool.is_featured).length;
  const affiliateCount = runtime.tools.filter((tool) => Boolean(tool.affiliate_url)).length;
  const filteredTools = runtime.tools.filter((tool) => {
    if (activeView === "published") return tool.is_published;
    if (activeView === "draft") return !tool.is_published;
    if (activeView === "featured") return tool.is_featured;
    if (activeView === "affiliate") return Boolean(tool.affiliate_url);
    return true;
  });
  const filterLinks = [
    { href: "/admin/tools", label: "Tutti", value: "all", count: runtime.tools.length },
    { href: "/admin/tools?view=published", label: "Pubblicati", value: "published", count: publishedCount },
    { href: "/admin/tools?view=draft", label: "Bozze", value: "draft", count: draftCount },
    { href: "/admin/tools?view=featured", label: "In evidenza", value: "featured", count: featuredCount },
    { href: "/admin/tools?view=affiliate", label: "Affiliate", value: "affiliate", count: affiliateCount },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <section className="brand-panel brand-aura rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeader
              eyebrow="Gestione tool"
              title="Catalogo operativo, non solo lista."
              description="Qui gestisci i tool che alimentano homepage, catalogo, raccolte, confronto e schede pubbliche."
            />
            <div className="admin-sticky-actions flex flex-wrap gap-3">
              <Link
                href="/admin/tools/new"
                className="button-shell button-primary rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-strong), var(--accent) 70%, var(--cyan))",
                }}
              >
                Nuovo tool
              </Link>
              <Link
                href="/admin"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {status && statusMessages[status] ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: "rgba(15,118,110,0.18)",
                background: "rgba(236,253,245,0.95)",
              }}
            >
              {statusMessages[status]}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tool totali", value: runtime.tools.length },
              { label: "Pubblicati", value: publishedCount },
              { label: "In evidenza", value: featuredCount },
              { label: "Affiliate", value: affiliateCount },
            ].map((item) => (
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

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <div
              className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{
                borderColor: runtime.canWrite ? "rgba(15,118,110,0.18)" : "rgba(161,105,47,0.18)",
                background: runtime.canWrite ? "rgba(240,253,250,0.9)" : "rgba(255,251,235,0.96)",
              }}
            >
              {runtime.writeMessage}
            </div>
            <div
              className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(245,242,255,0.92)" }}
            >
              Lettura interna: <strong>{getReadSourceLabel(runtime.adminReadSource)}</strong>.
            </div>
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
              <p className="editorial-label">Inventario tool</p>
              <h2 className="text-display-card mt-2 text-[1.58rem] sm:text-[1.82rem]">
                Tool gestibili dal back office
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterLinks.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  className="button-shell button-secondary rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)]"
                  style={{
                    background: activeView === item.value ? "rgba(106,60,255,0.12)" : undefined,
                  }}
                >
                  {item.label} ({item.count})
                </Link>
              ))}
            </div>
          </div>

          {filteredTools.length > 0 ? (
            <div className="mt-6 space-y-4">
              {filteredTools.map((tool) => (
                <article
                  key={tool.id}
                  className="interactive-surface relative overflow-hidden rounded-[var(--radius-xl)] border p-5"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
                >
                  <div className="card-glow absolute inset-0" />
                  <div className="relative grid gap-5 xl:grid-cols-[1.35fr_0.9fr_auto]">
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
                          activeLabel="In evidenza"
                          inactiveLabel="Standard"
                        />
                      </div>
                      <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                        {tool.short_description_it}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                        <span>Slug: {tool.slug}</span>
                        <span>Categoria: {tool.category}</span>
                        <span>Scoperto: {formatItalianDate(tool.date_discovered)}</span>
                        <span>Aggiornato: {formatItalianDate(tool.updated_at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tool.tags.slice(0, 8).map((tag) => (
                          <span
                            key={tag}
                            className="selection-chip rounded-full border px-3 py-1 text-xs font-medium"
                            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {[
                        { label: "Fonte", value: tool.source },
                        { label: "Link principale", value: tool.affiliate_url ? "Affiliate" : "Website" },
                        { label: "Stato pubblico", value: tool.is_published ? "Visibile" : "Nascosto" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[22px] border px-4 py-3"
                          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)" }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/tools/${tool.id}/edit`}
                        className="button-shell button-primary rounded-full px-4 py-2 text-center text-sm font-semibold text-white"
                      >
                        Modifica
                      </Link>
                      {tool.is_published ? (
                        <Link
                          href={`/toools/${tool.slug}`}
                          className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                        >
                          Apri scheda
                        </Link>
                      ) : null}
                      <form action={toggleFeaturedAction.bind(null, tool.id, !tool.is_featured)}>
                        <button
                          type="submit"
                          disabled={!runtime.canWrite}
                          className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {tool.is_featured ? "Rimuovi evidenza" : "Metti in evidenza"}
                        </button>
                      </form>
                      <form action={togglePublishedAction.bind(null, tool.id, !tool.is_published)}>
                        <button
                          type="submit"
                          disabled={!runtime.canWrite}
                          className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {tool.is_published ? "Torna in bozza" : "Pubblica"}
                        </button>
                      </form>
                      <DeleteWithConfirm
                        action={deleteToolAction.bind(null, tool.id)}
                        label="Elimina"
                        disabled={!runtime.canWrite}
                        confirmMessage="Sei sicuro di voler eliminare questo tool? L'azione e' irreversibile."
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="Nessun tool in questa vista"
              description="Cambia filtro o crea un nuovo tool per alimentare il catalogo."
              ctaHref="/admin/tools/new"
              ctaLabel="Nuovo tool"
            />
          )}
        </section>
      </div>
    </div>
  );
}
