import { notFound } from "next/navigation";

import { AdminEditorChrome } from "@/components/admin/admin-editor-chrome";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { SectionHeader } from "@/components/ui/section-header";
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
    <div className="space-y-6">
      <AdminSaveBanner saved={query.saved} />
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <SectionHeader eyebrow="Campagna" title={campaign.name} description="Generale, creatività, schedule e delivery. Salvataggio esplicito." />
      <AdminEditorChrome action={action} saveLabel="Salva campagna" backHref="/admin/commercial/campaigns">
        <input type="hidden" name="campaignId" value={campaign.id} />
        <input type="hidden" name="id" value={campaign.id} />
        <input type="hidden" name="partnerId" value={campaign.sponsorId} />
        <section className="grid gap-3 rounded-[24px] border border-white/10 p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-sm font-bold uppercase tracking-[0.16em] text-white/45">Generale</h2>
          <label className="text-sm text-white/70">Nome<input name="name" defaultValue={campaign.name} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">
            Stato
            <select name="status" defaultValue={campaign.status} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">Headline<input name="headline" defaultValue={campaign.headline} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70 sm:col-span-2">Descrizione<textarea name="description" defaultValue={campaign.description} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
        </section>
        <section className="grid gap-3 rounded-[24px] border border-white/10 p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-sm font-bold uppercase tracking-[0.16em] text-white/45">Delivery</h2>
          <label className="text-sm text-white/70">CTA<input name="ctaLabel" defaultValue={campaign.ctaLabel} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">Destinazione<input name="destinationUrl" defaultValue={campaign.destinationUrl} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">Inizio<input name="startsAt" defaultValue={campaign.startsAt ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">Fine<input name="endsAt" defaultValue={campaign.endsAt ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">Priorità<input name="priority" type="number" defaultValue={campaign.priority ?? 50} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
          <label className="text-sm text-white/70">Peso<input name="rotationWeight" type="number" defaultValue={campaign.rotationWeight ?? 1} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" /></label>
        </section>
        <section className="rounded-[24px] border border-white/10 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/45">Creatività</h2>
          <MediaLibraryPicker fieldName="image" defaultValue={campaign.image ?? campaign.brandAsset?.src ?? ""} />
        </section>
      </AdminEditorChrome>
    </div>
  );
}
