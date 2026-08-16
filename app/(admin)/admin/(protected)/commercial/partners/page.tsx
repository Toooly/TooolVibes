import Link from "next/link";

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
      <ControlCenterHeader
        kicker="Commercial"
        title="Partner"
        description="Partner first-party e registro campagne."
        primaryHref="/admin/commercial/partners/new"
        primaryLabel="Nuovo partner"
        metrics={[
          { label: "gestiti", value: managed.length },
          { label: "registro", value: registry.length },
        ]}
      />
      {managed.length > 0 ? (
        <div className="space-y-3">
          {managed.map((partner) => (
            <article key={partner.id} className="tv-cc-card">
              <div>
                <p className="tv-cc-card__meta">{partner.status}</p>
                <h2 className="tv-cc-card__title">{partner.name}</h2>
              </div>
              <div className="tv-cc-card__actions">
                <Link href={`/admin/commercial/partners/${partner.id}`} className="tv-cc-btn tv-cc-btn--primary">
                  Modifica
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {registry.map((campaign) => (
          <article key={campaign.id} className="tv-cc-card">
            <div>
              <p className="tv-cc-card__meta">{campaign.sponsorId}</p>
              <h2 className="tv-cc-card__title">{campaign.name}</h2>
              <p className="tv-cc-card__meta">{campaign.headline}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
