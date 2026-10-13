import Link from "@/components/ui/app-link";

import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { CAMPAIGN_BUCKET_LABEL, campaignBucket } from "@/lib/admin/campaign-schedule";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const campaigns = getManagedCampaigns();
  const groups = ["active", "ending", "upcoming", "other", "ended"] as const;

  return (
    <div className="space-y-5">
      <AdminSaveBanner saved={params.saved} />
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <ControlCenterHeader
        kicker="Commercial"
        title="Campagne"
        description="Lista operativa. Apri una campagna per creatività e delivery."
        primaryHref="/admin/commercial/campaigns/new"
        primaryLabel="Nuova campagna"
        metrics={[{ label: "totali", value: campaigns.length }]}
      />
      {groups.map((bucket) => {
        const items = campaigns.filter((campaign) => campaignBucket(campaign) === bucket);
        if (items.length === 0) return null;
        return (
          <section key={bucket} className="tv-cc-panel">
            <h2 className="tv-cc-panel__kicker">{CAMPAIGN_BUCKET_LABEL[bucket]}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="tv-cc-table">
                <thead>
                  <tr>
                    <th>Campagna</th>
                    <th>Partner</th>
                    <th>Stato</th>
                    <th>Peso</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td className="is-muted">{campaign.sponsorId}</td>
                      <td className="is-muted">{campaign.status}</td>
                      <td className="is-muted">{campaign.rotationWeight ?? 1}</td>
                      <td>
                        <Link href={`/admin/commercial/campaigns/${campaign.id}`} className="tv-cc-btn tv-cc-btn--secondary">
                          Apri
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
