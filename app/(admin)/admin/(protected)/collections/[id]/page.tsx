import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Image from "next/image";
import Link from "@/components/ui/app-link";
import { notFound } from "next/navigation";

import { updateCollectionFormAction } from "@/app/(admin)/admin/actions/collections";
import { CollectionSyncPreviewPanel } from "@/components/admin/collection-sync-preview-panel";
import { CollectionTransitionCard } from "@/components/admin/collection-transition-card";
import { CollectionForm } from "@/components/admin/collection-form";
import { ControlCenterHeader, ControlCenterNotice } from "@/components/admin/control-center-header";
import { getCollectionFormValues } from "@/lib/admin/collection-form";
import {
  getAdminCollectionById,
  getAdminCollectionsRuntime,
} from "@/lib/admin/collection-queries";
import { getAdminTools } from "@/lib/admin/tool-queries";
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
import { formatItalianDate } from "@/lib/utils";

type AdminCollectionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; fields?: string }>;
};

const statusMessages: Record<string, string> = {
  created: "Raccolta creata correttamente.",
  updated: "Raccolta aggiornata correttamente.",
  "review-saved": "Revisione aggiornata correttamente.",
  "review-cleared": "Revisione ripulita correttamente.",
  "review-unavailable":
    "Revisione non disponibile: completa la configurazione delle raccolte per salvarla.",
  "review-invalid": "Azione di revisione non valida.",
  "safe-align-unavailable":
    "Riallineamento sicuro non disponibile: abilita salvataggio e registro modifiche prima di applicarlo.",
  "safe-align-ineligible":
    "Questo caso non rientra nelle regole di riallineamento automatico e resta solo in anteprima.",
  "safe-align-invalid": "Azione di riallineamento non valida.",
  "safe-align-failed":
    "Riallineamento non completato: l'azione è stata fermata prima di lasciare uno stato ambiguo.",
};

