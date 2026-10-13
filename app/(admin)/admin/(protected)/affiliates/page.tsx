import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import {
  deleteAffiliateRequestAction,
  updateAffiliateRequestAction,
} from "@/app/(admin)/admin/actions/affiliate-requests";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterFilters,
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import { DeleteWithConfirm } from "@/components/admin/delete-with-confirm";
import { getAffiliateQrCodeUrl } from "@/lib/affiliates/referral";
import { getAffiliateRequestsRuntime } from "@/lib/admin/affiliate-request-queries";
import type { AffiliateRequestStatus } from "@/lib/types/affiliate-request";
import { formatItalianDate } from "@/lib/utils";

type AffiliatesPageProps = {
  searchParams: Promise<{ status?: string; view?: string }>;
};

const statusLabels: Record<string, string> = {
  reviewing: "Richiesta spostata in revisione.",
  approved: "Affiliato approvato e notificato via email.",
  rejected: "Richiesta rifiutata. L'utente potrà inviarne una nuova tra 30 giorni.",
  deleted: "Richiesta affiliato eliminata.",
  error: "Operazione non riuscita. Riprova.",
  validation: "Richiesta non valida.",
  "not-found": "Richiesta non trovata.",
  "referral-validation": "Inserisci un codice referral valido: 3-48 caratteri, lettere, numeri, trattini o underscore.",
};

const statusConfig: Record<
  AffiliateRequestStatus,
  { active: boolean; activeLabel: string; inactiveLabel: string }
> = {
  received: { active: false, activeLabel: "", inactiveLabel: "Ricevuta" },
  reviewing: { active: true, activeLabel: "In revisione", inactiveLabel: "" },
  approved: { active: true, activeLabel: "Approvata", inactiveLabel: "" },
  rejected: { active: false, activeLabel: "", inactiveLabel: "Rifiutata" },
};

function StatusBadge({ status }: { status: AffiliateRequestStatus }) {
  const config = statusConfig[status];
  return (
    <AdminStatusPill
      active={config.active}
      activeLabel={config.activeLabel}
      inactiveLabel={config.inactiveLabel}
    />
  );
}

