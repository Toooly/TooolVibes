import Link from "next/link";

import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { SectionHeader } from "@/components/ui/section-header";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";
import { getManagedPartners } from "@/lib/sponsors/managed-commercial";

export default function AdminPartnersPage() {
  const registry = getManagedCampaigns();
  const managed = getManagedPartners();

  return (
    <div className="space-y-6">
      <CommercialSubnav current="/admin/commercial/partners" />
      <SectionHeader
        eyebrow="Commercial"
        title="Partner"
        description="I partner first-party del registro restano visibili. I nuovi partner si creano qui, con logo e brand plate dalla Media Library."
        trailing={
          <Link href="/admin/commercial/partners/new" className="rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-4 py-2 text-sm font-semibold text-white">
            Nuovo partner
          </Link>
        }
      />
      {managed.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {managed.map((partner) => (
            <article key={partner.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{partner.status}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{partner.name}</h2>
              <Link href={`/admin/commercial/partners/${partner.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-cyan-200">
                Modifica
              </Link>
            </article>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {registry.map((campaign) => (
          <article key={campaign.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{campaign.sponsorId}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{campaign.name}</h2>
            <p className="mt-2 text-sm text-white/65">{campaign.headline}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
