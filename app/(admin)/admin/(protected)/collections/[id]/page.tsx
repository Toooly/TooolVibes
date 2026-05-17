import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCollectionFormAction } from "@/app/(admin)/admin/actions";
import { CollectionSyncPreviewPanel } from "@/components/admin/collection-sync-preview-panel";
import { CollectionTransitionCard } from "@/components/admin/collection-transition-card";
import { CollectionForm } from "@/components/admin/collection-form";
import { SectionHeading } from "@/components/sections/section-heading";
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
  created: "Collection creata correttamente.",
  updated: "Collection aggiornata correttamente.",
  "review-saved": "Review state aggiornato correttamente.",
  "review-cleared": "Review state ripulito correttamente.",
  "review-unavailable":
    "Review state non disponibile: applica la migration `0012-0013` per abilitarlo in modo persistente.",
  "review-invalid": "Azione review non valida.",
  "safe-align-unavailable":
    "Safe align non disponibile: attiva write path Supabase e migration `0014-0015` prima di applicarlo.",
  "safe-align-ineligible":
    "Questo caso non rientra nella safe align policy attuale e resta preview-only.",
  "safe-align-invalid": "Azione safe align non valida.",
  "safe-align-failed":
    "Safe align non completato: l'azione è stata fermata prima di lasciare uno stato ambiguo.",
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
      ? `Safe align applicato correttamente${fields ? ` su: ${fields.replaceAll(",", ", ")}` : "."}`
      : status
        ? statusMessages[status] ?? null
        : null;
  const topActions: Array<{ href: string; label: string; primary?: boolean }> = [
    { href: "/admin/collections", label: "Torna alla lista" },
    { href: "#sync-preview", label: "Vai a sync preview" },
  ];

  if (isPublic) {
    topActions.push({
      href: `/collections/${collection.slug}`,
      label: "Apri public page",
      primary: true,
    });
  }

  const metrics = [
    {
      label: "Tool inclusi",
      value: String(collection.included_tools.length),
      detail: collection.included_tools.some((slot) => slot.featured)
        ? "Anchor già impostato nel set."
        : "Manca ancora un anchor tool chiaro.",
    },
    {
      label: "Warnings",
      value: String(warnings.length),
      detail: warnings.length > 0 ? "Restano segnali da chiudere prima di promuoverla." : "Nessun warning aperto sulla collection.",
    },
    {
      label: "Readiness",
      value: readiness?.label ?? "Snapshot",
      detail: readiness?.summary ?? runtime.writeMessage,
    },
    {
      label: "Runtime",
      value: runtime.writeTarget ?? "locked",
      detail: runtime.publicSnapshot.meta.active_source === "supabase"
        ? "Il layer pubblico legge già da Supabase."
        : "Il pubblico resta su source composita o snapshot.",
    },
  ] as const;

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Collection detail"
              title={collection.title}
              description="Qui puoi leggere warning, continuità con il prodotto pubblico e modificare la collection dal medesimo punto di lavoro."
            />
            <div className="hidden flex-wrap gap-3 sm:flex">
              {topActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`button-shell ${action.primary ? "button-primary text-white" : "button-secondary text-[var(--muted-strong)]"} rounded-full px-4 py-2.5 text-sm font-semibold`}
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
                className={`button-shell ${action.primary ? "button-primary text-white" : "button-secondary text-[var(--muted-strong)]"} inline-flex shrink-0 rounded-full px-4 py-2 text-[0.78rem] font-semibold`}
              >
                {action.label}
              </Link>
            ))}
          </div>

          {statusMessage ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium"
              style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(236,253,245,0.95)" }}
            >
              {statusMessage}
            </div>
          ) : null}

          {!runtime.canWrite ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
            >
              La collection ? leggibile, ma il write path reale resta disattivato finché Supabase
              collections non è pronto.
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-6 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {metrics.map((item) => (
              <article
                key={item.label}
                className="stat-block w-[12.5rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)" }}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.label}
                </p>
                <p className="mt-3 text-[1.72rem] leading-none">{item.value}</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {item.detail}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden gap-4 sm:grid lg:grid-cols-4">
            {metrics.map((item) => (
              <article
                key={`desktop-${item.label}`}
                className="stat-block rounded-[var(--radius-lg)] border p-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)" }}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.label}
                </p>
                <p className="mt-3 text-[1.72rem] leading-none">{item.value}</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <aside className="space-y-6">
            <section className="surface-card overflow-hidden rounded-[var(--radius-xl)]">
              <div className="relative min-h-[16rem]">
                <Image
                  src={collection.cover_image_url}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 34vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.08),rgba(18,15,35,0.72))]" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(24,17,12,0.28)" }}>
                    {stateMeta.label}
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)" }}>
                    {surfaceMeta.label}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/64">
                    Internal preview
                  </p>
                  <h2 className="mt-2 text-[2rem] leading-tight text-white">{collection.title}</h2>
                  <p className="mt-3 max-w-[32rem] text-sm leading-6 text-white/78">
                    {collection.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {[
                  { label: "Tone", value: toneMeta.label },
                  { label: "Access", value: accessMeta.label },
                  { label: "Difficulty", value: difficultyLabel },
                  { label: "Order", value: String(collection.editorial_order ?? 999) },
                  {
                    label: "Featured slot",
                    value: collection.featured_slot
                      ? getCollectionFeaturedSlotLabel(collection.featured_slot)
                      : "nessuno",
                  },
                  { label: "Updated", value: formatItalianDate(collection.updated_at) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border px-4 py-3"
                    style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                  >
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[var(--radius-xl)] p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                Warning & checks
              </p>
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
                            ? "rgba(254,242,242,0.96)"
                            : "rgba(255,251,235,0.96)",
                      }}
                    >
                      <strong>{issue.level === "error" ? "Errore" : "Warning"}:</strong>{" "}
                      {issue.message}
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-[20px] border px-4 py-3 text-sm"
                    style={{ borderColor: "rgba(15,118,110,0.18)", background: "rgba(236,253,245,0.95)" }}
                  >
                    Nessun warning aperto su questa collection.
                  </div>
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

            <section className="surface-card rounded-[var(--radius-xl)] p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                Tool inclusi
              </p>
              <div className="mt-4 grid gap-3">
                {collection.included_tools.map((slot, index) => {
                  const tool = toolsBySlug.get(slot.tool_slug);

                  return (
                    <div
                      key={`${collection.id}-${slot.tool_slug}-${index}`}
                      className="rounded-[22px] border px-4 py-4"
                      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {String(index + 1).padStart(2, "0")} · {tool?.name ?? slot.tool_slug}
                        </p>
                        {slot.featured ? (
                          <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--line)", background: "rgba(243,237,255,0.92)" }}>
                            Anchor
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                        {slot.role}
                      </p>
                      {slot.note ? (
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                          {slot.note}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
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
                      ? "rgba(254,242,242,0.96)"
                      : readiness.state === "review"
                        ? "rgba(255,251,235,0.96)"
                        : "rgba(236,253,245,0.95)",
                }}
              >
                <strong>{readiness.label}:</strong> {readiness.summary}
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
              action={boundAction}
              initialValues={getCollectionFormValues(collection)}
              submitLabel="Salva collection"
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
