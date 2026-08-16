import Link from "next/link";

import { importMockCollectionsAction } from "@/app/(admin)/admin/actions/collections";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import {
  getCollectionTransitionReviewMeta,
  getCollectionTransitionReviewState,
  getCollectionTransitionSeverity,
  getCollectionTransitionSeverityMeta,
} from "@/lib/admin/collection-review";
import {
  getCollectionSyncPreviewMeta,
  getCollectionSyncPreviewPosture,
} from "@/lib/admin/collection-sync-preview";
import {
  getCollectionEditorialStateMeta,
  getCollectionFeaturedSlotLabel,
  getCollectionSurfaceMeta,
} from "@/lib/collections/editorial";
import {
  getCollectionAccessMeta,
  getCollectionDifficultyLabel,
  getCollectionToneMeta,
} from "@/lib/collections/helpers";
import {
  getAdminCollectionsRuntime,
  getCollectionStateCounts,
} from "@/lib/admin/collection-queries";
import { formatItalianDate } from "@/lib/utils";
import type {
  CollectionEditorialState,
  CollectionTransitionEntry,
} from "@/lib/types/collection";

type AdminCollectionsPageProps = {
  searchParams: Promise<{
    state?: string;
    view?: string;
    status?: string;
    imported?: string;
    skipped?: string;
    conflicts?: string;
    scope?: string;
    fields?: string;
  }>;
};

const statusMessages: Record<string, string> = {
  created: "Raccolta creata correttamente.",
  updated: "Raccolta aggiornata correttamente.",
  "import-unavailable":
    "Importazione non disponibile: attiva il salvataggio prima di importare le raccolte locali.",
  "review-saved": "Revisione aggiornata correttamente.",
  "review-cleared": "Revisione ripulita correttamente.",
  "review-unavailable":
    "Revisione non disponibile: completa la configurazione delle raccolte per salvarla.",
  "review-invalid": "Azione di revisione non valida.",
  "safe-align-unavailable":
    "Riallineamento sicuro non disponibile: abilita salvataggio e registro modifiche prima di usarlo.",
  "safe-align-ineligible":
    "Questo caso esce dalle regole di riallineamento automatico e resta solo in anteprima.",
  "safe-align-invalid": "Azione di riallineamento non valida.",
  "safe-align-failed":
    "Riallineamento non completato: l'azione è stata fermata prima di lasciare uno stato ambiguo.",
};

function getSourceLabel(source: string | null | undefined) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "mock":
      return "Sorgente locale";
    case "content":
      return "Contenuto editoriale";
    case "snapshot":
      return "Snapshot locale";
    default:
      return "Non disponibile";
  }
}

function getWriteTargetLabel(target: string | null | undefined) {
  return target === "supabase" ? "Archivio principale" : "Sola lettura";
}

const importStatusMeta: Record<
  CollectionTransitionEntry["import_status"],
  { label: string; background: string; borderColor: string }
> = {
  "pending-import": {
    label: "Da importare",
    background: "rgba(243,191,76,0.12)",
    borderColor: "rgba(161,105,47,0.18)",
  },
  imported: {
    label: "Importata",
    background: "rgba(57,210,246,0.12)",
    borderColor: "rgba(15,118,110,0.18)",
  },
  conflict: {
    label: "Conflitto",
    background: "rgba(254,242,242,0.96)",
    borderColor: "rgba(139,58,43,0.18)",
  },
  "remote-only": {
    label: "Solo archivio reale",
    background: "rgba(106,60,255,0.14)",
    borderColor: "rgba(112,82,255,0.16)",
  },
  "content-only": {
    label: "Solo contenuto",
    background: "rgba(243,244,246,0.95)",
    borderColor: "rgba(148,163,184,0.22)",
  },
};

