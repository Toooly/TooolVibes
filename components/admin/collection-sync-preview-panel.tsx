import Link from "next/link";

import { applyCollectionSafeAlignAction } from "@/app/(admin)/admin/actions";
import { SectionHeading } from "@/components/sections/section-heading";
import { getCollectionSafeAlignEligibility } from "@/lib/admin/collection-safe-align";
import {
  getCollectionSyncPreviewMeta,
  getCollectionSyncPreviewPosture,
  getCollectionSyncPreviewRiskMeta,
} from "@/lib/admin/collection-sync-preview";
import type {
  CollectionReadinessSummary,
  CollectionSafeAlignEventRecord,
  CollectionSyncPreview,
  CollectionTransitionEntry,
} from "@/lib/types/collection";

function getToneStyles(tone: "pass" | "warning" | "error") {
  switch (tone) {
    case "error":
      return {
        borderColor: "rgba(139,58,43,0.18)",
        background: "rgba(254,242,242,0.96)",
      };
    case "warning":
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      };
    case "pass":
    default:
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      };
  }
}

function getRiskStyles(risk: CollectionSyncPreview["risk"]) {
  switch (risk) {
    case "high":
      return {
        borderColor: "rgba(139,58,43,0.18)",
        background: "rgba(254,242,242,0.96)",
      };
    case "medium":
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      };
    case "low":
    default:
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      };
  }
}

function getChangeStyles(kind: "safe" | "editorial") {
  return kind === "safe"
    ? {
        borderColor: "rgba(15,118,110,0.18)",
        background: "rgba(236,253,245,0.95)",
      }
    : {
        borderColor: "rgba(161,105,47,0.18)",
        background: "rgba(255,251,235,0.96)",
      };
}