export default async function AffiliatesPage({ searchParams }: AffiliatesPageProps) {
  const [{ status, view }, runtime] = await Promise.all([
    searchParams,
    getAffiliateRequestsRuntime(),
  ]);
  const requests = runtime.requests;
  const activeView = view ?? "open";
  const filteredRequests = requests.filter((request) => {
    if (activeView === "all") return true;
    if (activeView === "open") {
      return request.status === "received" || request.status === "reviewing";
    }
    return request.status === activeView;
  });
  const viewLinks = [
    {
      href: "/admin/affiliates",
      label: "Aperti",
      value: "open",
      count: runtime.pendingCount + runtime.reviewingCount,
    },
    {
      href: "/admin/affiliates?view=approved",
      label: "Approvati",
      value: "approved",
      count: runtime.approvedCount,
    },
    {
      href: "/admin/affiliates?view=rejected",
      label: "Rifiutati",
      value: "rejected",
      count: runtime.rejectedCount,
    },
    { href: "/admin/affiliates?view=all", label: "Tutti", value: "all", count: requests.length },
  ];

  return (
    <div className="page-shell py-6">
      <div className="space-y-6">
        <LocalizedAttributes><ControlCenterHeader
          title="Affiliati"
          description="Approva candidature, assegna il referral e genera il QR."
          primaryHref="/admin/affiliate-links"
          primaryLabel="Link affiliati"
          metrics={[
            { label: "Aperti", value: runtime.pendingCount + runtime.reviewingCount },
            { label: "Approvati", value: runtime.approvedCount },
            { label: "Totali", value: requests.length },
          ]}
        /></LocalizedAttributes>
        {status && statusLabels[status] ? (
          <ControlCenterNotice
            tone={
              status === "error" || status === "validation" || status === "referral-validation"
                ? "warn"
                : "ok"
            }
          >
            <LocalizedText>{statusLabels[status]}</LocalizedText>
          </ControlCenterNotice>
        ) : null}
        <ControlCenterFilters items={viewLinks} active={activeView} />
        <section className="tv-cc-panel rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div>
              <p className="editorial-label"><LocalizedText>{"Area affiliati"}</LocalizedText></p>
              <h2 className="text-display-card mt-2 text-[1.58rem] sm:text-[1.82rem]"><LocalizedText>{"Candidature ricevute "}</LocalizedText></h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewLinks.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  className="tv-cc-btn tv-cc-btn--secondary rounded-full px-3.5 py-2 text-sm font-semibold "
                  style={{
                    background:
                      activeView === item.value ? "rgba(106,60,255,0.12)" : undefined,
                  }}
                >
                  <LocalizedText>{item.label}</LocalizedText> ({item.count})
                </Link>
              ))}
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="mt-6 space-y-4">
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="interactive-surface relative overflow-hidden rounded-[var(--radius-xl)] border p-5"
                  style={{
                    borderColor: "var(--line)",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="card-glow absolute inset-0" />
                  <div className="relative grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl">
                          <LocalizedText>{request.first_name}</LocalizedText> <LocalizedText>{request.last_name}</LocalizedText>
                        </h2>
                        <StatusBadge status={request.status} />
                      </div>

                      <div className="grid gap-2 text-sm" style={{ color: "var(--muted)" }}>
                        <p><LocalizedText>{"Email: "}</LocalizedText>{request.email}</p>
                        {request.brand_name ? <p><LocalizedText>{"Brand: "}</LocalizedText><LocalizedText>{request.brand_name}</LocalizedText></p> : null}
                        {request.website_url ? (
                          <p><LocalizedText>{"Sito:"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
                            <a
                              href={request.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                              style={{ color: "var(--accent-strong)" }}
                            >
                              <LocalizedText>{request.website_url}</LocalizedText>
                            </a>
                          </p>
                        ) : null}
                        {request.audience ? <p><LocalizedText>{"Audience: "}</LocalizedText><LocalizedText>{request.audience}</LocalizedText></p> : null}
                        {request.channels ? <p><LocalizedText>{"Canali: "}</LocalizedText><LocalizedText>{request.channels}</LocalizedText></p> : null}
                        {request.message ? <p><LocalizedText>{"Messaggio: "}</LocalizedText><LocalizedText>{request.message}</LocalizedText></p> : null}
                        {request.admin_notes ? (
                          <p><LocalizedText>{"Note interne:"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
                            <span style={{ color: "var(--muted-strong)" }}>
                              <LocalizedText>{request.admin_notes}</LocalizedText>
                            </span>
                          </p>
                        ) : null}
                        <p><LocalizedText>{"Ricevuta: "}</LocalizedText><LocalizedText>{formatItalianDate(request.created_at)}</LocalizedText></p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {request.status === "approved" && request.referral_url ? (
                        <div
                          className="rounded-[24px] border p-4"
                          style={{
                            borderColor: "rgba(15,118,110,0.18)",
                            background: "rgba(57,210,246,0.10)",
                          }}
                        >
                          <p className="editorial-label"><LocalizedText>{"Referral attivo"}</LocalizedText></p>
                          <p className="mt-2 text-sm"><LocalizedText>{"Codice: "}</LocalizedText><strong><LocalizedText>{request.referral_code}</LocalizedText></strong>
                          </p>
                          <a
                            href={request.referral_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block break-all text-sm underline hover:no-underline"
                            style={{ color: "var(--accent-strong)" }}
                          >
                            <LocalizedText>{request.referral_url}</LocalizedText>
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <LocalizedAttributes><img
                            src={getAffiliateQrCodeUrl(request.referral_url, 220)}
                            alt={`QR code affiliato ${request.referral_code}`}
                            className="mt-4 size-[11rem] rounded-[18px] border bg-white p-2"
                            style={{ borderColor: "var(--line)" }}
                          /></LocalizedAttributes>
                        </div>
                      ) : null}

                      <form action={updateAffiliateRequestAction} className="space-y-3">
                        <input type="hidden" name="id" value={request.id} />
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold"><LocalizedText>{"Codice referral"}</LocalizedText></span>
                          <LocalizedAttributes><input
                            name="referral_code"
                            defaultValue={request.referral_code ?? ""}
                            placeholder="es. mattia-ai"
                            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                            style={{
                              borderColor: "var(--line)",
                              background: "rgba(255,255,255,0.06)",
                            }}
                          /></LocalizedAttributes>
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold"><LocalizedText>{"Note interne"}</LocalizedText></span>
                          <textarea
                            name="admin_notes"
                            rows={3}
                            defaultValue={request.admin_notes ?? ""}
                            placeholder="Aggiungi note interne o motivo della decisione..."
                            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                            style={{
                              borderColor: "var(--line)",
                              background: "rgba(255,255,255,0.06)",
                            }}
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(request.status === "received" ||
                            request.status === "reviewing") ? (
                            <button
                              type="submit"
                              name="status"
                              value="reviewing"
                              disabled={!runtime.canWrite}
                              className="tv-cc-btn tv-cc-btn--secondary rounded-full px-4 py-2 text-sm font-semibold  disabled:cursor-not-allowed disabled:opacity-55"
                            ><LocalizedText>{"In revisione "}</LocalizedText></button>
                          ) : null}
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
                          ><LocalizedText>{"Approva "}</LocalizedText></button>
                          <button
                            type="submit"
                            name="status"
                            value="rejected"
                            disabled={!runtime.canWrite}
                            className="button-shell rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                            style={{
                              background: "linear-gradient(135deg, #9a4130, #7f2f22)",
                            }}
                          ><LocalizedText>{"Rifiuta "}</LocalizedText></button>
                        </div>
                      </form>

                      <DeleteWithConfirm
                        action={deleteAffiliateRequestAction.bind(null, request.id)}
                        label="Elimina"
                        disabled={!runtime.canWrite}
                        confirmMessage="Sei sicuro di voler eliminare questa richiesta affiliato?"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <LocalizedAttributes><AdminEmptyState
              title="Nessuna richiesta affiliato"
              description="Le candidature inviate dalla pagina pubblica affiliati appariranno qui."
            /></LocalizedAttributes>
          )}
        </section>
      </div>
    </div>
  );
}
