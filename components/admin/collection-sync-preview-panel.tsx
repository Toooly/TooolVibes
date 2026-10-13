import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { applyCollectionSafeAlignAction } from "@/app/(admin)/admin/actions/collections";
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
        background: "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)",
      };
    case "warning":
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "var(--tv-status-warning-soft-bg-dark)",
      };
    case "pass":
    default:
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "var(--tv-status-success-soft-bg-dark)",
      };
  }
}

function getRiskStyles(risk: CollectionSyncPreview["risk"]) {
  switch (risk) {
    case "high":
      return {
        borderColor: "rgba(139,58,43,0.18)",
        background: "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)",
      };
    case "medium":
      return {
        borderColor: "rgba(161,105,47,0.18)",
        background: "var(--tv-status-warning-soft-bg-dark)",
      };
    case "low":
    default:
      return {
        borderColor: "rgba(15,118,110,0.18)",
        background: "var(--tv-status-success-soft-bg-dark)",
      };
  }
}

function getChangeStyles(kind: "safe" | "editorial") {
  return kind === "safe"
    ? {
        borderColor: "rgba(15,118,110,0.18)",
        background: "var(--tv-status-success-soft-bg-dark)",
      }
    : {
        borderColor: "rgba(161,105,47,0.18)",
        background: "var(--tv-status-warning-soft-bg-dark)",
      };
}