export function CollectionSyncPreviewPanel({
  preview,
  entry,
  readiness,
  detailHref,
  canSafeAlign = false,
  safeAlignMessage,
  collectionId,
  returnTo,
  lastSafeAlign,
  compact = false,
}: {
  preview: CollectionSyncPreview | null;
  entry?: CollectionTransitionEntry | null;
  readiness?: CollectionReadinessSummary | null;
  detailHref?: string;
  canSafeAlign?: boolean;
  safeAlignMessage?: string;
  collectionId?: string | null;
  returnTo?: string;
  lastSafeAlign?: CollectionSafeAlignEventRecord | null;
  compact?: boolean;
}) {
  if (!preview) {
    return (
      <section
        className="rounded-[var(--radius-xl)] border p-5 sm:p-6"
        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
      >
        <div className="space-y-2">
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--muted)" }}
          >
            Sync preview
          </p>
          <h3 className="text-xl">Nessun riallineamento proposto.</h3>
          <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
            Su questa collection non c&apos;e` un confronto legacy -&gt; Supabase abbastanza definito da
            trasformarsi in preview. O e` gia` allineata, oppure manca uno dei due lati del confronto.
          </p>
        </div>
        {lastSafeAlign ? (
          <div
            className="mt-5 rounded-[18px] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(245,242,255,0.92)" }}
          >
            Ultimo safe align registrato: {new Date(lastSafeAlign.applied_at).toLocaleString("it-IT")} ·{" "}
            {lastSafeAlign.aligned_fields.join(", ")}
          </div>
        ) : null}
      </section>
    );
  }

  const previewMeta = getCollectionSyncPreviewMeta(preview.state);
  const riskMeta = getCollectionSyncPreviewRiskMeta(preview.risk);
  const posture = getCollectionSyncPreviewPosture({
    preview,
    readiness,
    entry,
  });
  const safeAlignEligibility = getCollectionSafeAlignEligibility({
    entry,
    preview,
  });
  const postureStyles = getToneStyles(posture.tone);
  const riskStyles = getRiskStyles(preview.risk);

  return (
    <section
      className="rounded-[var(--radius-xl)] border p-5 sm:p-6"
      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Sync preview"
          title={compact ? "Preview del riallineamento" : "Cosa cambierebbe prima di toccare davvero la source reale."}
          description="Questo layer e` solo descrittivo: distingue i cambi candidati a un align prudente da quelli che restano nel perimetro di una decisione editoriale."
        />
        {detailHref ? (
          <Link
            href={detailHref}
            className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-sm font-semibold"
          >
            Vedi preview
          </Link>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={postureStyles}
        >
          {posture.label}
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={riskStyles}
        >
          {riskMeta.label}
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: "rgba(112,82,255,0.16)",
            background: "rgba(245,242,255,0.92)",
          }}
        >
          Public winner -&gt; {preview.public_winner ?? "n/d"}
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
        >
          Align target -&gt; {preview.target}
        </span>
      </div>

      <div
        className="mt-5 rounded-[22px] border px-4 py-4 text-sm"
        style={postureStyles}
      >
        <p className="font-semibold">{previewMeta.label}</p>
        <p className="mt-2 leading-7">{preview.summary}</p>
        <p className="mt-2 leading-7" style={{ color: "var(--muted-strong)" }}>
          {previewMeta.description} {riskMeta.description} {posture.description}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Safe changes", value: preview.safe_change_count },
          { label: "Editorial changes", value: preview.editorial_change_count },
          {
            label: "Sync posture",
            value: preview.can_safe_align_fields ? "preview pronta" : "preview-only",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[20px] border px-4 py-4"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
          >
            <p
              className="text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--muted)" }}
            >
              {item.label}
            </p>
            <p className="mt-2 text-lg">{item.value}</p>
          </article>
        ))}
      </div>

      {preview.field_changes.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--muted)" }}
          >
            Campi che cambierebbero
          </p>
          <div className="grid gap-3">
            {preview.field_changes.map((change) => (
              <article
                key={`${preview.slug}-${change.key}`}
                className="rounded-[22px] border p-4"
                style={getChangeStyles(change.kind)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{change.label}</p>
                  <span className="rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={getChangeStyles(change.kind)}>
                    {change.kind === "safe" ? "safe align candidate" : "needs decision"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                  {change.summary}
                </p>
                {!compact ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {[
                      { label: "Current supabase", value: change.current_value },
                      { label: "Legacy mock", value: change.legacy_value },
                      { label: "Preview target", value: change.target_value },
                    ].map((field) => (
                      <div
                        key={`${change.key}-${field.label}`}
                        className="rounded-[18px] border px-3 py-3"
                        style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                      >
                        <p
                          className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--muted)" }}
                        >
                          {field.label}
                        </p>
                        <p className="mt-2 text-sm leading-6">{field.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {preview.slot_changes.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--muted)" }}
          >
            Tool slot che cambierebbero
          </p>
          <div className="grid gap-3">
            {preview.slot_changes.map((change, index) => (
              <article
                key={`${preview.slug}-${change.tool_slug}-${index}`}
                className="rounded-[22px] border p-4"
                style={{
                  borderColor:
                    change.risk === "high"
                      ? "rgba(139,58,43,0.18)"
                      : "rgba(161,105,47,0.18)",
                  background:
                    change.risk === "high"
                      ? "rgba(254,242,242,0.96)"
                      : "rgba(255,251,235,0.96)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {change.label}: {change.tool_slug}
                  </p>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      borderColor:
                        change.risk === "high"
                          ? "rgba(139,58,43,0.18)"
                          : "rgba(161,105,47,0.18)",
                      background:
                        change.risk === "high"
                          ? "rgba(254,242,242,0.96)"
                          : "rgba(255,251,235,0.96)",
                    }}
                  >
                    {change.risk === "high" ? "high impact" : "needs review"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                  {change.summary}
                </p>
                {!compact ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {[
                      { label: "Current supabase", value: change.current_value },
                      { label: "Legacy mock", value: change.legacy_value },
                    ].map((field) => (
                      <div
                        key={`${change.tool_slug}-${field.label}`}
                        className="rounded-[18px] border px-3 py-3"
                        style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                      >
                        <p
                          className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--muted)" }}
                        >
                          {field.label}
                        </p>
                        <p className="mt-2 text-sm leading-6">{field.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {preview.notes.length > 0 ? (
        <div className="mt-6 grid gap-2">
          {preview.notes.map((note) => (
            <div
              key={`${preview.slug}-${note}`}
              className="rounded-[18px] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(245,242,255,0.92)" }}
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}

      {lastSafeAlign ? (
        <div
          className="mt-6 rounded-[18px] border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(245,242,255,0.92)" }}
        >
          Ultimo safe align registrato: {new Date(lastSafeAlign.applied_at).toLocaleString("it-IT")} ·{" "}
          {lastSafeAlign.aligned_fields.join(", ")}
        </div>
      ) : null}

      <div
        className="mt-6 rounded-[22px] border px-4 py-4 text-sm"
        style={
          safeAlignEligibility.eligible
            ? getToneStyles("pass")
            : getToneStyles("warning")
        }
      >
        <p className="font-semibold">{safeAlignEligibility.label}</p>
        <p className="mt-2 leading-7" style={{ color: "var(--muted-strong)" }}>
          {safeAlignEligibility.description}
        </p>

        {safeAlignEligibility.eligible && canSafeAlign && collectionId && returnTo ? (
          <form action={applyCollectionSafeAlignAction} className="mt-4">
            <input type="hidden" name="slug" value={preview.slug} />
            <input type="hidden" name="collection_id" value={collectionId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button
              type="submit"
              className="button-shell button-primary rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
              Apply safe align
            </button>
          </form>
        ) : safeAlignEligibility.eligible ? (
          <p className="mt-4" style={{ color: "var(--muted)" }}>
            {safeAlignMessage ??
              "Safe align non disponibile in questa istanza: serve write path e audit persistente attivi."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
