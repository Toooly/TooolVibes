import Link from "next/link";

import {
  deleteArticleAction,
  toggleArticleFeaturedAction,
  toggleArticlePublishedAction,
} from "@/app/(admin)/admin/actions/articles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { SectionHeading } from "@/components/sections/section-heading";
import {
  getAdminArticleWarningLabel,
  getAdminArticlesRuntime,
} from "@/lib/admin/article-queries";
import type { BlogArticleRecord } from "@/lib/types/article";
import { formatItalianDate } from "@/lib/utils";

type AdminDashboardPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Articolo creato correttamente.",
  updated: "Articolo aggiornato correttamente.",
  deleted: "Articolo eliminato correttamente.",
};

const kindLabels: Record<BlogArticleRecord["kind"], string> = {
  editorial: "Blog",
  guide: "Guida",
  "tool-writeup": "Tool writeup",
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const [{ status, view }, runtime] = await Promise.all([
    searchParams,
    getAdminArticlesRuntime(),
  ]);
  const articles = runtime.articles;
  const canWrite = runtime.canWrite;
  const activeView = view ?? "all";
  const publishedCount = articles.filter((article) => article.status === "published").length;
  const featuredCount = articles.filter((article) => article.featured).length;
  const draftCount = articles.length - publishedCount;
  const filteredArticles = articles.filter((article) => {
    if (activeView === "all") return true;
    if (activeView === "published") return article.status === "published";
    if (activeView === "draft") return article.status === "draft";
    if (activeView === "featured") return article.featured;
    return true;
  });
  const dashboardMetrics = [
    { label: "Articoli", value: articles.length },
    { label: "Pubblicati", value: publishedCount },
    { label: "Bozze", value: draftCount },
    { label: "Featured", value: featuredCount },
  ];
  const filterLinks = [
    { href: "/admin", label: "Tutti", value: "all", count: articles.length },
    {
      href: "/admin?view=published",
      label: "Pubblicati",
      value: "published",
      count: publishedCount,
    },
    { href: "/admin?view=draft", label: "Bozze", value: "draft", count: draftCount },
    {
      href: "/admin?view=featured",
      label: "Featured",
      value: "featured",
      count: featuredCount,
    },
  ];

  return (
    <div className="page-shell py-7 sm:py-9">
      <div className="space-y-5">
        <section className="brand-panel rounded-[var(--radius-xl)] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Gestione blog"
              title="Crea, modifica e pubblica articoli"
              description="Una console dedicata al blog: bozze, contenuti pubblicati, featured e editing editoriale con media nel corpo articolo."
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
                Nuovo articolo
              </Link>
              <Link
                href="/posts"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Blog pubblico
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
            <article
              className="rounded-[24px] border p-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.68)" }}
            >
              <p className="editorial-label">Flusso blog</p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                Qui lavoriamo solo su articoli: creazione, modifica, media nel corpo e
                pubblicazione. La parte tool e suggerimenti non entra in questa vista.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Pubblicati: {publishedCount}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Bozze: {draftCount}
                </span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                  Write: {runtime.writeTarget ?? "locked"}
                </span>
              </div>
            </article>

            <article
              className="rounded-[24px] border p-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.68)" }}
            >
              <p className="editorial-label">Stato tecnico</p>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted)" }}>
                Sorgente admin: <strong>{runtime.adminReadSource}</strong>.
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
                  {getAdminArticleWarningLabel(warning)}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="surface-card rounded-[var(--radius-xl)] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div>
              <p className="editorial-label">Workspace articoli</p>
              <h2 className="text-display-card mt-2 text-[1.5rem] sm:text-[1.75rem]">
                Inventario blog
              </h2>
              <p className="mt-3 max-w-[44rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
                Filtra per stato e rientra in modifica con un editor markdown completo.
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
                  ? "Azioni blog attive su Supabase."
                  : "Azioni blog in pausa: runtime non scrivibile."}
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

          {filteredArticles.length > 0 ? (
            <div className="mt-6 space-y-4">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
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
                      <h2 className="text-2xl">{article.title}</h2>
                      <AdminStatusPill
                        active={article.status === "published"}
                        activeLabel="Pubblicato"
                        inactiveLabel="Bozza"
                      />
                      <AdminStatusPill
                        active={article.featured}
                        activeLabel="Featured"
                        inactiveLabel="Standard"
                      />
                    </div>
                    <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                      {article.dek}
                    </p>
                    <div
                      className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>{kindLabels[article.kind]}</span>
                      <span>Slug: {article.slug}</span>
                      <span>Data: {formatItalianDate(article.published_at)}</span>
                      <span>Autore: {article.author_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    {article.tags.length > 0 ? (
                      article.tags.map((tag) => (
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
                    {article.status === "published" ? (
                      <Link
                        href={`/posts/${article.slug}`}
                        className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                      >
                        Apri articolo
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/${article.id}/edit`}
                      className="button-shell button-secondary rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-strong)]"
                    >
                      Modifica
                    </Link>

                    <form action={toggleArticleFeaturedAction.bind(null, article.id, !article.featured)}>
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {article.featured ? "Rimuovi featured" : "Metti in featured"}
                      </button>
                    </form>

                    <form
                      action={toggleArticlePublishedAction.bind(
                        null,
                        article.id,
                        article.status !== "published",
                      )}
                    >
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="button-shell button-secondary w-full rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {article.status === "published" ? "Torna in bozza" : "Pubblica"}
                      </button>
                    </form>

                    <DeleteWithConfirm
                      action={deleteArticleAction.bind(null, article.id)}
                      label="Elimina"
                      disabled={!canWrite}
                      confirmMessage="Sei sicuro di voler eliminare questo articolo? L'azione e irreversibile."
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="Nessun articolo in questa vista"
              description="Crea un nuovo articolo oppure cambia filtro per ritrovare bozze e contenuti pubblicati."
              ctaHref="/admin/new"
              ctaLabel="Nuovo articolo"
            />
          )}
        </section>
      </div>
    </div>
  );
}
