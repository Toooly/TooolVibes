import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { notFound } from "next/navigation";

import { updateAffiliateLinkAction } from "@/app/(admin)/admin/actions/affiliates";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
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
    <div className="page-shell py-6">
      <LocalizedAttributes><ControlCenterHeader
        kicker="Monetizzazione"
        title={link.label}
        description="Aggiorna i parametri del link di affiliazione."
        backHref="/admin/affiliate-links"
        backLabel="Torna ai link"
      /></LocalizedAttributes>

      <form action={boundAction} className="space-y-4">
        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker"><LocalizedText>{"Link"}</LocalizedText></p>
          <h2 className="tv-cc-panel__title"><LocalizedText>{"Destinazione ed etichetta"}</LocalizedText></h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Tool"}</LocalizedText></span>
              <select name="tool_id" defaultValue={link.tool_id} className="tv-cc-field" required>
                {runtime.tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Etichetta"}</LocalizedText></span>
              <input name="label" defaultValue={link.label} className="tv-cc-field" required />
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label"><LocalizedText>{"URL di destinazione"}</LocalizedText></span>
              <input name="destination_url" type="url" defaultValue={link.destination_url} className="tv-cc-field" required />
            </label>
            <label className="lg:col-span-2">
              <span className="tv-cc-label"><LocalizedText>{"URL tracciato"}</LocalizedText></span>
              <input name="tracking_url" type="url" defaultValue={link.tracking_url ?? ""} className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <p className="tv-cc-panel__kicker"><LocalizedText>{"UTM"}</LocalizedText></p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Campagna"}</LocalizedText></span>
              <input name="campaign" defaultValue={link.campaign ?? ""} className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Sorgente"}</LocalizedText></span>
              <input name="source" defaultValue={link.source ?? ""} className="tv-cc-field" />
            </label>
            <label>
              <span className="tv-cc-label"><LocalizedText>{"Canale"}</LocalizedText></span>
              <input name="medium" defaultValue={link.medium ?? ""} className="tv-cc-field" />
            </label>
          </div>
        </section>

        <section className="tv-cc-panel">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold"><LocalizedText>{"Link attivo"}</LocalizedText></p>
              <p className="tv-cc-panel__desc"><LocalizedText>{"Se attivo, il link è usato nel sito pubblico."}</LocalizedText></p>
            </div>
            <input name="is_active" type="checkbox" defaultChecked={link.is_active} className="h-5 w-5" />
          </label>
        </section>

        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}><LocalizedText>{"Salvataggio protetto"}</LocalizedText></p>
          <button type="submit" disabled={!canWrite} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Salva modifiche "}</LocalizedText></button>
        </div>
      </form>
    </div>
  );
}
