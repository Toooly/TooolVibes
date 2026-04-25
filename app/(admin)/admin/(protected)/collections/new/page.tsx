import Link from "next/link";

import { createCollectionFormAction } from "@/app/(admin)/admin/actions";
import { CollectionForm } from "@/components/admin/collection-form";
import { SectionHeading } from "@/components/sections/section-heading";
import { getAdminTools } from "@/lib/admin/tool-queries";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";

export default async function NewCollectionPage() {
  const [runtime, tools] = await Promise.all([
    getAdminCollectionsRuntime(),
    getAdminTools(),
  ]);
  const publishedTools = tools.filter((tool) => tool.is_published).length;
  const topActions = [
    { href: "/admin/collections", label: "Torna alle collections" },
    { href: "/admin/collections/review", label: "Conflict review" },
  ] as const;
  const metrics = [
    {
      label: "Tool disponibili",
      value: String(tools.length),
      detail: `${publishedTools} gia pubblicati, ${tools.length - publishedTools} ancora in lavorazione.`,
    },
    {
      label: "Write target",
      value: runtime.writeTarget ?? "locked",
      detail: runtime.writeMessage,
    },
    {
      label: "Public source",
      value: runtime.publicSnapshot.meta.active_source,
      detail: runtime.reviewMessage,
    },
  ] as const;

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Nuova collection"
              title="Crea una nuova surface curatoriale"
              description="Qui costruiamo una collection come vero modulo editoriale del prodotto: framing, accesso, sequencing tool e continuita` col layer pubblico."
            />
            <div className="hidden flex-wrap gap-3 sm:flex">
              {topActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="button-shell button-secondary text-[var(--muted-strong)] rounded-full px-4 py-2.5 text-sm font-semibold"
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
                className="button-shell button-secondary text-[var(--muted-strong)] inline-flex shrink-0 rounded-full px-4 py-2 text-[0.78rem] font-semibold"
              >
                {action.label}
              </Link>
            ))}
          </div>

          {!runtime.canWrite ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
              style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
            >
              Il write path collections non e` ancora attivo. Questa pagina resta visibile per
              mostrare il form, ma il salvataggio reale richiede Supabase collections configurato.
            </div>
          ) : null}

          <div className="tool-rail -mx-1.5 mt-6 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
            {metrics.map((item) => (
              <article
                key={item.label}
                className="stat-block w-[13rem] shrink-0 snap-start rounded-[var(--radius-lg)] border p-4"
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

          <div className="mt-6 hidden gap-4 sm:grid lg:grid-cols-3">
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

        <div className="surface-card rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
          <CollectionForm
            action={createCollectionFormAction}
            submitLabel="Crea collection"
            disabled={!runtime.canWrite}
            availableTools={tools.map((tool) => ({
              slug: tool.slug,
              name: tool.name,
              category: tool.category,
              is_published: tool.is_published,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
