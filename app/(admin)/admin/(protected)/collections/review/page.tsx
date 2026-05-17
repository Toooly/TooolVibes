import Link from "next/link";

import { CollectionTransitionCard } from "@/components/admin/collection-transition-card";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { SectionHeading } from "@/components/sections/section-heading";
import {
  getCollectionTransitionReviewState,
  getCollectionTransitionSeverity,
} from "@/lib/admin/collection-review";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";

type AdminCollectionsReviewPageProps = {
  searchParams: Promise<{
    view?: string;
    status?: string;
    review?: string;
    fields?: string;
  }>;
};

const reviewStatusMessages: Record<string, string> = {
  "review-saved": "Review state aggiornato correttamente.",
  "review-cleared": "Review state ripulito correttamente.",
  "review-unavailable":
    "Review state non disponibile: applica la migration delle collection transition reviews per salvarlo in modo persistente.",
  "review-invalid": "Azione review non valida.",
  "safe-align-unavailable":
    "Safe align non disponibile: abilita write path Supabase e migration `0014-0015` per tracciarlo in modo persistente.",
  "safe-align-ineligible":
    "Questo caso esce dalla safe align policy attuale e resta preview-only.",
  "safe-align-invalid": "Azione safe align non valida.",
  "safe-align-failed":
    "Safe align non completato: l'azione è stata fermata prima di lasciare uno stato ambiguo.",
};

function matchesView(
  view: string | undefined,
  {
    readiness,
    reviewState,
    severity,
    previewState,
  }: {
    readiness: "ready" | "review" | "blocked" | null;
    reviewState: ReturnType<typeof getCollectionTransitionReviewState>;
    severity: ReturnType<typeof getCollectionTransitionSeverity>;
    previewState: "safe-align-ready" | "needs-editorial-decision" | null;
  },
) {
  switch (view) {
    case "alignable":
      return previewState === "safe-align-ready";
    case "conflict":
      return severity === "critical-conflict" || severity === "minor-drift";
    case "pending":
      return severity === "pending";
    case "ready":
      return readiness === "ready";
    case "reviewed":
      return reviewState === "reviewed" || reviewState === "dismissed";
    case "all":
      return true;
    case "open":
    default:
      return (
        severity === "critical-conflict" ||
        severity === "minor-drift" ||
        severity === "pending" ||
        reviewState === "unreviewed"
      );
  }
}