function getStatusMessage({
  status,
  imported,
  skipped,
  conflicts,
  scope,
  fields,
}: {
  status?: string;
  imported?: string;
  skipped?: string;
  conflicts?: string;
  scope?: string;
  fields?: string;
}) {
  if (status === "imported") {
    const importedCount = Number(imported ?? "0");
    const skippedCount = Number(skipped ?? "0");
    const conflictCount = Number(conflicts ?? "0");

    return scope === "single"
      ? `Import completato. Importate: ${importedCount}, saltate: ${skippedCount}, conflitti: ${conflictCount}.`
      : `Importazione dalla sorgente locale completata. Importate: ${importedCount}, saltate: ${skippedCount}, conflitti: ${conflictCount}.`;
  }

  if (status === "safe-align-applied") {
    return `Riallineamento sicuro applicato correttamente${fields ? ` su: ${fields.replaceAll(",", ", ")}` : "."}`;
  }

  return status ? statusMessages[status] ?? null : null;
}

function getTransitionDiffSummary(entry: CollectionTransitionEntry) {
  const summaries: string[] = [];

  if (entry.diff.editorial_state) {
    summaries.push("stato");
  }

  if (entry.diff.editorial_order) {
    summaries.push("ordine");
  }

  if (entry.diff.featured_slot) {
    summaries.push("slot");
  }

  if (entry.diff.surface) {
    summaries.push("formato");
  }

  if (entry.diff.metadata) {
    summaries.push("contenuti");
  }

  if (entry.diff.included_tools) {
    summaries.push("tool");
  }

  return summaries;
}

