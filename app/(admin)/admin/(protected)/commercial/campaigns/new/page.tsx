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
      <ControlCenterHeader
        kicker="Commercial"
        title="Nuova campagna"
        description="Partner, creatività, copy e placement."
        backHref="/admin/commercial/campaigns"
        backLabel="Torna alle campagne"
      />
      <form action={saveManagedCampaignAction} className="space-y-4">
        <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
          <label>
            <span className="tv-cc-label">ID campagna</span>
            <input name="id" required className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label">Partner</span>
            <select name="partnerId" required className="tv-cc-field">
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="tv-cc-label">Nome</span>
            <input name="name" required className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label">Stato</span>
            <select name="status" defaultValue="draft" className="tv-cc-field">
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label">Headline</span>
            <input name="headline" required className="tv-cc-field" />
          </label>
          <label className="sm:col-span-2">
            <span className="tv-cc-label">Descrizione</span>
            <textarea name="description" rows={3} className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label">CTA</span>
            <input name="ctaLabel" defaultValue="Scopri" className="tv-cc-field" />
          </label>
          <label>
            <span className="tv-cc-label">Destinazione</span>
            <input name="destinationUrl" className="tv-cc-field" />
          </label>
        </section>
        <fieldset className="tv-cc-panel space-y-2">
          <legend className="tv-cc-panel__kicker">Placement</legend>
          {PLACEMENTS.map((placement) => (
            <label key={placement} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="placements" value={placement} defaultChecked />
              {placement}
            </label>
          ))}
        </fieldset>
        <section className="tv-cc-panel">
          <p className="tv-cc-label">Creatività</p>
          <MediaLibraryPicker fieldName="image" />
        </section>
        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}>Crea la campagna</p>
          <button type="submit" className="tv-cc-btn tv-cc-btn--primary">Crea campagna</button>
        </div>
      </form>
    </div>
  );
}