export default async function AdminCollectionsReviewPage({
  searchParams,
}: AdminCollectionsReviewPageProps) {
  const [params, runtime] = await Promise.all([
    searchParams,
    getAdminCollectionsRuntime(),
  ]);
  const statusMessage =
    params.status === "safe-align-applied"
      ? `Safe align applicato correttamente${params.fields ? ` su: ${params.fields.replaceAll(",", ", ")}` : "."}`
      : params.status
        ? reviewStatusMessages[params.status] ?? null
        : null;

  const reviewItems = runtime.transitionReport.entries
    .map((entry) => {
      const collection =
        runtime.collections.find((item) => item.slug === entry.slug) ??
        entry.supabase ??
        entry.mock ??
        entry.content ??
        null;
      const validationIssues =
        runtime.workspaceSnapshot.validation[entry.slug] ??
        runtime.publicSnapshot.validation[entry.slug] ??
        [];
      const readiness = collection ? runtime.readinessBySlug[entry.slug]?.state ?? null : null;
      const reviewState = getCollectionTransitionReviewState(entry);
      const severity = getCollectionTransitionSeverity(entry);
      const preview = runtime.syncPreviewBySlug[entry.slug] ?? null;

      return {
        entry,
        collection,
        validationIssues,
        readiness,
        reviewState,
        severity,
        preview,
      };
    });
  const reviewMetrics = [
    {
      label: "Open review",
      value: reviewItems.filter((item) => item.reviewState === "unreviewed").length,
    },
    {
      label: "Critical conflict",
      value: reviewItems.filter((item) => item.severity === "critical-conflict").length,
    },
    {
      label: "Pending import",
      value: reviewItems.filter((item) => item.severity === "pending").length,
    },
    {
      label: "Alignable preview",
      value: reviewItems.filter((item) => item.preview?.state === "safe-align-ready").length,
    },
  ] as const;
  const reviewViewCounts = {
    open: reviewItems.filter((item) =>
      matchesView("open", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    alignable: reviewItems.filter((item) =>
      matchesView("alignable", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    conflict: reviewItems.filter((item) =>
      matchesView("conflict", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    pending: reviewItems.filter((item) =>
      matchesView("pending", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    reviewed: reviewItems.filter((item) =>
      matchesView("reviewed", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    ready: reviewItems.filter((item) =>
      matchesView("ready", {
        readiness: item.readiness,
        reviewState: item.reviewState,
        severity: item.severity,
        previewState: item.preview?.state ?? null,
      }),
    ).length,
    all: reviewItems.length,
  } as const;
  const reviewViewOptions = [
    { href: "/admin/collections/review", label: "Open", count: reviewViewCounts.open },
    {
      href: "/admin/collections/review?view=alignable",
      label: "Alignable",
      count: reviewViewCounts.alignable,
    },
    {
      href: "/admin/collections/review?view=conflict",
      label: "Conflict",
      count: reviewViewCounts.conflict,
    },
    {
      href: "/admin/collections/review?view=pending",
      label: "Pending",
      count: reviewViewCounts.pending,
    },
    {
      href: "/admin/collections/review?view=reviewed",
      label: "Reviewed",
      count: reviewViewCounts.reviewed,
    },
    {
      href: "/admin/collections/review?view=ready",
      label: "Ready",
      count: reviewViewCounts.ready,
    },
    { href: "/admin/collections/review?view=all", label: "All", count: reviewViewCounts.all },
  ] as const;
  const selectedViewHref = params.view
    ? `/admin/collections/review?view=${params.view}`
    : "/admin/collections/review";
  const entries = reviewItems.filter((item) =>
    matchesView(params.view, {
      readiness: item.readiness,
      reviewState: item.reviewState,
      severity: item.severity,
      previewState: item.preview?.state ?? null,
    }),
  );

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Conflict review"
              title="Leggi il drift prima di agire."
              description="Questa surface raccoglie conflitti, pending import e review state in un unico posto. Nessun sync distruttivo: qui decidiamo cosa è davvero da toccare e cosa può restare com'è."
            />
            <div className="hidden flex-wrap gap-3 sm:flex">
              <Link
                href="/admin/collections"
                className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                Torna alle collections
              </Link>
            </div>
          </div>

          <div className="tool-rail -mx-1 mt-5 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
            <Link
              href="/admin/collections"
              className="button-shell button-secondary text-ui-strong inline-flex shrink-0 rounded-full px-4 py-2 text-[0.78rem] font-semibold"
            >
              Torna alle collections
            </Link>
          </div>

          {statusMessage ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(236,253,245,0.95)" }}
            >
              {statusMessage}
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-6 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {reviewMetrics.map((item) => (
              <article
                key={item.label}
                className="stat-block w-[11rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)" }}
              >
                <p
                  className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </p>
                <p className="mt-3 text-3xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden gap-4 sm:grid lg:grid-cols-4">
            {reviewMetrics.map((item) => (
              <article
                key={`desktop-${item.label}`}
                className="stat-block rounded-[var(--radius-lg)] border p-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)" }}
              >
                <p
                  className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </p>
                <p className="mt-3 text-3xl">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 border-b pb-5">
            <p className="editorial-label">Review filters</p>
            <div className="tool-rail -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {reviewViewOptions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="selection-chip text-ui-strong inline-flex shrink-0 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor:
                      item.href === selectedViewHref ? "rgba(112,82,255,0.24)" : "var(--line)",
                    background:
                      item.href === selectedViewHref
                        ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,237,255,0.92))"
                        : "rgba(255,255,255,0.82)",
                    color:
                      item.href === selectedViewHref
                        ? "var(--accent-strong)"
                        : "var(--muted-strong)",
                  }}
                >
                  {item.label} ({item.count})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-5">
            {entries.map((item) => (
              <CollectionTransitionCard
                key={item.entry.slug}
                entry={item.entry}
                collection={item.collection}
                validationIssues={item.validationIssues}
                returnTo={`/admin/collections/review${params.view ? `?view=${params.view}` : ""}`}
                canReview={runtime.canReview}
                canImport={runtime.canWrite}
                canSafeAlign={runtime.canSafeAlign}
                safeAlignMessage={runtime.safeAlignMessage}
                collectionId={item.entry.supabase?.id ?? item.collection?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="Nessun item da rivedere in questa vista"
            description="Il conflict review layer ? pulito per questo filtro. Puoi tornare alla lista collections o allargare la vista a `All`."
            ctaHref="/admin/collections/review?view=all"
            ctaLabel="Apri tutte le review"
          />
        )}
      </div>
    </div>
  );
}
