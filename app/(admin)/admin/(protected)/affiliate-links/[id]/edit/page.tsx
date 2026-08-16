import Link from "next/link";
import { notFound } from "next/navigation";

import { updateAffiliateLinkAction } from "@/app/(admin)/admin/actions/affiliates";
import { SectionHeader } from "@/components/ui/section-header";
import { getAffiliateLink } from "@/lib/admin/affiliate-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";

type EditAffiliateLinkPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAffiliateLinkPage({ params }: EditAffiliateLinkPageProps) {
  const { id } = await params;
  const [link, runtime] = await Promise.all([getAffiliateLink(id), getAdminToolsRuntime()]);

  if (!link) {
    notFound();
  }

  const canWrite = runtime.canWrite;
  const boundAction = updateAffiliateLinkAction.bind(null, id);

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader invert
            eyebrow="Modifica link affiliato"
            title={link.label}
            description="Aggiorna i parametri del link di affiliazione."
          />
          <Link
            href="/admin/affiliate-links"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[#f4f1ff]"
          >
            Torna ai link affiliati
          </Link>
        </div>

        <form action={boundAction} className="mt-8 space-y-8">
          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="border-b pb-4 soft-divider">
              <p className="editorial-label">Link</p>
              <h2 className="text-display-card mt-2 text-[1.32rem] sm:text-[1.46rem]">
                Destinazione ed etichetta
              </h2>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Tool *</span>
                <select
                  name="tool_id"
                  defaultValue={link.tool_id}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                  required
                >
                  {runtime.tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Etichetta *</span>
                <input
                  name="label"
                  defaultValue={link.label}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                  required
                />
              </label>

              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold">URL di destinazione *</span>
                <input
                  name="destination_url"
                  type="url"
                  defaultValue={link.destination_url}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                  required
                />
              </label>

              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold">URL tracciato (opzionale)</span>
                <input
                  name="tracking_url"
                  type="url"
                  defaultValue={link.tracking_url ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>
            </div>
          </section>

          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="border-b pb-4 soft-divider">
              <p className="editorial-label">Parametri UTM</p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Campagna UTM</span>
                <input
                  name="campaign"
                  defaultValue={link.campaign ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Sorgente UTM</span>
                <input
                  name="source"
                  defaultValue={link.source ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Canale UTM</span>
                <input
                  name="medium"
                  defaultValue={link.medium ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>
            </div>
          </section>

          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="border-b pb-4 soft-divider">
              <p className="editorial-label">Stato</p>
            </div>
            <div className="mt-5">
              <label
                className="flex items-center justify-between gap-4 rounded-[24px] border px-4 py-4"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-sm font-semibold">Link attivo</p>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Se attivo, il link sarà usato nel sito pubblico.
                  </p>
                </div>
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={link.is_active}
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          <div className="dark-panel rounded-[28px] px-5 py-4.5 text-white sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">
                  Salvataggio protetto
                </p>
              </div>
              <button
                type="submit"
                disabled={!canWrite}
                className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  background: "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                }}
              >
                Salva modifiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
