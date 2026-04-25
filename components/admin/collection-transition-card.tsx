import Link from "next/link";

import {
  applyCollectionSafeAlignAction,
  importMockCollectionsAction,
  setCollectionTransitionReviewAction,
} from "@/app/(admin)/admin/actions";
import { getCollectionSafeAlignEligibility } from "@/lib/admin/collection-safe-align";
import {
  buildCollectionReadinessSummary,
  getCollectionTransitionDiffItems,
  getCollectionTransitionReviewMeta,
  getCollectionTransitionReviewState,
  getCollectionTransitionSeverity,
  getCollectionTransitionSeverityMeta,
} from "@/lib/admin/collection-review";
import {
  buildCollectionSyncPreview,
  getCollectionSyncPreviewMeta,
  getCollectionSyncPreviewPosture,
} from "@/lib/admin/collection-sync-preview";
import type {
  CollectionReadinessSummary,
  CollectionTransitionEntry,
  CollectionValidationIssue,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

function getReadinessMeta(state: CollectionReadinessSummary["state"]) {
  switch (state) {
    case "blocked":
      return {
        label: "Blocked",
        borderColor: "rgba(139,58,43,0.18)",
        background: "rgba(254,242,242,0.96)",
      };
    case "review":
      return {
        label: "Review",
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      };
    case "ready":
    default:
      return {
        label: "Ready",
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      };
  }
}

function getReviewMetaStyles(reviewState: ReturnType<typeof getCollectionTransitionReviewState>) {
  switch (reviewState) {
    case "reviewed":
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      };
    case "dismissed":
      return {
        borderColor: "rgba(112,82,255,0.16)",
        background: "rgba(245,242,255,0.92)",
      };
    case "unreviewed":
    default:
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      };
  }
}

