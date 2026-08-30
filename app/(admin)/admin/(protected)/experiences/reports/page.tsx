import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterFilters,
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import {
  hideExperienceFromReportAction,
  resolveExperienceReportAction,
} from "@/app/(admin)/admin/actions/experience-reports";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { resolveCatalogToolLabels } from "@/lib/community/catalog";
import {
  REPORT_REASON_LABELS,
  type CommunityReportReason,
} from "@/lib/community/schema";
import {
  ADMIN_REPORT_PAGE_SIZE,
  type ReportDisposition,
} from "@/lib/community/report-moderation";
import { listExperienceReports } from "@/lib/community/report-repository";
import { formatItalianDate } from "@/lib/utils";

type ReportsPageProps = {
  searchParams: Promise<{ scope?: string; page?: string; notice?: string }>;
};

type ReportScope = "open" | "resolved" | "dismissed";

const noticeCopy: Record<string, { tone: "ok" | "warn"; text: string }> = {
  applied: { tone: "ok", text: "Segnalazione aggiornata." },
  hidden: { tone: "ok", text: "Esperienza nascosta. La segnalazione resta aperta finché non la risolvi." },
  noop: { tone: "ok", text: "Nessuna modifica: lo stato era già quello richiesto." },
  already: { tone: "warn", text: "Segnalazione già gestita in un'altra sessione." },
  conflict: {
    tone: "warn",
    text: "Contenuto aggiornato altrove. Ricarica e riprova sulla versione attuale.",
  },
  invalid: { tone: "warn", text: "Azione non valida. Controlla i campi e riprova." },
  "not-found": { tone: "warn", text: "Segnalazione o esperienza non trovata." },
  error: { tone: "warn", text: "Operazione non riuscita. Riprova." },
};

const scopeConfig: Record<
  ReportScope,
  { pill: { active: boolean; activeLabel: string; inactiveLabel: string }; empty: string }
> = {
  open: {
    pill: { active: true, activeLabel: "Aperta", inactiveLabel: "" },
    empty: "Nessuna segnalazione aperta.",
  },
  resolved: {
    pill: { active: true, activeLabel: "Risolta", inactiveLabel: "" },
    empty: "Nessuna segnalazione risolta.",
  },
  dismissed: {
    pill: { active: false, activeLabel: "", inactiveLabel: "Ignorata" },
    empty: "Nessuna segnalazione ignorata.",
  },
};

function isReportScope(value: unknown): value is ReportScope {
  return (
    typeof value === "string" &&
    (["open", "resolved", "dismissed"] as readonly string[]).includes(value)
  );
}