export default async function AdminCollectionDetailPage({
  params,
  searchParams,
}: AdminCollectionDetailPageProps) {
  const [{ id }, { status, fields }, runtime, tools] = await Promise.all([
    params,
    searchParams,
    getAdminCollectionsRuntime(),
    getAdminTools(),
  ]);

  const collection = await getAdminCollectionById(id);

  if (!collection) {
    notFound();
  }

  const stateMeta = getCollectionEditorialStateMeta(collection.editorial_state);
  const surfaceMeta = getCollectionSurfaceMeta(collection.surface);
  const accessMeta = getCollectionAccessMeta(collection.access);
  const toneMeta = getCollectionToneMeta(collection.tone);
  const difficultyLabel = getCollectionDifficultyLabel(collection.difficulty);
  const warnings = runtime.workspaceSnapshot.validation[collection.slug] ?? [];
  const transitionEntry =
    runtime.transitionReport.entries.find((entry) => entry.slug === collection.slug) ?? null;
  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const boundAction = updateCollectionFormAction.bind(null, collection.id);
  const isPublic =
    collection.editorial_state === "published" || collection.editorial_state === "featured";
  const readiness = runtime.readinessBySlug[collection.slug] ?? null;
  const syncPreview = runtime.syncPreviewBySlug[collection.slug] ?? null;
  const lastSafeAlign = runtime.lastSafeAlignBySlug[collection.slug] ?? null;
  const statusMessage =
    status === "safe-align-applied"
      ? `Riallineamento sicuro applicato correttamente${fields ? ` su: ${fields.replaceAll(",", ", ")}` : "."}`
      : status
        ? statusMessages[status] ?? null
        : null;
  const topActions: Array<{ href: string; label: string; primary?: boolean }> = [
    { href: "/admin/collections", label: "Torna alla lista" },
    { href: "#sync-preview", label: "Vai all'anteprima" },
  ];

  if (isPublic) {
    topActions.push({
      href: `/collections/${collection.slug}`,
      label: "Apri pagina pubblica",
      primary: true,
    });
  }

  const metrics = [
    {
      label: "Tool inclusi",
      value: String(collection.included_tools.length),
      detail: collection.included_tools.some((slot) => slot.featured)
        ? "Tool guida già impostato nella raccolta."
        : "Manca ancora un tool guida chiaro.",
    },
    {
      label: "Segnali",
      value: String(warnings.length),
      detail: warnings.length > 0 ? "Restano segnali da chiudere prima di promuoverla." : "Nessun segnale aperto sulla raccolta.",
    },
    {
      label: "Prontezza",
      value: readiness?.label ?? "Anteprima",
      detail: readiness?.summary ?? runtime.writeMessage,
    },
    {
      label: "Salvataggio",
      value: runtime.canWrite ? "Attivo" : "Sola lettura",
      detail: runtime.publicSnapshot.meta.active_source === "supabase"
        ? "Il sito pubblico legge già l'archivio principale."
        : "Il pubblico resta su una sorgente composita o locale.",
    },
  ] as const;

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <LocalizedAttributes><ControlCenterHeader
          kicker="Raccolte"
          title={collection.title}
          description="Segnali, continuità pubblica e modifica nello stesso punto."
          backHref="/admin/collections"
          backLabel="Torna alle raccolte"
          metrics={metrics.map((item) => ({ label: item.label, value: item.value }))}
        /></LocalizedAttributes>
        {statusMessage ? <ControlCenterNotice tone="ok"><LocalizedText>{statusMessage}</LocalizedText></ControlCenterNotice> : null}
        {!runtime.canWrite ? (
          <ControlCenterNotice tone="warn"><LocalizedText>{"La raccolta è leggibile, ma il salvataggio reale resta disattivato. "}</LocalizedText></ControlCenterNotice>
        ) : null}
        <div className="mb-4 flex flex-wrap gap-2">
          {topActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={action.primary ? "tv-cc-btn tv-cc-btn--primary" : "tv-cc-btn tv-cc-btn--ghost"}
            >
              <LocalizedText>{action.label}</LocalizedText>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <aside className="space-y-6">
            <section className="tv-cc-panel overflow-hidden p-0">
              <div className="relative min-h-[16rem]">
                <LocalizedAttributes><Image
                  src={collection.cover_image_url}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 34vw"
                  className="object-cover"
                /></LocalizedAttributes>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.08),rgba(18,15,35,0.72))]" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(24,17,12,0.28)" }}>
                    <LocalizedText>{stateMeta.label}</LocalizedText>
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)" }}>
                    <LocalizedText>{surfaceMeta.label}</LocalizedText>
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/64"><LocalizedText>{"Anteprima interna "}</LocalizedText></p>
                  <h2 className="mt-2 text-[2rem] leading-tight text-white"><LocalizedText>{collection.title}</LocalizedText></h2>
                  <p className="mt-3 max-w-[32rem] text-sm leading-6 text-white/78">
                    <LocalizedText>{collection.description}</LocalizedText>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {[
                  { label: "Tono", value: toneMeta.label },
                  { label: "Accesso", value: accessMeta.label },
                  { label: "Difficoltà", value: difficultyLabel },
                  { label: "Ordine", value: String(collection.editorial_order ?? 999) },
                  {
                    label: "Spazio in evidenza",
                    value: collection.featured_slot
                      ? getCollectionFeaturedSlotLabel(collection.featured_slot)
                      : "nessuno",
                  },
                  { label: "Aggiornata", value: formatItalianDate(collection.updated_at) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="tv-cc-panel"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" >
                      <LocalizedText>{item.label}</LocalizedText>
                    </p>
                    <p className="mt-2 text-sm" >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="tv-cc-panel">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" ><LocalizedText>{"Segnali e controlli "}</LocalizedText></p>
              <div className="mt-4 grid gap-3">
                {warnings.length > 0 ? (
                  warnings.map((issue, index) => (
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
                            ? "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)"
                            : "rgba(243,191,76,0.12)",
                      }}
                    >
                      <strong><LocalizedText>{issue.level === "error" ? "Errore" : "Avviso"}</LocalizedText>:</strong><LocalizedText>{" "}</LocalizedText>
                      <LocalizedText>{issue.message}</LocalizedText>
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-[20px] border px-4 py-3 text-sm"
                    style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(57,210,246,0.12)" }}
                  ><LocalizedText>{"Nessun segnale aperto su questa raccolta. "}</LocalizedText></div>
                )}
              </div>
            </section>

            {transitionEntry ? (
              <CollectionTransitionCard
                entry={transitionEntry}
                collection={collection}
                validationIssues={warnings}
                returnTo={`/admin/collections/${collection.id}`}
                canReview={runtime.canReview}
                canImport={runtime.canWrite}
                canSafeAlign={runtime.canSafeAlign}
                safeAlignMessage={runtime.safeAlignMessage}
                collectionId={collection.id}
                compact
              />
            ) : null}

            <section className="tv-cc-panel">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" ><LocalizedText>{"Tool inclusi "}</LocalizedText></p>
              <div className="mt-4 grid gap-3">
                {collection.included_tools.map((slot, index) => {
                  const tool = toolsBySlug.get(slot.tool_slug);

                  return (
                    <div
                      key={`${collection.id}-${slot.tool_slug}-${index}`}
                      className="tv-cc-panel"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText> - {tool?.name ?? slot.tool_slug}
                        </p>
                        {slot.featured ? (
                          <span className="tv-cc-metric"><LocalizedText>{"Tool guida "}</LocalizedText></span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm" >
                        <LocalizedText>{slot.role}</LocalizedText>
                      </p>
                      {slot.note ? (
                        <p className="mt-2 text-sm leading-6" >
                          {slot.note}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="tv-cc-panel">
            {readiness ? (
              <div
                className="mb-6 rounded-[var(--radius-lg)] border px-4 py-4 text-sm"
                style={{
                  borderColor:
                    readiness.state === "blocked"
                      ? "rgba(139,58,43,0.18)"
                      : readiness.state === "review"
                        ? "rgba(161,105,47,0.18)"
                        : "rgba(15,118,110,0.18)",
                  background:
                    readiness.state === "blocked"
                      ? "color-mix(in srgb, var(--tv-status-danger) 16%, transparent)"
                      : readiness.state === "review"
                        ? "rgba(243,191,76,0.12)"
                        : "rgba(57,210,246,0.12)",
                }}
              >
                <strong><LocalizedText>{readiness.label}</LocalizedText>:</strong> <LocalizedText>{readiness.summary}</LocalizedText>
              </div>
            ) : null}
            <div id="sync-preview" className="mb-6">
              <CollectionSyncPreviewPanel
                preview={syncPreview}
                entry={transitionEntry}
                readiness={readiness}
                canSafeAlign={runtime.canSafeAlign}
                safeAlignMessage={runtime.safeAlignMessage}
                collectionId={collection.id}
                returnTo={`/admin/collections/${collection.id}`}
                lastSafeAlign={lastSafeAlign}
              />
            </div>
            <CollectionForm
        entityTitle={collection.title}
        entityStatus={collection.editorial_state}
        backHref="/admin/collections"
              action={boundAction}
              initialValues={getCollectionFormValues(collection)}
              submitLabel="Salva raccolta"
              disabled={!runtime.canWrite}
              availableTools={tools.map((tool) => ({
                slug: tool.slug,
                name: tool.name,
                category: tool.category,
                is_published: tool.is_published,
              }))}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
