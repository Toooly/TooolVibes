import Link from "next/link";

import { ExperienceModerationControls } from "@/components/admin/experience-moderation-controls";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  ControlCenterFilters,
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { resolveCatalogToolLabels } from "@/lib/community/catalog";
import { durationBucketLabel } from "@/lib/community/duration";
import {
  ADMIN_EXPERIENCE_PAGE_SIZE,
  isExperienceStatus,
} from "@/lib/community/moderation";
import { listExperiencesForModeration } from "@/lib/community/repository";
import type { ExperienceStatus } from "@/lib/community/schema";
import { formatItalianDate } from "@/lib/utils";

type ExperiencesPageProps = {
  searchParams: Promise<{ status?: string; page?: string; notice?: string }>;
};

const noticeCopy: Record<string, { tone: "ok" | "warn"; text: string }> = {
  published: { tone: "ok", text: "Esperienza pubblicata." },
  rejected: { tone: "ok", text: "Esperienza rifiutata." },
  hidden: { tone: "ok", text: "Esperienza nascosta." },
  republished: { tone: "ok", text: "Esperienza ripubblicata." },
  noop: { tone: "ok", text: "Nessuna modifica: lo stato era già quello richiesto." },
  conflict: {
    tone: "warn",
    text: "Contenuto aggiornato altrove. Ricarica e riprova sulla versione attuale.",
  },
  invalid: { tone: "warn", text: "Azione non valida. Controlla il motivo e riprova." },
  state: { tone: "warn", text: "Questa transizione non è consentita per lo stato attuale." },
  "not-found": { tone: "warn", text: "Esperienza non trovata." },
  error: { tone: "warn", text: "Operazione non riuscita. Riprova." },
};

const statusConfig: Record<
  ExperienceStatus,
  { active: boolean; activeLabel: string; inactiveLabel: string }
> = {
  pending: { active: true, activeLabel: "In revisione", inactiveLabel: "" },
  published: { active: true, activeLabel: "Pubblicata", inactiveLabel: "" },
  hidden: { active: false, activeLabel: "", inactiveLabel: "Nascosta" },
  rejected: { active: false, activeLabel: "", inactiveLabel: "Rifiutata" },
};

function parsePage(raw: string | undefined) {
  const value = Number(raw ?? "1");
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

export default async function ExperiencesPage({ searchParams }: ExperiencesPageProps) {
  const params = await searchParams;
  const status = isExperienceStatus(params.status) ? params.status : "pending";
  const page = parsePage(params.page);
  const notice = params.notice ? noticeCopy[params.notice] : null;
  const canWrite = isSupabaseAdminEnabled();

  let list: Awaited<ReturnType<typeof listExperiencesForModeration>> = {
    ok: true,
    page: [],
    pageNumber: page,
    pageSize: ADMIN_EXPERIENCE_PAGE_SIZE,
    total: 0,
    hasMore: false,
  };
  let loadError = false;

  if (canWrite) {
    try {
      list = await listExperiencesForModeration({ status, page });
      if (!list.ok) loadError = true;
    } catch {
      loadError = true;
    }
  }

  const rows = list.ok ? list.page : [];
  const total = list.ok ? list.total : 0;
  const labels: Record<string, { name: string; missing: boolean }> =
    await resolveCatalogToolLabels(rows.map((row) => row.toolSlug)).catch(
      () => ({}),
    );

  const filterItems = (
    [
      ["pending", "In revisione"],
      ["published", "Pubblicate"],
      ["hidden", "Nascoste"],
      ["rejected", "Rifiutate"],
    ] as const
  ).map(([value, label]) => ({
    href: `/admin/experiences?status=${value}`,
    label,
    value,
  }));

  const emptyTitle =
    status === "pending"
      ? "Nessuna esperienza in revisione."
      : "Nessuna esperienza in questo filtro.";

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_EXPERIENCE_PAGE_SIZE));

  return (
    <div className="page-shell py-6">
      <ControlCenterHeader
        title="Esperienze"
        description="Modera le esperienze della community prima che diventino pubbliche."
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

      <ControlCenterFilters items={[...filterItems]} active={status} />

      {rows.length > 0 ? (
        <div>
          {rows.map((experience) => {
            const tool = labels[experience.toolSlug] ?? {
              name: "Tool non più nel catalogo",
              missing: true,
            };
            const pill = statusConfig[experience.status];
            return (
              <article key={experience.id} className="tv-cc-card">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="tv-cc-card__title">{tool.name}</h2>
                    <AdminStatusPill
                      active={pill.active}
                      activeLabel={pill.activeLabel}
                      inactiveLabel={pill.inactiveLabel}
                    />
                  </div>
                  <p className="tv-cc-card__meta">
                    <span>{experience.displayName}</span>
                    <span>{durationBucketLabel(experience.durationBucket)}</span>
                    <span>{formatItalianDate(experience.submittedAt)}</span>
                    {tool.missing ? <span>{experience.toolSlug}</span> : (
                      <Link href={`/toools/${experience.toolSlug}`} className="underline">
                        {experience.toolSlug}
                      </Link>
                    )}
                  </p>
                  <p className="tv-cc-kicker mt-3">Come lo usa</p>
                  <p className="tv-cc-card__meta">{experience.useCase}</p>
                  <p className="tv-cc-kicker mt-3">Esperienza</p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--tv-text)]">
                    {experience.body}
                  </p>
                  <p className="tv-cc-kicker mt-3">Cosa funziona</p>
                  <ul className="list-disc pl-5 text-sm">
                    {experience.pros.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="tv-cc-kicker mt-3">Limiti</p>
                  <ul className="list-disc pl-5 text-sm">
                    {experience.limits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {experience.switchedFromSlug || experience.switchedFromLabel ? (
                    <>
                      <p className="tv-cc-kicker mt-3">Passato da</p>
                      <p className="tv-cc-card__meta">
                        {experience.switchedFromSlug ?? experience.switchedFromLabel}
                      </p>
                    </>
                  ) : null}
                  {experience.moderationReason ? (
                    <>
                      <p className="tv-cc-kicker mt-3">Motivo di moderazione</p>
                      <p className="whitespace-pre-wrap text-sm">{experience.moderationReason}</p>
                    </>
                  ) : null}
                  <ExperienceModerationControls
                    id={experience.id}
                    status={experience.status}
                    expectedUpdatedAt={experience.updatedAt}
                    returnStatus={status}
                    page={String(page)}
                    disabled={!canWrite}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState title={emptyTitle} description="Le nuove esperienze in attesa compaiono qui." />
      )}

      {totalPages > 1 ? (
        <nav className="mt-4 flex gap-2" aria-label="Paginazione">
          {page > 1 ? (
            <Link
              href={`/admin/experiences?status=${status}&page=${page - 1}`}
              className="tv-cc-btn tv-cc-btn--ghost"
            >
              Precedente
            </Link>
          ) : null}
          <span className="tv-cc-card__meta">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/experiences?status=${status}&page=${page + 1}`}
              className="tv-cc-btn tv-cc-btn--ghost"
            >
              Successiva
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
