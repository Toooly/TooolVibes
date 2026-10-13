import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { notFound } from "next/navigation";

import { AdminEditorChrome } from "@/components/admin/admin-editor-chrome";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveCampaignOverrideAction, saveManagedCampaignAction } from "@/lib/admin/control-center-actions";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";
import { getExplicitManagedCampaigns } from "@/lib/sponsors/managed-commercial";

const STATUSES = ["draft", "scheduled", "active", "paused", "completed"] as const;

export default async function AdminCampaignEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const campaign = getManagedCampaigns().find((item) => item.id === id);
  if (!campaign) notFound();
  const isJsonManaged = getExplicitManagedCampaigns().some((item) => item.id === id);
  const action = isJsonManaged ? saveManagedCampaignAction : saveCampaignOverrideAction;

  return (
    <div className="space-y-5">
      <AdminSaveBanner saved={query.saved} />
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Campagna"
        title={campaign.name}
        description="Generale, creatività e delivery."
        backHref="/admin/commercial/campaigns"
        backLabel="Torna alle campagne"
      /></LocalizedAttributes>
      <AdminEditorChrome action={action} saveLabel="Salva campagna" backHref="/admin/commercial/campaigns">
        <input type="hidden" name="campaignId" value={campaign.id} />
        <input type="hidden" name="id" value={campaign.id} />
        <input type="hidden" name="partnerId" value={campaign.sponsorId} />
        <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
          <h2 className="tv-cc-panel__kicker sm:col-span-2"><LocalizedText>{"Generale"}</LocalizedText></h2>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Nome"}</LocalizedText></span>
            <input name="name" defaultValue={campaign.name} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Stato"}</LocalizedText></span>
            <select name="status" defaultValue={campaign.status} className="tv-cc-field">
              {STATUSES.map((status) => <option key={status} value={status}><LocalizedText>{status}</LocalizedText></option>)}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label"><LocalizedText>{"Headline"}</LocalizedText></span>
            <input name="headline" defaultValue={campaign.headline} className="tv-cc-field" />
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label"><LocalizedText>{"Descrizione"}</LocalizedText></span>
            <textarea name="description" defaultValue={campaign.description} rows={3} className="tv-cc-field" />
          </label>
        </section>
        <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
          <h2 className="tv-cc-panel__kicker sm:col-span-2"><LocalizedText>{"Delivery"}</LocalizedText></h2>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"CTA"}</LocalizedText></span>
            <input name="ctaLabel" defaultValue={campaign.ctaLabel} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Destinazione"}</LocalizedText></span>
            <input name="destinationUrl" defaultValue={campaign.destinationUrl} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Inizio"}</LocalizedText></span>
            <input name="startsAt" defaultValue={campaign.startsAt ?? ""} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Fine"}</LocalizedText></span>
            <input name="endsAt" defaultValue={campaign.endsAt ?? ""} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Priorità"}</LocalizedText></span>
            <input name="priority" type="number" defaultValue={campaign.priority ?? 50} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Peso"}</LocalizedText></span>
            <input name="rotationWeight" type="number" defaultValue={campaign.rotationWeight ?? 1} className="tv-cc-field" />
          </label>
        </section>
        <section className="tv-cc-panel">
          <h2 className="tv-cc-panel__kicker"><LocalizedText>{"Creatività"}</LocalizedText></h2>
          <div className="mt-3">
            <MediaLibraryPicker fieldName="image" defaultValue={campaign.image ?? campaign.brandAsset?.src ?? ""} />
          </div>
        </section>
      </AdminEditorChrome>
    </div>
  );
}
