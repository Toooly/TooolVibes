import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import {
  applyCollectionSafeAlignAction,
  importMockCollectionsAction,
  setCollectionTransitionReviewAction,
} from "@/app/(admin)/admin/actions/collections";
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
        label: "Bloccata",
        borderColor: "rgba(139,58,43,0.18)",
        background: "rgba(254,242,242,0.96)",
      };
    case "review":
      return {
        label: "Da rivedere",
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(243,191,76,0.12)",
      };
    case "ready":
    default:
      return {
        label: "Pronta",
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(57,210,246,0.12)",
      };
  }
}

function getReviewMetaStyles(reviewState: ReturnType<typeof getCollectionTransitionReviewState>) {
  switch (reviewState) {
    case "reviewed":
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(57,210,246,0.12)",
      };
    case "dismissed":
      return {
        borderColor: "rgba(112,82,255,0.16)",
        background: "rgba(106,60,255,0.14)",
      };
    case "unreviewed":
    default:
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(243,191,76,0.12)",
      };
  }
}

function getSourceLabel(source: string | null | undefined) {
  switch (source) {
    case "supabase":
      return "Archivio reale";
    case "mock":
      return "Sorgente locale";
    case "content":
      return "Contenuto editoriale";
    default:
      return "nessuna";
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
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={compact ? "text-xl" : "text-2xl"}><LocalizedText>{entry.title}</LocalizedText></h3>
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
                      ? "rgba(243,191,76,0.12)"
                      : "rgba(57,210,246,0.12)",
              }}
            >
              <LocalizedText>{severityMeta.label}</LocalizedText>
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={reviewStyles}
            >
              <LocalizedText>{reviewMeta.label}</LocalizedText>
            </span>
            {readinessMeta ? (
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: readinessMeta.borderColor,
                  background: readinessMeta.background,
                }}
              >
                <LocalizedText>{readinessMeta.label}</LocalizedText>
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
                      ? "rgba(57,210,246,0.12)"
                      : "rgba(243,191,76,0.12)",
                }}
              >
                <LocalizedText>{syncPreviewMeta.label}</LocalizedText>
              </span>
            ) : null}
          </div>
          <div
            className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--muted)" }}
          >
            <span><LocalizedText>{"Slug: "}</LocalizedText>{entry.slug}</span>
            <span><LocalizedText>{"Sorgente pubblica: "}</LocalizedText><LocalizedText>{getSourceLabel(entry.public_source)}</LocalizedText></span>
            <span><LocalizedText>{"Locale: "}</LocalizedText><LocalizedText>{entry.mock ? "sì" : "no"}</LocalizedText></span>
            <span><LocalizedText>{"Archivio reale: "}</LocalizedText><LocalizedText>{entry.supabase ? "sì" : "no"}</LocalizedText></span>
          </div>
          <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
            <LocalizedText>{severityMeta.description}</LocalizedText>
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {entry.supabase ? (
            <Link
              href={`/admin/collections/${entry.supabase.id}`}
              className="tv-cc-btn tv-cc-btn--secondary rounded-full px-4 py-2 text-center text-sm font-semibold"
            ><LocalizedText>{"Apri dettaglio "}</LocalizedText></Link>
          ) : null}
          <Link
            href={returnTo}
            className="tv-cc-btn tv-cc-btn--secondary rounded-full px-4 py-2 text-center text-sm font-semibold"
          ><LocalizedText>{"Ricarica confronto "}</LocalizedText></Link>
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
          <strong><LocalizedText>{readiness.label}</LocalizedText>:</strong> <LocalizedText>{readiness.summary}</LocalizedText>
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
                  ? "rgba(243,191,76,0.12)"
                  : "rgba(57,210,246,0.12)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold"><LocalizedText>{syncPreviewPosture.label}</LocalizedText></p>
              <p style={{ color: "var(--muted-strong)" }}>
                <LocalizedText>{syncPreview.summary}</LocalizedText>
              </p>
              <p style={{ color: "var(--muted)" }}><LocalizedText>{"Modifiche sicure: "}</LocalizedText>{syncPreview.safe_change_count}<LocalizedText>{" - Modifiche editoriali:"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
                {syncPreview.editorial_change_count}
              </p>
            </div>
            {collectionId ? (
              <Link
                href={`/admin/collections/${collectionId}#sync-preview`}
                className="tv-cc-btn tv-cc-btn--secondary rounded-full px-4 py-2 text-center text-sm font-semibold"
              ><LocalizedText>{"Vedi anteprima "}</LocalizedText></Link>
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
                    : "rgba(243,191,76,0.12)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em]"><LocalizedText>{item.label}</LocalizedText></p>
                <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  <LocalizedText>{item.severity === "critical" ? "critico" : "minore"}</LocalizedText>
                </span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {[
                  { label: "Sorgente locale", value: item.mock_value },
                  { label: "Archivio reale", value: item.supabase_value },
                  { label: "Sorgente pubblica", value: item.winner_value },
                ].map((field) => (
                  <div
                    key={`${item.key}-${field.label}`}
                    className="rounded-[18px] border px-3 py-3"
                    style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                      <LocalizedText>{field.label}</LocalizedText>
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
          style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(57,210,246,0.12)" }}
        ><LocalizedText>{"Nessuna differenza aperta sui campi chiave di transizione. "}</LocalizedText></div>
      )}

      {entry.warnings.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {entry.warnings.slice(0, compact ? 2 : 4).map((warning) => (
            <div
              key={`${entry.slug}-${warning}`}
              className="rounded-[18px] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(243,191,76,0.12)" }}
            >
              <LocalizedText>{warning}</LocalizedText>
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
                      ? "rgba(243,191,76,0.12)"
                      : "rgba(57,210,246,0.12)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                <LocalizedText>{check.label}</LocalizedText>
              </p>
              <p className="mt-2"><LocalizedText>{check.detail}</LocalizedText></p>
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
              className="tv-cc-btn tv-cc-btn--primary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            ><LocalizedText>{"Applica riallineamento sicuro "}</LocalizedText></button>
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
                className="tv-cc-btn tv-cc-btn--secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold "
                style={{
                  borderColor: "rgba(15,118,110,0.18)",
                  background: "rgba(57,210,246,0.12)",
                }}
              ><LocalizedText>{"Segna come rivista "}</LocalizedText></button>
            </form>

            <form className="w-full sm:w-auto" action={setCollectionTransitionReviewAction}>
              <input type="hidden" name="slug" value={entry.slug} />
              <input type="hidden" name="review_state" value="dismissed" />
              <input type="hidden" name="return_to" value={returnTo} />
              {collectionId ? <input type="hidden" name="collection_id" value={collectionId} /> : null}
              <button
                type="submit"
                className="tv-cc-btn tv-cc-btn--secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold "
                style={{
                  borderColor: "rgba(112,82,255,0.16)",
                  background: "rgba(106,60,255,0.14)",
                }}
              ><LocalizedText>{"Ignora segnale "}</LocalizedText></button>
            </form>

            {reviewState !== "unreviewed" ? (
              <form className="w-full sm:w-auto" action={setCollectionTransitionReviewAction}>
                <input type="hidden" name="slug" value={entry.slug} />
                <input type="hidden" name="review_state" value="clear" />
                <input type="hidden" name="return_to" value={returnTo} />
                {collectionId ? <input type="hidden" name="collection_id" value={collectionId} /> : null}
                <button
                  type="submit"
                  className="tv-cc-btn tv-cc-btn--secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold "
                ><LocalizedText>{"Riapri revisione "}</LocalizedText></button>
              </form>
            ) : null}
          </>
        ) : null}

        {canImport && entry.import_status === "pending-import" ? (
          <form className="w-full sm:w-auto" action={importMockCollectionsAction}>
            <input type="hidden" name="slug" value={entry.slug} />
            <button
              type="submit"
              className="tv-cc-btn tv-cc-btn--primary w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            ><LocalizedText>{"Importa slug "}</LocalizedText></button>
          </form>
        ) : null}
      </div>

      {safeAlignEligibility.eligible && !canSafeAlign ? (
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          <LocalizedText>{safeAlignMessage ??
            "Riallineamento sicuro non disponibile: abilita salvataggio e registro modifiche prima di applicarlo."}</LocalizedText>
        </p>
      ) : null}
    </article>
  );
}