function getSourceLabel(source: string | null | undefined) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "mock":
      return "Sorgente locale";
    case "content":
      return "Contenuto editoriale";
    default:
      return "n/d";
  }
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
        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
      >
        <div className="space-y-2">
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--muted)" }}
          ><LocalizedText>{"Anteprima riallineamento "}</LocalizedText></p>
          <h3 className="text-xl"><LocalizedText>{"Nessun riallineamento proposto."}</LocalizedText></h3>
          <p className="text-sm leading-7" style={{ color: "var(--muted)" }}><LocalizedText>{"Su questa raccolta non c'è un confronto tra sorgente locale e archivio reale abbastanza definito da trasformarsi in anteprima. O è già allineata, oppure manca uno dei due lati del confronto. "}</LocalizedText></p>
        </div>
        {lastSafeAlign ? (
          <div
            className="mt-5 rounded-[18px] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(106,60,255,0.14)" }}
          ><LocalizedText>{"Ultimo riallineamento registrato: "}</LocalizedText><LocalizedText>{new Date(lastSafeAlign.applied_at).toLocaleString("it-IT")}</LocalizedText> -<LocalizedText>{" "}</LocalizedText>
            <LocalizedText>{lastSafeAlign.aligned_fields.join(", ")}</LocalizedText>
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
    <section className="tv-cc-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="tv-cc-panel__kicker"><LocalizedText>{"Anteprima riallineamento"}</LocalizedText></p>
          <h2 className="tv-cc-panel__title"><LocalizedText>{compact ? "Anteprima del riallineamento" : "Cosa cambierebbe prima di toccare la sorgente reale"}</LocalizedText></h2>
          <p className="tv-cc-panel__desc"><LocalizedText>{"Pannello descrittivo: distingue i cambi prudenti da quelli che restano una decisione editoriale."}</LocalizedText></p>
        </div>
        {detailHref ? (
          <Link
            href={detailHref}
            className="tv-cc-btn tv-cc-btn--secondary rounded-full px-4 py-2 text-sm font-semibold"
          ><LocalizedText>{"Vedi anteprima "}</LocalizedText></Link>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={postureStyles}
        >
          <LocalizedText>{posture.label}</LocalizedText>
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={riskStyles}
        >
          <LocalizedText>{riskMeta.label}</LocalizedText>
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: "rgba(112,82,255,0.16)",
            background: "rgba(106,60,255,0.14)",
          }}
        ><LocalizedText>{"Sorgente pubblica -> "}</LocalizedText><LocalizedText>{getSourceLabel(preview.public_winner)}</LocalizedText>
        </span>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
        ><LocalizedText>{"Destinazione -> "}</LocalizedText><LocalizedText>{getSourceLabel(preview.target)}</LocalizedText>
        </span>
      </div>

      <div
        className="mt-5 rounded-[22px] border px-4 py-4 text-sm"
        style={postureStyles}
      >
        <p className="font-semibold"><LocalizedText>{previewMeta.label}</LocalizedText></p>
        <p className="mt-2 leading-7"><LocalizedText>{preview.summary}</LocalizedText></p>
        <p className="mt-2 leading-7" style={{ color: "var(--muted-strong)" }}>
          <LocalizedText>{previewMeta.description}</LocalizedText> <LocalizedText>{riskMeta.description}</LocalizedText> <LocalizedText>{posture.description}</LocalizedText>
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Modifiche sicure", value: preview.safe_change_count },
          { label: "Modifiche editoriali", value: preview.editorial_change_count },
          {
            label: "Stato anteprima",
            value: preview.can_safe_align_fields ? "anteprima pronta" : "solo anteprima",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[20px] border px-4 py-4"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--muted)" }}
            >
              <LocalizedText>{item.label}</LocalizedText>
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
          ><LocalizedText>{"Campi che cambierebbero "}</LocalizedText></p>
          <div className="grid gap-3">
            {preview.field_changes.map((change) => (
              <article
                key={`${preview.slug}-${change.key}`}
                className="rounded-[22px] border p-4"
                style={getChangeStyles(change.kind)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold"><LocalizedText>{change.label}</LocalizedText></p>
                  <span className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]" style={getChangeStyles(change.kind)}>
                    <LocalizedText>{change.kind === "safe" ? "candidato al riallineamento" : "richiede decisione"}</LocalizedText>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                  <LocalizedText>{change.summary}</LocalizedText>
                </p>
                {!compact ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {[
                      { label: "Archivio attuale", value: change.current_value },
                      { label: "Sorgente locale", value: change.legacy_value },
                      { label: "Valore proposto", value: change.target_value },
                    ].map((field) => (
                      <div
                        key={`${change.key}-${field.label}`}
                        className="rounded-[18px] border px-3 py-3"
                        style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--muted)" }}
                        >
                          <LocalizedText>{field.label}</LocalizedText>
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
          ><LocalizedText>{"Spazi tool che cambierebbero "}</LocalizedText></p>
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
                      ? "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)"
                      : "rgba(243,191,76,0.12)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    <LocalizedText>{change.label}</LocalizedText>: <LocalizedText>{change.tool_slug}</LocalizedText>
                  </p>
                  <span
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{
                      borderColor:
                        change.risk === "high"
                          ? "rgba(139,58,43,0.18)"
                          : "rgba(161,105,47,0.18)",
                      background:
                        change.risk === "high"
                          ? "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)"
                          : "rgba(243,191,76,0.12)",
                    }}
                  >
                    <LocalizedText>{change.risk === "high" ? "impatto alto" : "da rivedere"}</LocalizedText>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                  <LocalizedText>{change.summary}</LocalizedText>
                </p>
                {!compact ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {[
                      { label: "Archivio attuale", value: change.current_value },
                      { label: "Sorgente locale", value: change.legacy_value },
                    ].map((field) => (
                      <div
                        key={`${change.tool_slug}-${field.label}`}
                        className="rounded-[18px] border px-3 py-3"
                        style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.56)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--muted)" }}
                        >
                          <LocalizedText>{field.label}</LocalizedText>
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
              style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(106,60,255,0.14)" }}
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}

      {lastSafeAlign ? (
        <div
          className="mt-6 rounded-[18px] border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(106,60,255,0.14)" }}
        ><LocalizedText>{"Ultimo riallineamento registrato: "}</LocalizedText><LocalizedText>{new Date(lastSafeAlign.applied_at).toLocaleString("it-IT")}</LocalizedText> -<LocalizedText>{" "}</LocalizedText>
          <LocalizedText>{lastSafeAlign.aligned_fields.join(", ")}</LocalizedText>
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
        <p className="font-semibold"><LocalizedText>{safeAlignEligibility.label}</LocalizedText></p>
        <p className="mt-2 leading-7" style={{ color: "var(--muted-strong)" }}>
          <LocalizedText>{safeAlignEligibility.description}</LocalizedText>
        </p>

        {safeAlignEligibility.eligible && canSafeAlign && collectionId && returnTo ? (
          <form action={applyCollectionSafeAlignAction} className="mt-4">
            <input type="hidden" name="slug" value={preview.slug} />
            <input type="hidden" name="collection_id" value={collectionId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button
              type="submit"
              className="tv-cc-btn tv-cc-btn--primary rounded-full px-4 py-2 text-sm font-semibold text-white"
            ><LocalizedText>{"Applica riallineamento sicuro "}</LocalizedText></button>
          </form>
        ) : safeAlignEligibility.eligible ? (
          <p className="mt-4" style={{ color: "var(--muted)" }}>
            <LocalizedText>{safeAlignMessage ??
              "Riallineamento sicuro non disponibile in questa istanza: servono salvataggio e registro modifiche attivi."}</LocalizedText>
          </p>
        ) : null}
      </div>
    </section>
  );
}