export default async function AdminCollectionsPage({
  searchParams,
}: AdminCollectionsPageProps) {
  const [params, runtime] = await Promise.all([
    searchParams,
    getAdminCollectionsRuntime(),
  ]);
  const { state, view } = params;
  const statusMessage = getStatusMessage(params);

  const stateCounts = getCollectionStateCounts(runtime.collections);
  const selectedState =
    state && ["draft", "scheduled", "published", "featured", "archived"].includes(state)
      ? (state as CollectionEditorialState)
      : null;
  const hasPendingImports = runtime.transitionReport.summary.pending_import > 0;
  const selectedView =
    view && ["all", "ready", "review", "blocked", "conflict", "clean", "alignable"].includes(view)
      ? view
      : "all";
  const transitionEntriesBySlug = new Map(
    runtime.transitionReport.entries.map((entry) => [entry.slug, entry] as const),
  );
  const topActions = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/collections/new", label: "Nuova raccolta", primary: true },
    { href: "/admin/collections/review", label: "Revisione conflitti" },
  ] as const;
  const workspaceMetrics = [
    { label: "Raccolte nell'area", value: runtime.collections.length },
    {
      label: "Raccolte pubbliche",
      value: stateCounts.published + stateCounts.featured,
    },
    {
      label: "Segnali aperti",
      value: runtime.collections.filter(
        (collection) =>
          (runtime.workspaceSnapshot.validation[collection.slug] ?? []).length > 0,
      ).length,
    },
    { label: "Sorgente pubblica attiva", value: getSourceLabel(runtime.publicSnapshot.meta.active_source) },
  ] as const;
  const transitionMetrics = [
    { label: "Raccolte locali", value: runtime.transitionReport.summary.mock_total },
    { label: "Già importate", value: runtime.transitionReport.summary.imported },
    { label: "Da importare", value: runtime.transitionReport.summary.pending_import },
    { label: "Conflitti", value: runtime.transitionReport.summary.conflicts },
    { label: "Solo archivio reale", value: runtime.transitionReport.summary.remote_only },
  ] as const;
  const collectionViewCounts = {
    all: runtime.collections.length,
    ready: runtime.collections.filter(
      (collection) => runtime.readinessBySlug[collection.slug]?.state === "ready",
    ).length,
    review: runtime.collections.filter(
      (collection) => runtime.readinessBySlug[collection.slug]?.state === "review",
    ).length,
    blocked: runtime.collections.filter(
      (collection) => runtime.readinessBySlug[collection.slug]?.state === "blocked",
    ).length,
    conflict: runtime.collections.filter((collection) => {
      const transitionEntry = transitionEntriesBySlug.get(collection.slug) ?? null;
      const severity = transitionEntry
        ? getCollectionTransitionSeverity(transitionEntry)
        : "clean";

      return severity === "critical-conflict" || severity === "minor-drift";
    }).length,
    alignable: runtime.collections.filter(
      (collection) =>
        runtime.syncPreviewBySlug[collection.slug]?.state === "safe-align-ready",
    ).length,
    clean: runtime.collections.filter((collection) => {
      const transitionEntry = transitionEntriesBySlug.get(collection.slug) ?? null;

      return (transitionEntry
        ? getCollectionTransitionSeverity(transitionEntry)
        : "clean") === "clean";
    }).length,
  } as const;
  const collectionViewOptions = [
    {
      href: "/admin/collections",
      label: "Area raccolte",
      active: selectedView === "all",
      count: collectionViewCounts.all,
    },
    {
      href: "/admin/collections?view=ready",
      label: "Pronte",
      active: selectedView === "ready",
      count: collectionViewCounts.ready,
    },
    {
      href: "/admin/collections?view=review",
      label: "Da rivedere",
      active: selectedView === "review",
      count: collectionViewCounts.review,
    },
    {
      href: "/admin/collections?view=blocked",
      label: "Bloccate",
      active: selectedView === "blocked",
      count: collectionViewCounts.blocked,
    },
    {
      href: "/admin/collections?view=conflict",
      label: "Conflitti",
      active: selectedView === "conflict",
      count: collectionViewCounts.conflict,
    },
    {
      href: "/admin/collections?view=alignable",
      label: "Riallineabili",
      active: selectedView === "alignable",
      count: collectionViewCounts.alignable,
    },
    {
      href: "/admin/collections?view=clean",
      label: "Pulite",
      active: selectedView === "clean",
      count: collectionViewCounts.clean,
    },
  ] as const;
  const editorialStateOptions = [
    {
      href: "/admin/collections",
      label: "Tutte",
      active: !selectedState,
      count: runtime.collections.length,
    },
    ...(
      ["draft", "scheduled", "published", "featured", "archived"] as CollectionEditorialState[]
    ).map((item) => ({
      href: `/admin/collections?state=${item}`,
      label: getCollectionEditorialStateMeta(item).label,
      active: selectedState === item,
      count: stateCounts[item],
    })),
  ];

  const filteredCollections = runtime.collections.filter((collection) => {
    const transitionEntry = transitionEntriesBySlug.get(collection.slug) ?? null;
    const readiness = runtime.readinessBySlug[collection.slug] ?? null;
    const severity = transitionEntry ? getCollectionTransitionSeverity(transitionEntry) : "clean";
    const syncPreview = runtime.syncPreviewBySlug[collection.slug] ?? null;

    if (selectedState && collection.editorial_state !== selectedState) {
      return false;
    }

    if (selectedView === "ready") {
      return readiness?.state === "ready";
    }

    if (selectedView === "review") {
      return readiness?.state === "review";
    }

    if (selectedView === "blocked") {
      return readiness?.state === "blocked";
    }

    if (selectedView === "conflict") {
      return severity === "critical-conflict" || severity === "minor-drift";
    }

    if (selectedView === "clean") {
      return severity === "clean";
    }

    if (selectedView === "alignable") {
      return syncPreview?.state === "safe-align-ready";
    }

    return true;
  });

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeader invert
              eyebrow="Gestione raccolte"
              title="Un flusso editoriale leggero e operativo."
              description="Qui leggi sorgente, segnali aperti, stato editoriale e dettaglio interno delle raccolte. La scrittura resta prudente, ma il pannello gestisce già il ciclo editoriale essenziale senza passare dal codice."
            />
            <div className="hidden flex-wrap gap-3 sm:flex">
              {topActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`button-shell ${"primary" in action && action.primary ? "button-primary text-white" : "button-secondary text-[#f4f1ff]"} rounded-full px-4 py-2.5 text-sm font-semibold`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="tool-rail -mx-1 mt-5 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
            {topActions.map((action) => (
              <Link
                key={`mobile-${action.href}`}
                href={action.href}
                className={`button-shell ${"primary" in action && action.primary ? "button-primary text-white" : "button-secondary text-[#f4f1ff]"} inline-flex shrink-0 rounded-full px-4 py-2 text-[0.78rem] font-semibold`}
              >
                {action.label}
              </Link>
            ))}
          </div>

          {statusMessage ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(57,210,246,0.12)" }}
            >
              {statusMessage}
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-8 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {workspaceMetrics.map((item) => (
              <article
                key={item.label}
                className="admin-stat-tile stat-block w-[12rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-5"
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

          <div className="mt-8 hidden gap-4 sm:grid lg:grid-cols-4">
            {workspaceMetrics.map((item) => (
              <article
                key={`desktop-${item.label}`}
                className="admin-stat-tile stat-block rounded-[var(--radius-lg)] border p-5"
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

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div
              className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{
                borderColor: runtime.canWrite
                  ? "rgba(15,118,110,0.18)"
                  : "rgba(161,105,47,0.18)",
                background: runtime.canWrite
                  ? "rgba(57,210,246,0.10)"
                  : "rgba(243,191,76,0.12)",
              }}
            >
              {runtime.writeMessage}
            </div>
            <div
              className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{
                borderColor: "rgba(112,82,255,0.14)",
                background: "rgba(106,60,255,0.14)",
              }}
            >
              Lettura interna: <strong>{getSourceLabel(runtime.adminReadSource)}</strong>. Sorgente pubblica:{" "}
              <strong>{getSourceLabel(runtime.publicSnapshot.meta.active_source)}</strong>.
              {runtime.writeTarget ? (
                <>
                  {" "}
                  Destinazione salvataggio: <strong>{getWriteTargetLabel(runtime.writeTarget)}</strong>.
                </>
              ) : null}
              <br />
              {runtime.reviewMessage}
              <br />
              {runtime.safeAlignMessage}
            </div>
          </div>

          <div
            className="mt-6 rounded-[var(--radius-xl)] border p-5 sm:p-6"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[44rem] space-y-2">
                <p
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--muted)" }}
                >
                  Transizione sorgenti
                </p>
                <h2 className="text-2xl">Dalla sorgente locale all’archivio reale senza stacchi nel pubblico.</h2>
                <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                  In automatico, il pubblico sceglie la sorgente con questa priorità:{" "}
                  <strong>
                    {(runtime.publicSnapshot.meta.source_precedence ??
                      runtime.transitionReport.source_precedence
                    )
                      .map(getSourceLabel)
                      .join(" > ")}
                  </strong>
                  . Se una raccolta esiste già nell’archivio reale, quella versione prevale; le raccolte non ancora
                  importate restano servite dalla sorgente locale o dai contenuti statici.
                </p>
              </div>
              {runtime.canWrite ? (
                <form action={importMockCollectionsAction}>
                  <button
                    type="submit"
                    disabled={!hasPendingImports}
                    className="button-shell button-primary rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Importa raccolte locali mancanti ({runtime.transitionReport.summary.pending_import})
                  </button>
                </form>
              ) : (
                <div
                  className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(161,105,47,0.18)",
                    background: "rgba(243,191,76,0.12)",
                  }}
                >
                  Attiva il salvataggio per importare dal pannello interno.
                </div>
              )}
            </div>

            <div className="tool-rail -mx-1.5 mt-6 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
              {transitionMetrics.map((item) => (
                <article
                  key={item.label}
                  className="stat-block w-[10.5rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-4"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--muted)" }}
                  >
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl">{item.value}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 hidden gap-4 sm:grid lg:grid-cols-5">
              {transitionMetrics.map((item) => (
                <article
                  key={`desktop-${item.label}`}
                  className="stat-block rounded-[var(--radius-lg)] border p-4"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--muted)" }}
                  >
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl">{item.value}</p>
                </article>
              ))}
            </div>
          </div>

          {runtime.publicSnapshot.meta.warnings.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {runtime.publicSnapshot.meta.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(243,191,76,0.12)" }}
                >
                  {warning}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
            <div className="space-y-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--muted)" }}
              >
                Stato importazione
              </p>
              <h2 className="text-2xl">Stato importazione delle raccolte</h2>
              <p className="max-w-[44rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
                Questa vista mostra quali raccolte sono ancora nella sorgente locale, quali sono
                già state importate e dove esistono differenze con l’archivio reale.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {runtime.transitionReport.entries.map((entry) => {
              const statusMeta = importStatusMeta[entry.import_status];
              const diffSummary = getTransitionDiffSummary(entry);

              return (
                <article
                  key={entry.slug}
                  className="admin-stat-tile grid gap-4 rounded-[var(--radius-lg)] border p-5 lg:grid-cols-[1.35fr_1fr_auto]"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl">{entry.title}</h3>
                      <span
                        className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                        style={{
                          borderColor: statusMeta.borderColor,
                          background: statusMeta.background,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      {entry.public_source ? (
                        <span
                          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{
                            borderColor: "rgba(112,82,255,0.16)",
                            background: "rgba(106,60,255,0.14)",
                          }}
                        >
                          Pubblico -&gt; {getSourceLabel(entry.public_source)}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>Slug: {entry.slug}</span>
                      <span>Locale: {entry.mock ? "sì" : "no"}</span>
                      <span>Archivio reale: {entry.supabase ? "sì" : "no"}</span>
                      <span>Contenuto: {entry.content ? "sì" : "no"}</span>
                    </div>

                    {diffSummary.length > 0 ? (
                      <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
                        Drift rilevato su: {diffSummary.join(", ")}.
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
                        Nessuna differenza rilevata sui campi chiave.
                      </p>
                    )}

                    {entry.warnings.length > 0 ? (
                      <div className="grid gap-2">
                        {entry.warnings.slice(0, 2).map((warning) => (
                          <div
                            key={`${entry.slug}-${warning}`}
                            className="rounded-[20px] border px-4 py-3 text-sm"
                            style={{
                              borderColor:
                                entry.import_status === "conflict"
                                  ? "rgba(139,58,43,0.18)"
                                  : "rgba(161,105,47,0.18)",
                              background:
                                entry.import_status === "conflict"
                                  ? "rgba(254,242,242,0.96)"
                                  : "rgba(243,191,76,0.12)",
                            }}
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {[
                      { label: "Stato", value: entry.supabase?.editorial_state ?? entry.mock?.editorial_state ?? "n/d" },
                      {
                        label: "Ordine",
                        value: String(
                          entry.supabase?.editorial_order ??
                            entry.mock?.editorial_order ??
                            999,
                        ),
                      },
                      {
                        label: "Spazio",
                        value:
                          entry.supabase?.featured_slot ??
                          entry.mock?.featured_slot ??
                          "nessuno",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[22px] border px-4 py-3"
                        style={{
                          borderColor: "var(--line)",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    {entry.supabase ? (
                      <Link
                        href={`/admin/collections/${entry.supabase.id}`}
                        className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
                      >
                        Apri raccolta
                      </Link>
                    ) : null}
                    {runtime.canWrite && entry.import_status === "pending-import" ? (
                      <form action={importMockCollectionsAction}>
                        <input type="hidden" name="slug" value={entry.slug} />
                        <button
                          type="submit"
                          className="button-shell button-primary w-full rounded-full px-4 py-2 text-sm font-semibold text-white"
                        >
                          Importa raccolta
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="border-b pb-5">
            <p className="editorial-label">Viste raccolte</p>
            <div className="tool-rail -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {collectionViewOptions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="selection-chip text-ui-strong inline-flex shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: item.active ? "rgba(112,82,255,0.24)" : "var(--line)",
                    background: item.active
                      ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,237,255,0.92))"
                      : "rgba(255,255,255,0.06)",
                    color: item.active ? "var(--accent-strong)" : "var(--muted-strong)",
                  }}
                >
                  {item.label} ({item.count})
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 border-b pb-5">
            <p className="editorial-label">Filtri per stato</p>
            <div className="tool-rail -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {editorialStateOptions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="selection-chip text-ui-strong inline-flex shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: item.active ? "rgba(112,82,255,0.24)" : "var(--line)",
                  background: item.active
                    ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,237,255,0.92))"
                    : "rgba(255,255,255,0.06)",
                  color: item.active ? "var(--accent-strong)" : "var(--muted-strong)",
                }}
              >
                {item.label} ({item.count})
              </Link>
            ))}
          </div>
          </div>

          <div className="mt-6">
            {filteredCollections.length > 0 ? (
              <div className="space-y-4">
                {filteredCollections.map((collection) => {
                  const stateMeta = getCollectionEditorialStateMeta(collection.editorial_state);
                  const surfaceMeta = getCollectionSurfaceMeta(collection.surface);
                  const accessMeta = getCollectionAccessMeta(collection.access);
                  const toneMeta = getCollectionToneMeta(collection.tone);
                  const difficultyLabel = getCollectionDifficultyLabel(collection.difficulty);
                  const issues = runtime.workspaceSnapshot.validation[collection.slug] ?? [];
                  const transitionEntry = transitionEntriesBySlug.get(collection.slug) ?? null;
                  const readiness = runtime.readinessBySlug[collection.slug] ?? null;
                  const transitionSeverity = transitionEntry
                    ? getCollectionTransitionSeverity(transitionEntry)
                    : "clean";
                  const transitionSeverityMeta =
                    transitionEntry &&
                    getCollectionTransitionSeverityMeta(transitionSeverity);
                  const reviewMeta =
                    transitionEntry &&
                    getCollectionTransitionReviewMeta(
                        getCollectionTransitionReviewState(transitionEntry),
                      );
                  const syncPreview = runtime.syncPreviewBySlug[collection.slug] ?? null;
                  const syncPreviewMeta =
                    syncPreview && getCollectionSyncPreviewMeta(syncPreview.state);
                  const syncPreviewPosture = getCollectionSyncPreviewPosture({
                    preview: syncPreview,
                    readiness,
                    entry: transitionEntry,
                  });
                  const lastSafeAlign = runtime.lastSafeAlignBySlug[collection.slug] ?? null;

                  return (
                    <article
                      key={collection.id}
                      className="admin-stat-tile grid gap-5 rounded-[var(--radius-lg)] border p-5 lg:grid-cols-[1.4fr_1fr_auto]"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl">{collection.title}</h2>
                          <span
                            className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                          >
                            {stateMeta.label}
                          </span>
                          <span
                            className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                          >
                            {surfaceMeta.label}
                          </span>
                          {readiness ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{
                                borderColor:
                                  readiness.state === "blocked"
                                    ? "rgba(139,58,43,0.18)"
                                    : readiness.state === "review"
                                      ? "rgba(161,105,47,0.18)"
                                      : "rgba(15,118,110,0.18)",
                                background:
                                  readiness.state === "blocked"
                                    ? "rgba(254,242,242,0.96)"
                                    : readiness.state === "review"
                                      ? "rgba(243,191,76,0.12)"
                                      : "rgba(57,210,246,0.12)",
                              }}
                            >
                              {readiness.label}
                            </span>
                          ) : null}
                          {transitionSeverityMeta ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{
                                borderColor:
                                  transitionSeverity === "critical-conflict"
                                    ? "rgba(139,58,43,0.18)"
                                    : transitionSeverity === "minor-drift" ||
                                        transitionSeverity === "pending"
                                      ? "rgba(161,105,47,0.18)"
                                      : "rgba(15,118,110,0.18)",
                                background:
                                  transitionSeverity === "critical-conflict"
                                    ? "rgba(254,242,242,0.96)"
                                    : transitionSeverity === "minor-drift" ||
                                        transitionSeverity === "pending"
                                      ? "rgba(243,191,76,0.12)"
                                      : "rgba(57,210,246,0.12)",
                              }}
                            >
                              {transitionSeverityMeta.label}
                            </span>
                          ) : null}
                          {reviewMeta ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{
                                borderColor:
                                  reviewMeta.label === "Reviewed"
                                    ? "rgba(15,118,110,0.18)"
                                    : reviewMeta.label === "Dismissed"
                                      ? "rgba(112,82,255,0.16)"
                                      : "rgba(161,105,47,0.18)",
                                background:
                                  reviewMeta.label === "Reviewed"
                                    ? "rgba(57,210,246,0.12)"
                                    : reviewMeta.label === "Dismissed"
                                      ? "rgba(106,60,255,0.14)"
                                      : "rgba(243,191,76,0.12)",
                              }}
                            >
                              {reviewMeta.label}
                            </span>
                          ) : null}
                          {syncPreviewMeta ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{
                                borderColor:
                                  syncPreview?.state === "safe-align-ready"
                                    ? "rgba(15,118,110,0.18)"
                                    : "rgba(161,105,47,0.18)",
                                background:
                                  syncPreview?.state === "safe-align-ready"
                                    ? "rgba(57,210,246,0.12)"
                                    : "rgba(243,191,76,0.12)",
                              }}
                            >
                              {syncPreviewMeta.label}
                            </span>
                          ) : null}
                          {issues.length > 0 ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(243,191,76,0.12)" }}
                            >
                              {issues.length} avvisi
                            </span>
                          ) : null}
                          {lastSafeAlign ? (
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{
                                borderColor: "rgba(112,82,255,0.16)",
                                background: "rgba(106,60,255,0.14)",
                              }}
                            >
                              Riallineata
                            </span>
                          ) : null}
                        </div>

                        <p className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                          {collection.description}
                        </p>

                        {readiness ? (
                          <div
                            className="rounded-[22px] border px-4 py-3 text-sm"
                            style={{
                              borderColor:
                                readiness.state === "blocked"
                                  ? "rgba(139,58,43,0.18)"
                                  : readiness.state === "review"
                                    ? "rgba(161,105,47,0.18)"
                                    : "rgba(15,118,110,0.18)",
                              background:
                                readiness.state === "blocked"
                                  ? "rgba(254,242,242,0.96)"
                                  : readiness.state === "review"
                                    ? "rgba(243,191,76,0.12)"
                                    : "rgba(57,210,246,0.12)",
                            }}
                          >
                            {readiness.summary}
                          </div>
                        ) : null}

                        {syncPreview ? (
                          <div
                            className="rounded-[22px] border px-4 py-3 text-sm"
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
                            <strong>{syncPreviewPosture.label}:</strong> {syncPreview.summary}
                          </div>
                        ) : null}

                        {lastSafeAlign ? (
                          <div
                            className="rounded-[20px] border px-4 py-3 text-sm"
                            style={{ borderColor: "rgba(112,82,255,0.14)", background: "rgba(106,60,255,0.14)" }}
                          >
                            Ultimo riallineamento: {formatItalianDate(lastSafeAlign.applied_at)} -{" "}
                            {lastSafeAlign.aligned_fields.join(", ")}
                          </div>
                        ) : null}

                        <div
                          className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                          style={{ color: "var(--muted)" }}
                        >
                          <span>Slug: {collection.slug}</span>
                          <span>Tono: {toneMeta.label}</span>
                          <span>Accesso: {accessMeta.subtleLabel}</span>
                          <span>Difficoltà: {difficultyLabel}</span>
                          <span>Ordine: {collection.editorial_order ?? 999}</span>
                          {collection.featured_slot ? (
                            <span>Spazio: {getCollectionFeaturedSlotLabel(collection.featured_slot)}</span>
                          ) : null}
                        </div>

                        {issues.length > 0 ? (
                          <div className="grid gap-2">
                            {issues.slice(0, 3).map((issue, index) => (
                              <div
                                key={`${collection.slug}-${index}`}
                                className="rounded-[20px] border px-4 py-3 text-sm"
                                style={{
                                  borderColor:
                                    issue.level === "error"
                                      ? "rgba(139,58,43,0.18)"
                                      : "rgba(161,105,47,0.18)",
                                  background:
                                    issue.level === "error"
                                      ? "rgba(254,242,242,0.96)"
                                      : "rgba(243,191,76,0.12)",
                                }}
                              >
                                {issue.message}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {transitionSeverityMeta &&
                        transitionSeverity !== "clean" &&
                        transitionEntry ? (
                          <div
                            className="rounded-[20px] border px-4 py-3 text-sm"
                            style={{
                              borderColor:
                                transitionSeverity === "critical-conflict"
                                  ? "rgba(139,58,43,0.18)"
                                  : "rgba(161,105,47,0.18)",
                              background:
                                transitionSeverity === "critical-conflict"
                                  ? "rgba(254,242,242,0.96)"
                                  : "rgba(243,191,76,0.12)",
                            }}
                          >
                            <strong>{transitionSeverityMeta.label}:</strong>{" "}
                            {transitionSeverityMeta.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {[
                          {
                            label: "Tool inclusi",
                            value: String(collection.included_tools.length),
                          },
                          {
                            label: "Aggiornato",
                            value: formatItalianDate(collection.updated_at),
                          },
                          {
                            label: "Pubblico",
                            value:
                              collection.editorial_state === "published" ||
                              collection.editorial_state === "featured"
                                ? "Sì"
                                : "No",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[22px] border px-4 py-3"
                            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                              {item.label}
                            </p>
                            <p className="mt-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3">
                        <Link
                          href={`/admin/collections/${collection.id}`}
                          className="button-shell button-primary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold text-white"
                        >
                          Apri dettaglio
                        </Link>
                        {(collection.editorial_state === "published" ||
                          collection.editorial_state === "featured") && (
                          <Link
                            href={`/collections/${collection.slug}`}
                            className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
                          >
                            Vedi pagina pubblica
                          </Link>
                        )}
                        {transitionEntry ? (
                          <Link
                            href={
                              syncPreview?.state === "safe-align-ready"
                                ? "/admin/collections/review?view=alignable"
                                : transitionSeverity !== "clean"
                                ? "/admin/collections/review?view=conflict"
                                  : "/admin/collections/review"
                            }
                            className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-center text-sm font-semibold"
                          >
                            Apri revisione
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <AdminEmptyState
                title={
                  selectedState
                    ? `Nessuna raccolta in stato ${getCollectionEditorialStateMeta(selectedState).label}`
                    : "Nessuna raccolta disponibile"
                }
                description={
                  runtime.canWrite
                    ? "Puoi iniziare creando la prima raccolta nell'archivio editoriale."
                    : "Il pannello interno legge ancora la sorgente locale. Attiva il salvataggio per iniziare a creare e gestire raccolte da qui."
                }
                ctaHref={runtime.canWrite ? "/admin/collections/new" : undefined}
                ctaLabel={runtime.canWrite ? "Crea la prima raccolta" : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
