import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import {
  deleteAffiliateLinkAction,
  toggleAffiliateLinkActiveAction,
} from "@/app/(admin)/admin/actions/affiliates";
import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { getAffiliateRuntime } from "@/lib/admin/affiliate-queries";
import { formatItalianDate } from "@/lib/utils";

type AffiliateLinksPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusLabels: Record<string, string> = {
  created: "Link affiliato creato correttamente.",
  updated: "Link affiliato aggiornato correttamente.",
  deleted: "Link affiliato eliminato correttamente.",
  error: "Errore durante l'operazione. Riprova.",
  validation: "Compila tutti i campi obbligatori.",
};

function buildTrackingPreview(link: {
  destination_url: string;
  campaign?: string | null;
  source?: string | null;
  medium?: string | null;
}): string {
  try {
    const url = new URL(link.destination_url);
    if (link.campaign) url.searchParams.set("utm_campaign", link.campaign);
    if (link.source) url.searchParams.set("utm_source", link.source);
    if (link.medium) url.searchParams.set("utm_medium", link.medium);
    return url.toString();
  } catch {
    return link.destination_url;
  }
}

export default async function AffiliateLinksPage({ searchParams }: AffiliateLinksPageProps) {
  const [{ status }, runtime] = await Promise.all([searchParams, getAffiliateRuntime()]);
  const activeCount = runtime.links.filter((link) => link.is_active).length;

  return (
    <div className="page-shell py-6">
      <LocalizedAttributes><ControlCenterHeader
        title="Link affiliati"
        description="Gestisci i link outbound del catalogo."
        primaryHref="/admin/affiliate-links/new"
        primaryLabel="Nuovo link"
        metrics={[
          { label: "Link", value: runtime.links.length },
          { label: "Attivi", value: activeCount },
        ]}
      /></LocalizedAttributes>

      {status && statusLabels[status] ? (
        <ControlCenterNotice tone={status === "error" || status === "validation" ? "warn" : "ok"}>
          <LocalizedText>{statusLabels[status]}</LocalizedText>
        </ControlCenterNotice>
      ) : null}

      {runtime.links.length > 0 ? (
        <div>
          {runtime.links.map((link) => (
            <article key={link.id} className="tv-cc-card">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="tv-cc-card__title"><LocalizedText>{link.tool_name || link.destination_url}</LocalizedText></h2>
                  <AdminStatusPill
                    active={link.is_active}
                    activeLabel="Attivo"
                    inactiveLabel="Inattivo"
                  />
                </div>
                <p className="tv-cc-card__meta">
                  <span className="break-all"><LocalizedText>{buildTrackingPreview(link)}</LocalizedText></span>
                  <span><LocalizedText>{formatItalianDate(link.created_at)}</LocalizedText></span>
                </p>
              </div>
              <div className="tv-cc-card__actions">
                <Link href={`/admin/affiliate-links/${link.id}/edit`} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Modifica "}</LocalizedText></Link>
                <AdminActionMenu>
                  <form action={toggleAffiliateLinkActiveAction.bind(null, link.id, !link.is_active)}>
                    <button type="submit" disabled={!runtime.canWrite}>
                      <LocalizedText>{link.is_active ? "Disattiva" : "Attiva"}</LocalizedText>
                    </button>
                  </form>
                  <DeleteWithConfirm
                    action={deleteAffiliateLinkAction.bind(null, link.id)}
                    label="Elimina"
                    disabled={!runtime.canWrite}
                    confirmMessage="Sei sicuro di voler eliminare questo link affiliato? L'azione è irreversibile."
                    variant="menu"
                  />
                </AdminActionMenu>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <LocalizedAttributes><AdminEmptyState
          title="Nessun link affiliato"
          description="Crea il primo link per tracciare le conversioni."
          ctaHref="/admin/affiliate-links/new"
          ctaLabel="Nuovo link"
        /></LocalizedAttributes>
      )}
    </div>
  );
}
