import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { CollectionTransitionCard } from "@/components/admin/collection-transition-card";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { ControlCenterFilters, ControlCenterHeader, ControlCenterNotice } from "@/components/admin/control-center-header";
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
  "review-saved": "Revisione aggiornata correttamente.",
  "review-cleared": "Revisione ripulita correttamente.",
  "review-unavailable":
    "Revisione non disponibile: completa la configurazione delle raccolte per salvarla.",
  "review-invalid": "Azione di revisione non valida.",
  "safe-align-unavailable":
    "Riallineamento sicuro non disponibile: abilita salvataggio e registro modifiche prima di applicarlo.",
  "safe-align-ineligible":
    "Questo caso esce dalle regole di riallineamento automatico e resta solo in anteprima.",
  "safe-align-invalid": "Azione di riallineamento non valida.",
  "safe-align-failed":
    "Riallineamento non completato: l'azione è stata fermata prima di lasciare uno stato ambiguo.",
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
      ? `Riallineamento sicuro applicato correttamente${params.fields ? ` su: ${params.fields.replaceAll(",", ", ")}` : "."}`
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
      label: "Revisioni aperte",
      value: reviewItems.filter((item) => item.reviewState === "unreviewed").length,
    },
    {
      label: "Conflitti critici",
      value: reviewItems.filter((item) => item.severity === "critical-conflict").length,
    },
    {
      label: "Importazioni in attesa",
      value: reviewItems.filter((item) => item.severity === "pending").length,
    },
    {
      label: "Anteprime riallineabili",
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
    { href: "/admin/collections/review", label: "Aperte", count: reviewViewCounts.open },
    {
      href: "/admin/collections/review?view=alignable",
      label: "Riallineabili",
      count: reviewViewCounts.alignable,
    },
    {
      href: "/admin/collections/review?view=conflict",
      label: "Conflitti",
      count: reviewViewCounts.conflict,
    },
    {
      href: "/admin/collections/review?view=pending",
      label: "Da importare",
      count: reviewViewCounts.pending,
    },
    {
      href: "/admin/collections/review?view=reviewed",
      label: "Riviste",
      count: reviewViewCounts.reviewed,
    },
    {
      href: "/admin/collections/review?view=ready",
      label: "Pronte",
      count: reviewViewCounts.ready,
    },
    { href: "/admin/collections/review?view=all", label: "Tutte", count: reviewViewCounts.all },
  ] as const;
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
        <LocalizedAttributes><ControlCenterHeader
          kicker="Raccolte"
          title="Revisione conflitti"
          description="Conflitti, importazioni in attesa e revisioni. Nessun riallineamento distruttivo."
          backHref="/admin/collections"
          backLabel="Torna alle raccolte"
          metrics={reviewMetrics.map((item) => ({ label: item.label, value: item.value }))}
        /></LocalizedAttributes>
        {statusMessage ? <ControlCenterNotice tone="ok"><LocalizedText>{statusMessage}</LocalizedText></ControlCenterNotice> : null}
        <ControlCenterFilters
          active={params.view ?? "open"}
          items={reviewViewOptions.map((item) => ({
            href: item.href,
            label: item.label,
            value: item.href.includes("view=") ? item.href.split("view=")[-1] : "open",
            count: item.count,
          }))}
        />

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
          <LocalizedAttributes><AdminEmptyState
            title="Nessun elemento da rivedere in questa vista"
            description="Questo filtro non mostra conflitti aperti. Puoi tornare alla lista raccolte o allargare la vista a tutte le revisioni."
            ctaHref="/admin/collections/review?view=all"
            ctaLabel="Apri tutte le revisioni"
          /></LocalizedAttributes>
        )}
      </div>
    </div>
  );
}
