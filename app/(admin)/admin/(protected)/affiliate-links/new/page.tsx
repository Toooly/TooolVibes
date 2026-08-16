import { createAffiliateLinkAction } from "@/app/(admin)/admin/actions/affiliates";
import {
  ControlCenterHeader,
  ControlCenterNotice,
} from "@/components/admin/control-center-header";
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
    <div className="page-shell py-6">
      <ControlCenterHeader
        kicker="Monetizzazione"
        title="Nuovo link affiliato"
        description="Associa un link tracciato a un tool del catalogo."
        backHref="/admin/affiliate-links"
        backLabel="Torna ai link"
      />
      {status === "error" ? (
        <ControlCenterNotice tone="warn">Errore durante la creazione. Verifica i dati e riprova.</ControlCenterNotice>
      ) : null}
      {status === "validation" ? (
        <ControlCenterNotice tone="warn">Compila tutti i campi obbligatori.</ControlCenterNotice>
      ) : null}

      <form action={createAffiliateLinkAction} className="space-y-4">
        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker">Associazione</p>
          <h2 className="tv-cc-panel__title">Tool e destinazione</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="tv-cc-label">Tool</span>
              <select name="tool_id" defaultValue={toolId ?? ""} className="tv-cc-field" required>
                <option value="">Seleziona un tool</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="tv-cc-label">Etichetta</span>
              <input name="label" placeholder="Homepage o prezzi" className="tv-cc-field" required />
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label">URL di destinazione</span>
              <input name="destination_url" type="url" className="tv-cc-field" required />
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label">URL tracciato (opzionale)</span>
              <input name="tracking_url" type="url" className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker">UTM</p>
          <h2 className="tv-cc-panel__title">Tracciamento opzionale</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label>
              <span className="tv-cc-label">Campagna</span>
              <input name="campaign" className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label">Sorgente</span>
              <input name="source" className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label">Canale</span>
              <input name="medium" className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Link attivo</p>
              <p className="tv-cc-panel__desc">Se attivo, il link è usato nel sito pubblico.</p>
            </div>
            <input name="is_active" type="checkbox" defaultChecked className="h-5 w-5" />
          </label>
        </section>

        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}>Salvataggio protetto</p>
          <button type="submit" disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--primary">
            Crea link affiliato
          </button>
        </div>
      </form>
    </div>
  );
}