export function CollectionTransitionCard({
  entry,
  collection,
  validationIssues,
  returnTo,
  canReview,
  canImport,
  canSafeAlign = false,
  safeAlignMessage,
  collectionId,
  compact = false,
}: {
  entry: CollectionTransitionEntry;
  collection?: CuratedCollectionRecord | null;
  validationIssues?: CollectionValidationIssue[];
  returnTo: string;
  canReview: boolean;
  canImport: boolean;
  canSafeAlign?: boolean;
  safeAlignMessage?: string;
  collectionId?: string | null;
  compact?: boolean;
}) {
  const severity = getCollectionTransitionSeverity(entry);
  const severityMeta = getCollectionTransitionSeverityMeta(severity);
  const reviewState = getCollectionTransitionReviewState(entry);
  const reviewMeta = getCollectionTransitionReviewMeta(reviewState);
  const reviewStyles = getReviewMetaStyles(reviewState);
  const diffItems = getCollectionTransitionDiffItems(entry);
  const readiness =
    collection && validationIssues
      ? buildCollectionReadinessSummary({
          collection,
          validationIssues,
          transitionEntry: entry,
        })
      : null;
  const readinessMeta = readiness ? getReadinessMeta(readiness.state) : null;
  const syncPreview = buildCollectionSyncPreview(entry);
  const syncPreviewMeta = syncPreview
    ? getCollectionSyncPreviewMeta(syncPreview.state)
    : null;
  const hasSafeAlignPreview = syncPreview?.state === "safe-align-ready";
  const syncPreviewPosture = getCollectionSyncPreviewPosture({
    preview: syncPreview,
    readiness,
    entry,
  });
  const safeAlignEligibility = getCollectionSafeAlignEligibility({
    entry,
    preview: syncPreview,
  });

  return (
    <article
      className="rounded-[var(--radius-lg)] border p-5"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={compact ? "text-xl" : "text-2xl"}>{entry.title}</h3>
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{
                borderColor:
                  severity === "critical-conflict"
                    ? "rgba(139,58,43,0.18)"
                    : severity === "minor-drift" || severity === "pending"
                      ? "rgba(161,105,47,0.18)"
                      : "rgba(15,118,110,0.18)",
                background:
                  severity === "critical-conflict"
                    ? "rgba(254,242,242,0.96)"
                    : severity === "minor-drift" || severity === "pending"
                      ? "rgba(255,251,235,0.96)"
                      : "rgba(236,253,245,0.95)",
              }}
            >
              {severityMeta.label}
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={reviewStyles}
            >
              {reviewMeta.label}
            </span>
            {readinessMeta ? (
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: readinessMeta.borderColor,
                  background: readinessMeta.background,
                }}
              >
                {readinessMeta.label}
              </span>
            ) : null}
            {syncPreviewMeta ? (
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor:
                    hasSafeAlignPreview
                      ? "rgba(15,118,110,0.18)"
                      : "rgba(161,105,47,0.18)",
                  background:
                    hasSafeAlignPreview
                      ? "rgba(236,253,245,0.95)"
                      : "rgba(255,251,235,0.96)",
                }}
              >
                {syncPreviewMeta.label}
              </span>
            ) : null}
          </div>
          <div
            className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--muted)" }}
          >
            <span>Slug: {entry.slug}</span>
            <span>Public winner: {entry.public_source ?? "nessuno"}</span>
            <span>Mock: {entry.mock ? "si`" : "no"}</span>
            <span>Supabase: {entry.supabase ? "si`" : "no"}</span>
          </div>
          <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
            {severityMeta.description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {entry.supabase ? (
            <Link
              href={`/admin/collections/${entry.supabase.id}`}
              className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
            >
              Apri detail
            </Link>
          ) : null}
          <Link
            href={returnTo}
            className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
          >
            Aggiorna confronto
          </Link>
        </div>
      </div>

      {readiness ? (
        <div
          className="mt-4 rounded-[22px] border px-4 py-4 text-sm"
          style={{
            borderColor: readinessMeta?.borderColor,
            background: readinessMeta?.background,
          }}
        >
          <strong>{readiness.label}:</strong> {readiness.summary}
        </div>
      ) : null}

      {syncPreview ? (
        <div
          className="mt-4 rounded-[22px] border px-4 py-4 text-sm"
          style={{
            borderColor:
              syncPreviewPosture.tone === "error"
                ? "rgba(139,58,43,0.18)"
                : syncPreviewPosture.tone === "warning"
                  ? "rgba(161,105,47,0.18)"
                  : "rgba(15,118,110,0.18)",
            background:
              syncPreviewPosture.tone === "error"
                ? "rgba(254,242,242,0.96)"
                : syncPreviewPosture.tone === "warning"
                  ? "rgba(255,251,235,0.96)"
                  : "rgba(236,253,245,0.95)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold">{syncPreviewPosture.label}</p>
              <p style={{ color: "var(--muted-strong)" }}>
                {syncPreview.summary}
              </p>
              <p style={{ color: "var(--muted)" }}>
                Safe changes: {syncPreview.safe_change_count} · Editorial changes:{" "}
                {syncPreview.editorial_change_count}
              </p>
            </div>
            {collectionId ? (
              <Link
                href={`/admin/collections/${collectionId}#sync-preview`}
                className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
              >
                Vedi preview
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {diffItems.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {diffItems.map((item) => (
            <div
              key={`${entry.slug}-${item.key}`}
              className="rounded-[22px] border p-4"
              style={{
                borderColor:
                  item.severity === "critical"
                    ? "rgba(139,58,43,0.18)"
                    : "rgba(161,105,47,0.18)",
                background:
                  item.severity === "critical"
                    ? "rgba(254,242,242,0.96)"
                    : "rgba(255,251,235,0.96)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">{item.label}</p>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.severity === "critical" ? "critical" : "minor"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {[
                  { label: "Mock", value: item.mock_value },
                  { label: "Supabase", value: item.supabase_value },
                  { label: "Public winner", value: item.winner_value },
                ].map((field) => (
                  <div
                    key={`${item.key}-${field.label}`}
                    className="rounded-[18px] border px-3 py-3"
                    style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                  >
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mt-5 rounded-[22px] border px-4 py-4 text-sm"
          style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(236,253,245,0.95)" }}
        >
          Nessun drift aperto sui campi chiave di transizione.
        </div>
      )}

      {entry.warnings.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {entry.warnings.slice(0, compact ? 2 : 4).map((warning) => (
            <div
              key={`${entry.slug}-${warning}`}
              className="rounded-[18px] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
            >
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      {readiness ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {readiness.checks.map((check) => (
            <div
              key={`${entry.slug}-${check.label}`}
              className="rounded-[18px] border px-4 py-3 text-sm"
              style={{
                borderColor:
                  check.state === "error"
                    ? "rgba(139,58,43,0.18)"
                    : check.state === "warning"
                      ? "rgba(161,105,47,0.18)"
                      : "rgba(15,118,110,0.18)",
                background:
                  check.state === "error"
                    ? "rgba(254,242,242,0.96)"
                    : check.state === "warning"
                      ? "rgba(255,251,235,0.96)"
                      : "rgba(236,253,245,0.95)",
              }}
            >
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                {check.label}
              </p>
              <p className="mt-2">{check.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
        {safeAlignEligibility.eligible && canSafeAlign && collectionId ? (
          <form className="w-full sm:w-auto" action={applyCollectionSafeAlignAction}>
            <input type="hidden" name="slug" value={entry.slug} />
            <input type="hidden" name="collection_id" value={collectionId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button
              type="submit"
              className="button-shell button-primary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            >
              Apply safe align
            </button>
          </form>
        ) : null}

        {canReview ? (
          <>
            <form className="w-full sm:w-auto" action={setCollectionTransitionReviewAction}>
              <input type="hidden" name="slug" value={entry.slug} />
              <input type="hidden" name="review_state" value="reviewed" />
              <input type="hidden" name="return_to" value={returnTo} />
              {collectionId ? <input type="hidden" name="collection_id" value={collectionId} /> : null}
              <button
                type="submit"
                className="button-shell button-secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)]"
                style={{
                  borderColor: "rgba(15,118,110,0.18)",
                  background: "rgba(236,253,245,0.95)",
                }}
              >
                Mark as reviewed
              </button>
            </form>

            <form className="w-full sm:w-auto" action={setCollectionTransitionReviewAction}>
              <input type="hidden" name="slug" value={entry.slug} />
              <input type="hidden" name="review_state" value="dismissed" />
              <input type="hidden" name="return_to" value={returnTo} />
              {collectionId ? <input type="hidden" name="collection_id" value={collectionId} /> : null}
              <button
                type="submit"
                className="button-shell button-secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)]"
                style={{
                  borderColor: "rgba(112,82,255,0.16)",
                  background: "rgba(245,242,255,0.92)",
                }}
              >
                Dismiss warning
              </button>
            </form>

            {reviewState !== "unreviewed" ? (
              <form className="w-full sm:w-auto" action={setCollectionTransitionReviewAction}>
                <input type="hidden" name="slug" value={entry.slug} />
                <input type="hidden" name="review_state" value="clear" />
                <input type="hidden" name="return_to" value={returnTo} />
                {collectionId ? <input type="hidden" name="collection_id" value={collectionId} /> : null}
                <button
                  type="submit"
                  className="button-shell button-secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)]"
                >
                  Clear review state
                </button>
              </form>
            ) : null}
          </>
        ) : null}

        {canImport && entry.import_status === "pending-import" ? (
          <form className="w-full sm:w-auto" action={importMockCollectionsAction}>
            <input type="hidden" name="slug" value={entry.slug} />
            <button
              type="submit"
              className="button-shell button-primary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            >
              Importa slug
            </button>
          </form>
        ) : null}
      </div>

      {safeAlignEligibility.eligible && !canSafeAlign ? (
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {safeAlignMessage ??
            "Safe align non disponibile: abilita audit persistente e write path prima di applicarlo."}
        </p>
      ) : null}
    </article>
  );
}
