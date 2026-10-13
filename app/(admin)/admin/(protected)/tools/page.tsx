import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import {
  deleteToolAction,
  toggleFeaturedAction,
  togglePublishedAction,
} from "@/app/(admin)/admin/actions/tools";
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
    <div className="page-shell py-6">
      <LocalizedAttributes><ControlCenterHeader
        title="Gestione tool"
        description="Gestisci pubblicazione, evidenza e contenuti del catalogo."
        primaryHref="/admin/tools/new"
        primaryLabel="Nuovo tool"
        metrics={[
          { label: "Tool", value: runtime.tools.length },
          { label: "Pubblicati", value: publishedCount },
          { label: "In evidenza", value: featuredCount },
        ]}
      /></LocalizedAttributes>

      {status && statusMessages[status] ? (
        <ControlCenterNotice tone="ok"><LocalizedText>{statusMessages[status]}</LocalizedText></ControlCenterNotice>
      ) : null}
      {!runtime.canWrite ? (
        <ControlCenterNotice tone="warn"><LocalizedText>{runtime.writeMessage}</LocalizedText></ControlCenterNotice>
      ) : null}
      {runtime.warnings.map((warning) => (
        <ControlCenterNotice key={warning} tone="warn">
          <LocalizedText>{getAdminToolWarningLabel(warning)}</LocalizedText>
        </ControlCenterNotice>
      ))}

      <ControlCenterFilters items={filterLinks} active={activeView} />

      {filteredTools.length > 0 ? (
        <div>
          {filteredTools.map((tool) => (
            <article key={tool.id} className="tv-cc-card">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="tv-cc-card__title">{tool.name}</h2>
                  <AdminStatusPill
                    active={tool.is_published}
                    activeLabel="Pubblicato"
                    inactiveLabel="Bozza"
                  />
                  {tool.is_featured ? (
                    <AdminStatusPill active activeLabel="In evidenza" inactiveLabel="Standard" />
                  ) : null}
                </div>
                <p className="tv-cc-card__meta">
                  <span><LocalizedText>{tool.category}</LocalizedText></span>
                  <span><LocalizedText>{"Aggiornato "}</LocalizedText><LocalizedText>{formatItalianDate(tool.updated_at)}</LocalizedText></span>
                  {tool.affiliate_url ? <span><LocalizedText>{"Affiliate"}</LocalizedText></span> : null}
                </p>
              </div>
              <div className="tv-cc-card__actions">
                <Link href={`/admin/tools/${tool.id}/edit`} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Modifica "}</LocalizedText></Link>
                {tool.is_published ? (
                  <Link href={`/toools/${tool.slug}`} className="tv-cc-btn tv-cc-btn--secondary"><LocalizedText>{"Apri scheda "}</LocalizedText></Link>
                ) : null}
                <AdminActionMenu>
                  <form action={toggleFeaturedAction.bind(null, tool.id, !tool.is_featured)}>
                    <button type="submit" disabled={!runtime.canWrite}>
                      <LocalizedText>{tool.is_featured ? "Rimuovi evidenza" : "Metti in evidenza"}</LocalizedText>
                    </button>
                  </form>
                  <form action={togglePublishedAction.bind(null, tool.id, !tool.is_published)}>
                    <button type="submit" disabled={!runtime.canWrite}>
                      <LocalizedText>{tool.is_published ? "Torna in bozza" : "Pubblica"}</LocalizedText>
                    </button>
                  </form>
                  <DeleteWithConfirm
                    action={deleteToolAction.bind(null, tool.id)}
                    label="Elimina"
                    disabled={!runtime.canWrite}
                    confirmMessage="Sei sicuro di voler eliminare questo tool? L'azione e' irreversibile."
                    variant="menu"
                  />
                </AdminActionMenu>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <LocalizedAttributes><AdminEmptyState
          title="Nessun tool in questa vista"
          description="Cambia filtro o crea un nuovo tool per alimentare il catalogo."
          ctaHref="/admin/tools/new"
          ctaLabel="Nuovo tool"
        /></LocalizedAttributes>
      )}
    </div>
  );
}
