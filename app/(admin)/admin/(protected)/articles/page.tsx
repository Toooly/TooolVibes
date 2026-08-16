import Link from "next/link";

import {
  deleteArticleAction,
  toggleArticleFeaturedAction,
  toggleArticlePublishedAction,
} from "@/app/(admin)/admin/actions/articles";
import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterFilters,
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import {
  type AdminArticleRecord,
  getAdminArticleWarningLabel,
  getAdminArticlesRuntime,
} from "@/lib/admin/article-queries";
import { formatItalianDate } from "@/lib/utils";

type AdminDashboardPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Articolo creato correttamente.",
  updated: "Articolo aggiornato correttamente.",
  deleted: "Articolo eliminato correttamente.",
};

const kindLabels: Record<AdminArticleRecord["kind"], string> = {
  editorial: "Blog",
  guide: "Guida",
  "tool-writeup": "Scheda tool",
};

function getArticleSourceLabel(source: AdminArticleRecord["admin_source"]) {
  return source === "cms" ? "Archivio" : "Da importare";
}

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
  const cmsCount = articles.filter((article) => article.admin_source === "cms").length;
  const seedCount = articles.length - cmsCount;
  const draftCount = articles.length - publishedCount;
  const filteredArticles = articles.filter((article) => {
    if (activeView === "all") return true;
    if (activeView === "published") return article.status === "published";
    if (activeView === "draft") return article.status === "draft";
    if (activeView === "featured") return article.featured;
    if (activeView === "cms") return article.admin_source === "cms";
    if (activeView === "seed") return article.admin_source === "seed";
    return true;
  });
  const filterLinks = [
    { href: "/admin/articles", label: "Tutti", value: "all", count: articles.length },
    { href: "/admin/articles?view=published", label: "Pubblicati", value: "published", count: publishedCount },
    { href: "/admin/articles?view=draft", label: "Bozze", value: "draft", count: draftCount },
    { href: "/admin/articles?view=featured", label: "In evidenza", value: "featured", count: featuredCount },
    { href: "/admin/articles?view=cms", label: "In archivio", value: "cms", count: cmsCount },
    { href: "/admin/articles?view=seed", label: "Da importare", value: "seed", count: seedCount },
  ];

  return (
    <div className="page-shell py-6">
      <ControlCenterHeader
        title="Gestione guide"
        description="Crea, modifica e pubblica articoli e guide."
        primaryHref="/admin/articles/new"
        primaryLabel="Nuova guida"
        metrics={[
          { label: "Guide", value: articles.length },
          { label: "Pubblicate", value: publishedCount },
          { label: "In evidenza", value: featuredCount },
        ]}
      />

      {status && statusMessages[status] ? (
        <ControlCenterNotice tone="ok">{statusMessages[status]}</ControlCenterNotice>
      ) : null}
      {!canWrite ? (
        <ControlCenterNotice tone="warn">{runtime.writeMessage}</ControlCenterNotice>
      ) : null}
      {runtime.warnings.map((warning) => (
        <ControlCenterNotice key={warning} tone="warn">
          {getAdminArticleWarningLabel(warning)}
        </ControlCenterNotice>
      ))}

      <ControlCenterFilters items={filterLinks} active={activeView} />

      {filteredArticles.length > 0 ? (
        <div>
          {filteredArticles.map((article) => (
            <article key={article.id} className="tv-cc-card">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="tv-cc-card__title">{article.title}</h2>
                  <AdminStatusPill
                    active={article.status === "published"}
                    activeLabel="Pubblicato"
                    inactiveLabel="Bozza"
                  />
                  {article.featured ? (
                    <AdminStatusPill active activeLabel="In evidenza" inactiveLabel="Standard" />
                  ) : null}
                </div>
                <p className="tv-cc-card__meta">
                  <span>{kindLabels[article.kind]}</span>
                  <span>{getArticleSourceLabel(article.admin_source)}</span>
                  <span>{formatItalianDate(article.published_at)}</span>
                </p>
              </div>
              <div className="tv-cc-card__actions">
                {article.admin_can_edit ? (
                  <Link href={`/admin/articles/${article.id}/edit`} className="tv-cc-btn tv-cc-btn--primary">
                    Modifica
                  </Link>
                ) : canWrite ? (
                  <Link href={`/admin/articles/new?seed=${article.slug}`} className="tv-cc-btn tv-cc-btn--primary">
                    Importa
                  </Link>
                ) : null}
                {article.status === "published" ? (
                  <Link href={`/posts/${article.slug}`} className="tv-cc-btn tv-cc-btn--secondary">
                    Apri
                  </Link>
                ) : null}
                {article.admin_can_mutate ? (
                  <AdminActionMenu>
                    <form action={toggleArticleFeaturedAction.bind(null, article.id, !article.featured)}>
                      <button type="submit" disabled={!canWrite}>
                        {article.featured ? "Rimuovi evidenza" : "Metti in evidenza"}
                      </button>
                    </form>
                    <form
                      action={toggleArticlePublishedAction.bind(
                        null,
                        article.id,
                        article.status !== "published",
                      )}
                    >
                      <button type="submit" disabled={!canWrite}>
                        {article.status === "published" ? "Torna in bozza" : "Pubblica"}
                      </button>
                    </form>
                    <DeleteWithConfirm
                      action={deleteArticleAction.bind(null, article.id)}
                      label="Elimina"
                      disabled={!canWrite}
                      confirmMessage="Sei sicuro di voler eliminare questo articolo? L'azione è irreversibile."
                      variant="menu"
                    />
                  </AdminActionMenu>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Nessun articolo in questa vista"
          description="Crea una nuova guida oppure cambia filtro."
          ctaHref="/admin/articles/new"
          ctaLabel="Nuova guida"
        />
      )}
    </div>
  );
}
