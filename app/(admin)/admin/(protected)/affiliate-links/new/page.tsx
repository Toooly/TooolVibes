import Link from "next/link";

import { createAffiliateLinkAction } from "@/app/(admin)/admin/actions/affiliates";
import { SectionHeader } from "@/components/ui/section-header";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";

type NewAffiliateLinkPageProps = {
  searchParams: Promise<{ status?: string; toolId?: string }>;
};

export default async function NewAffiliateLinkPage({ searchParams }: NewAffiliateLinkPageProps) {
  const [{ status, toolId }, runtime] = await Promise.all([
    searchParams,
    getAdminToolsRuntime(),
  ]);
  const tools = runtime.tools;

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader invert
            eyebrow="Nuovo link affiliato"
            title="Crea un link di affiliazione"
            description="Associa un link tracciato a un tool del catalogo. I parametri UTM sono opzionali."
          />
          <Link
            href="/admin/affiliate-links"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[#f4f1ff]"
          >
            Torna ai link affiliati
          </Link>
        </div>

        {status === "error" ? (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(185,28,28,0.25)", background: "rgba(255,82,82,0.12)" }}
          >
            Errore durante la creazione. Verifica i dati e riprova.
          </div>
        ) : null}

        {status === "validation" ? (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(185,28,28,0.25)", background: "rgba(255,82,82,0.12)" }}
          >
            Compila tutti i campi obbligatori.
          </div>
        ) : null}

        <form action={createAffiliateLinkAction} className="mt-8 space-y-8">
          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
          >
            <div className="border-b pb-4 soft-divider">
              <p className="editorial-label">Associazione tool</p>
              <h2 className="text-display-card mt-2 text-[1.32rem] sm:text-[1.46rem]">
                Tool e link di destinazione
              </h2>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Tool *</span>
                <select
                  name="tool_id"
                  defaultValue={toolId ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                  required
                >
                  <option value="">Seleziona un tool</option>
                  {tools.map((tool) => (
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
                  placeholder="es. Link homepage o pagina prezzi"
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
                  placeholder="https://tuodominio.it/prezzi"
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
                  placeholder="URL tracciato diverso dalla destinazione"
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
              <h2 className="text-display-card mt-2 text-[1.32rem] sm:text-[1.46rem]">
                Tracciamento opzionale
              </h2>
              <p className="mt-2 max-w-[40rem] text-sm leading-7" style={{ color: "var(--muted)" }}>
                Se compilati, i parametri UTM verranno aggiunti automaticamente all&apos;URL di
                destinazione.
              </p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Campagna UTM</span>
                <input
                  name="campaign"
                  placeholder="es. spring-launch"
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Sorgente UTM</span>
                <input
                  name="source"
                  placeholder="es. tooolvibes"
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Canale UTM</span>
                <input
                  name="medium"
                  placeholder="es. affiliate"
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
                <input name="is_active" type="checkbox" defaultChecked className="h-5 w-5" />
              </label>
            </div>
          </section>

          <div className="dark-panel rounded-[28px] px-5 py-4.5 text-white sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">
                  Salvataggio protetto
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  Nessun dato sensibile viene esposto al client.
                </p>
              </div>
              <button
                type="submit"
                disabled={!runtime.canWrite}
                className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  background: "linear-gradient(135deg, var(--accent-strong), var(--accent))",
                }}
              >
                Crea link affiliato
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
