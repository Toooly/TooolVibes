import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
      <LocalizedAttributes><ControlCenterHeader
        kicker="Monetizzazione"
        title="Nuovo link affiliato"
        description="Associa un link tracciato a un tool del catalogo."
        backHref="/admin/affiliate-links"
        backLabel="Torna ai link"
      /></LocalizedAttributes>
      {status === "error" ? (
        <ControlCenterNotice tone="warn"><LocalizedText>{"Errore durante la creazione. Verifica i dati e riprova."}</LocalizedText></ControlCenterNotice>
      ) : null}
      {status === "validation" ? (
        <ControlCenterNotice tone="warn"><LocalizedText>{"Compila tutti i campi obbligatori."}</LocalizedText></ControlCenterNotice>
      ) : null}

      <form action={createAffiliateLinkAction} className="space-y-4">
        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker"><LocalizedText>{"Associazione"}</LocalizedText></p>
          <h2 className="tv-cc-panel__title"><LocalizedText>{"Tool e destinazione"}</LocalizedText></h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Tool"}</LocalizedText></span>
              <select name="tool_id" defaultValue={toolId ?? ""} className="tv-cc-field" required>
                <option value=""><LocalizedText>{"Seleziona un tool"}</LocalizedText></option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Etichetta"}</LocalizedText></span>
              <LocalizedAttributes><input name="label" placeholder="Homepage o prezzi" className="tv-cc-field" required /></LocalizedAttributes>
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label"><LocalizedText>{"URL di destinazione"}</LocalizedText></span>
              <input name="destination_url" type="url" className="tv-cc-field" required />
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label"><LocalizedText>{"URL tracciato (opzionale)"}</LocalizedText></span>
              <input name="tracking_url" type="url" className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker"><LocalizedText>{"UTM"}</LocalizedText></p>
          <h2 className="tv-cc-panel__title"><LocalizedText>{"Tracciamento opzionale"}</LocalizedText></h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Campagna"}</LocalizedText></span>
              <input name="campaign" className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Sorgente"}</LocalizedText></span>
              <input name="source" className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Canale"}</LocalizedText></span>
              <input name="medium" className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold"><LocalizedText>{"Link attivo"}</LocalizedText></p>
              <p className="tv-cc-panel__desc"><LocalizedText>{"Se attivo, il link è usato nel sito pubblico."}</LocalizedText></p>
            </div>
            <input name="is_active" type="checkbox" defaultChecked className="h-5 w-5" />
          </label>
        </section>

        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}><LocalizedText>{"Salvataggio protetto"}</LocalizedText></p>
          <button type="submit" disabled={!runtime.canWrite} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Crea link affiliato "}</LocalizedText></button>
        </div>
      </form>
    </div>
  );
}
