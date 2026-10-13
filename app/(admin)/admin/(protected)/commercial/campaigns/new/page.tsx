import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveManagedCampaignAction } from "@/lib/admin/control-center-actions";
import { getManagedPartners } from "@/lib/sponsors/managed-commercial";
import { ALL_SPONSOR_CAMPAIGNS } from "@/lib/sponsors/sponsor-placements";

const PLACEMENTS = [
  "home-partner-spotlight",
  "archive-sponsored-tool",
  "tool-detail-partner",
  "collections-partner",
  "article-partner",
] as const;

export default function AdminNewCampaignPage() {
  const partners = [
    ...getManagedPartners().map((partner) => ({ id: partner.id, name: partner.name })),
    ...ALL_SPONSOR_CAMPAIGNS.map((campaign) => ({ id: campaign.sponsorId, name: campaign.name })),
  ].filter((partner, index, all) => all.findIndex((item) => item.id === partner.id) === index);

  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Commercial"
        title="Nuova campagna"
        description="Partner, creatività, copy e placement."
        backHref="/admin/commercial/campaigns"
        backLabel="Torna alle campagne"
      /></LocalizedAttributes>
      <form action={saveManagedCampaignAction} className="space-y-4">
        <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
          <label>
            <span className="tv-cc-label"><LocalizedText>{"ID campagna"}</LocalizedText></span>
            <input name="id" required className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Partner"}</LocalizedText></span>
            <select name="partnerId" required className="tv-cc-field">
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Nome"}</LocalizedText></span>
            <input name="name" required className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Stato"}</LocalizedText></span>
            <select name="status" defaultValue="draft" className="tv-cc-field">
              <option value="draft"><LocalizedText>{"draft"}</LocalizedText></option>
              <option value="scheduled"><LocalizedText>{"scheduled"}</LocalizedText></option>
              <option value="active"><LocalizedText>{"active"}</LocalizedText></option>
              <option value="paused"><LocalizedText>{"paused"}</LocalizedText></option>
              <option value="completed"><LocalizedText>{"completed"}</LocalizedText></option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label"><LocalizedText>{"Headline"}</LocalizedText></span>
            <input name="headline" required className="tv-cc-field" />
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label"><LocalizedText>{"Descrizione"}</LocalizedText></span>
            <textarea name="description" rows={3} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"CTA"}</LocalizedText></span>
            <input name="ctaLabel" defaultValue="Scopri" className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Destinazione"}</LocalizedText></span>
            <input name="destinationUrl" className="tv-cc-field" />
          </label>
        </section>
        <fieldset className="tv-cc-panel space-y-2">
          <legend className="tv-cc-panel__kicker"><LocalizedText>{"Placement"}</LocalizedText></legend>
          {PLACEMENTS.map((placement) => (
            <label key={placement} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="placements" value={placement} defaultChecked />
              <LocalizedText>{placement}</LocalizedText>
            </label>
          ))}
        </fieldset>
        <section className="tv-cc-panel">
          <p className="tv-cc-label"><LocalizedText>{"Creatività"}</LocalizedText></p>
          <MediaLibraryPicker fieldName="image" />
        </section>
        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}><LocalizedText>{"Crea la campagna"}</LocalizedText></p>
          <button type="submit" className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Crea campagna"}</LocalizedText></button>
        </div>
      </form>
    </div>
  );
}
