import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";
import { getManagedPartners } from "@/lib/sponsors/managed-commercial";

export default function AdminPartnersPage() {
  const registry = getManagedCampaigns();
  const managed = getManagedPartners();

  return (
    <div className="space-y-5">
      <CommercialSubnav current="/admin/commercial/partners" />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Commercial"
        title="Partner"
        description="Partner first-party e registro campagne."
        primaryHref="/admin/commercial/partners/new"
        primaryLabel="Nuovo partner"
        metrics={[
          { label: "gestiti", value: managed.length },
          { label: "registro", value: registry.length },
        ]}
      /></LocalizedAttributes>
      {managed.length > 0 ? (
        <div className="space-y-3">
          {managed.map((partner) => (
            <article key={partner.id} className="tv-cc-card">
              <div>
                <p className="tv-cc-card__meta"><LocalizedText>{partner.status}</LocalizedText></p>
                <h2 className="tv-cc-card__title">{partner.name}</h2>
              </div>
              <div className="tv-cc-card__actions">
                <Link href={`/admin/commercial/partners/${partner.id}`} className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Modifica "}</LocalizedText></Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {registry.map((campaign) => (
          <article key={campaign.id} className="tv-cc-card">
            <div>
              <p className="tv-cc-card__meta"><LocalizedText>{campaign.sponsorId}</LocalizedText></p>
              <h2 className="tv-cc-card__title">{campaign.name}</h2>
              <p className="tv-cc-card__meta"><LocalizedText>{campaign.headline}</LocalizedText></p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
