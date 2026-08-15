import Link from "next/link";

import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { SectionHeader } from "@/components/ui/section-header";
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
    <div className="space-y-6">
      <AdminSaveBanner saved={params.saved} />
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <SectionHeader
        eyebrow="Commercial"
        title="Campagne"
        description="Lista, non un muro di form. Apri una campagna per creatività, targeting e delivery."
        trailing={
          <Link href="/admin/commercial/campaigns/new" className="rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-4 py-2 text-sm font-semibold text-white">
            Nuova campagna
          </Link>
        }
      />
      {groups.map((bucket) => {
        const items = campaigns.filter((campaign) => campaignBucket(campaign) === bucket);
        if (items.length === 0) return null;
        return (
          <section key={bucket} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{CAMPAIGN_BUCKET_LABEL[bucket]}</h2>
            <div className="overflow-x-auto rounded-[24px] border border-white/10">
              <table className="min-w-full text-left text-sm text-white">
                <thead className="text-xs uppercase tracking-[0.12em] text-white/40">
                  <tr>
                    <th className="px-4 py-3">Campagna</th>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Peso</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((campaign) => (
                    <tr key={campaign.id} className="border-t border-white/8">
                      <td className="px-4 py-3 font-semibold">{campaign.name}</td>
                      <td className="px-4 py-3 text-white/60">{campaign.sponsorId}</td>
                      <td className="px-4 py-3 text-white/60">{campaign.status}</td>
                      <td className="px-4 py-3 text-white/60">{campaign.rotationWeight ?? 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/commercial/campaigns/${campaign.id}`} className="inline-flex min-h-11 items-center font-semibold text-cyan-200">
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