function parsePage(raw: string | undefined) {
  const value = Number(raw ?? "1");
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

function ResolveForm({
  reportId,
  scope,
  page,
  disposition,
  label,
  notePlaceholder,
}: {
  reportId: string;
  scope: ReportScope;
  page: string;
  disposition: ReportDisposition;
  label: string;
  notePlaceholder: string;
}) {
  return (
    <form
      action={resolveExperienceReportAction}
      className="tv-cc-inline-form"
      data-testid={`report-${disposition}-form`}
    >
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="disposition" value={disposition} />
      <input type="hidden" name="returnScope" value={scope} />
      <input type="hidden" name="page" value={page} />
      <input
        type="text"
        name="note"
        placeholder={notePlaceholder}
        maxLength={500}
        aria-label={`Nota per ${label}`}
        className="tv-cc-inline-form__input"
      />
      <button type="submit" className="tv-cc-inline-form__submit">
        {label}
      </button>
    </form>
  );
}

export default async function ExperienceReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const scope = isReportScope(params.scope) ? params.scope : "open";
  const page = parsePage(params.page);
  const notice = params.notice ? noticeCopy[params.notice] : null;
  const canWrite = isSupabaseAdminEnabled();

  let list: Awaited<ReturnType<typeof listExperienceReports>> = {
    ok: true,
    page: [],
    pageNumber: page,
    pageSize: ADMIN_REPORT_PAGE_SIZE,
    total: 0,
    hasMore: false,
  };
  let loadError = false;

  if (canWrite) {
    try {
      list = await listExperienceReports({ scope, page });
      if (!list.ok) loadError = true;
    } catch {
      loadError = true;
    }
  }

  const rows = list.ok ? list.page : [];
  const total = list.ok ? list.total : 0;
  const labels: Record<string, { name: string; missing: boolean }> =
    await resolveCatalogToolLabels(
      rows
        .map((row) => row.experience?.toolSlug)
        .filter((slug): slug is string => Boolean(slug)),
    ).catch(() => ({}));

  const filterItems = (
    [
      ["open", "Aperte"],
      ["resolved", "Risolte"],
      ["dismissed", "Ignorate"],
    ] as const
  ).map(([value, label]) => ({
    href: `/admin/experiences/reports?scope=${value}`,
    label,
    value,
  }));

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_REPORT_PAGE_SIZE));

  return (
    <div className="page-shell py-6">
      <ControlCenterHeader
        title="Segnalazioni"
        description="Le segnalazioni delle esperienze pubblicate. Nessuna azione automatica: decidi tu."
        metrics={[{ label: "In questo filtro", value: total }]}
      />

      {notice ? (
        <ControlCenterNotice tone={notice.tone}>{notice.text}</ControlCenterNotice>
      ) : null}
      {loadError ? (
        <ControlCenterNotice tone="warn">
          Non è stato possibile caricare la coda. Riprova.
        </ControlCenterNotice>
      ) : null}
      {!canWrite ? (
        <ControlCenterNotice tone="warn">
          Il salvataggio admin non è configurato. La coda resta vuota.
        </ControlCenterNotice>
      ) : null}

      <ControlCenterFilters items={[...filterItems]} active={scope} />

      {rows.length > 0 ? (
        <div>
          {rows.map((report) => {
            const pill = scopeConfig[scope].pill;
            const experience = report.experience;
            const tool = experience
              ? labels[experience.toolSlug] ?? {
                  name: "Tool non più nel catalogo",
                  missing: true,
                }
              : null;
            const reason =
              report.reason in REPORT_REASON_LABELS
                ? REPORT_REASON_LABELS[report.reason as CommunityReportReason]
                : report.reason;
            return (
              <article key={report.id} className="tv-cc-card">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="tv-cc-card__title">
                      {experience ? tool?.name ?? experience.toolSlug : "Esperienza eliminata"}
                    </h2>
                    <AdminStatusPill
                      active={pill.active}
                      activeLabel={pill.activeLabel}
                      inactiveLabel={pill.inactiveLabel}
                    />
                  </div>
                  <p className="tv-cc-card__meta">
                    <span>
                      {experience
                        ? experience.displayName
                        : "L’esperienza non esiste più."}
                    </span>
                    <span>{reason}</span>
                    <span>{formatItalianDate(report.reportedAt)}</span>
                    {experience && tool && !tool.missing ? (
                      <Link
                        href={`/toools/${experience.toolSlug}`}
                        className="underline"
                      >
                        {experience.toolSlug}
                      </Link>
                    ) : null}
                  </p>
                  {report.details ? (
                    <>
                      <p className="tv-cc-kicker mt-3">Dettagli della segnalazione</p>
                      <p className="whitespace-pre-wrap text-sm text-[var(--tv-text)]">
                        {report.details}
                      </p>
                    </>
                  ) : null}
                  {experience ? (
                    <p className="tv-cc-card__meta mt-3">
                      Stato esperienza: {experience.status}
                    </p>
                  ) : null}
                  {report.status === "open" ? (
                    <div className="mt-3 grid gap-3">
                      <ResolveForm
                        reportId={report.id}
                        scope={scope}
                        page={String(page)}
                        disposition="resolved"
                        label="Risolvi"
                        notePlaceholder="Nota di risoluzione (facoltativa)"
                      />
                      <ResolveForm
                        reportId={report.id}
                        scope={scope}
                        page={String(page)}
                        disposition="dismissed"
                        label="Ignora"
                        notePlaceholder="Nota (facoltativa)"
                      />
                      {experience && experience.status === "published" ? (
                        <form
                          action={hideExperienceFromReportAction}
                          className="tv-cc-inline-form"
                          data-testid="report-hide-form"
                        >
                          <input type="hidden" name="experienceId" value={experience.id} />
                          <input
                            type="hidden"
                            name="expectedUpdatedAt"
                            value={experience.updatedAt}
                          />
                          <input type="hidden" name="returnScope" value={scope} />
                          <input type="hidden" name="page" value={String(page)} />
                          <input
                            type="text"
                            name="reason"
                            placeholder="Motivo della rimozione (obbligatorio)"
                            maxLength={500}
                            required
                            aria-label="Motivo della rimozione"
                            className="tv-cc-inline-form__input"
                          />
                          <button type="submit" className="tv-cc-inline-form__submit">
                            Nascondi esperienza
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <p className="tv-cc-card__meta mt-3">
                      {report.resolutionNote ? `Nota: ${report.resolutionNote}` : null}
                      {report.resolvedBy ? ` · ${report.resolvedBy}` : ""}
                      {report.resolvedAt
                        ? ` · ${formatItalianDate(report.resolvedAt)}`
                        : ""}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState
          title={scopeConfig[scope].empty}
          description="Le segnalazioni delle esperienze pubblicate compaiono qui."
        />
      )}

      {totalPages > 1 ? (
        <nav className="mt-6 flex items-center gap-3 text-sm" aria-label="Paginazione">
          {page > 1 ? (
            <Link
              href={`/admin/experiences/reports?scope=${scope}&page=${page - 1}`}
              className="underline"
            >
              Precedente
            </Link>
          ) : null}
          <span>
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/experiences/reports?scope=${scope}&page=${page + 1}`}
              className="underline"
            >
              Successiva
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
