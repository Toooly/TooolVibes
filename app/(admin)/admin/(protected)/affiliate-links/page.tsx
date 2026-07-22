import Link from "next/link";

import {
  deleteAffiliateLinkAction,
  toggleAffiliateLinkActiveAction,
} from "@/app/(admin)/admin/actions/affiliates";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { SectionHeader } from "@/components/ui/section-header";
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

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <section className="brand-panel brand-aura rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeader
              eyebrow="Link affiliati"
              title="Link affiliati dei tool"
              description="Questa sezione gestisce i link outbound dei tool nel catalogo. Le candidature degli affiliati esterni vivono invece nel programma affiliati."
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/affiliates"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Programma affiliati
              </Link>
              <Link
                href="/admin/affiliate-links/new"
                className="button-shell button-primary rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-strong), var(--accent) 70%, var(--cyan))",
                }}
              >
                Nuovo link affiliato
              </Link>
              <Link
                href="/admin"
                className="button-shell button-secondary rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {status && statusLabels[status] ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: status === "error" || status === "validation" ? "rgba(185,28,28,0.25)" : "rgba(15,118,110,0.18)",
                background: status === "error" || status === "validation" ? "rgba(254,242,242,0.95)" : "rgba(236,253,245,0.95)",
              }}
            >
              {statusLabels[status]}
            </div>
          ) : null}

          <div className="mt-8 hidden gap-4 sm:grid lg:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Totale link", value: runtime.links.length },
              { label: "Attivi", value: runtime.activeCount },
              { label: "Inattivi", value: runtime.inactiveCount },
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
          <div className="border-b pb-5 soft-divider">
              <p className="editorial-label">Area link affiliati</p>
            <h2 className="text-display-card mt-2 text-[1.58rem] sm:text-[1.82rem]">
              Tutti i link affiliati
            </h2>
          </div>

          {runtime.links.length > 0 ? (
            <div className="mt-6 space-y-4">
              {runtime.links.map((link) => (
                <article
                  key={link.id}
                  className="interactive-surface relative overflow-hidden rounded-[var(--radius-xl)] border p-5"
                  style={{
                    borderColor: "var(--line)",
                    background: "rgba(255,255,255,0.76)",
                  }}
                >
                  <div className="card-glow absolute inset-0" />
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl">{link.label}</h2>
                      <AdminStatusPill
                        active={link.is_active}
                        activeLabel="Attivo"
                        inactiveLabel="Inattivo"
                      />
                      {link.tool_name ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-medium">
                          {link.tool_name}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm" style={{ color: "var(--muted)" }}>
                      <p>
                        Destinazione:{" "}
                        <a
                          href={link.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                          style={{ color: "var(--accent-strong)" }}
                        >
                          {link.destination_url}
                        </a>
                      </p>
                      {(link.campaign || link.source || link.medium) ? (
                        <p>
                          Anteprima:{" "}
                          <span
                            className="break-all text-xs"
                            style={{ color: "var(--muted-strong)" }}
                          >
                            {buildTrackingPreview(link)}
                          </span>
                        </p>
                      ) : null}
                      {link.campaign ? <p>Campagna UTM: {link.campaign}</p> : null}
                      {link.source ? <p>Sorgente UTM: {link.source}</p> : null}
                      {link.medium ? <p>Canale UTM: {link.medium}</p> : null}
                      <p>Creato: {formatItalianDate(link.created_at)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/affiliate-links/${link.id}/edit`}
                        className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)]"
                      >
                        Modifica
                      </Link>

                      <form
                        action={toggleAffiliateLinkActiveAction.bind(
                          null,
                          link.id,
                          !link.is_active,
                        )}
                      >
                        <button
                          type="submit"
                          disabled={!runtime.canWrite}
                          className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {link.is_active ? "Disattiva" : "Attiva"}
                        </button>
                      </form>

                      <DeleteWithConfirm
                        action={deleteAffiliateLinkAction.bind(null, link.id)}
                        label="Elimina"
                        disabled={!runtime.canWrite}
                        confirmMessage="Sei sicuro di voler eliminare questo link affiliato? L'azione è irreversibile."
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="Nessun link affiliato"
              description="Non ci sono ancora link affiliati. Crea il primo per iniziare a tracciare le conversioni."
              ctaHref="/admin/affiliate-links/new"
              ctaLabel="Crea il primo link"
            />
          )}
        </section>
      </div>
    </div>
  );
}
