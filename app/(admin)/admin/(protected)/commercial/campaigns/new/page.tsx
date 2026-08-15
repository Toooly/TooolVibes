import { CommercialSubnav } from "@/components/admin/commercial-subnav";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { SectionHeader } from "@/components/ui/section-header";
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
    <div className="space-y-6">
      <CommercialSubnav current="/admin/commercial/campaigns" />
      <SectionHeader eyebrow="Commercial" title="Nuova campagna" description="Partner, creatività, copy, CTA, destinazione, schedule e placement. Zero codice." />
      <form action={saveManagedCampaignAction} className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white/70">
            ID campagna
            <input name="id" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/70">
            Partner
            <select name="partnerId" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-white/70">
            Nome
            <input name="name" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/70">
            Stato
            <select name="status" defaultValue="draft" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">
            Headline
            <input name="headline" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/70 sm:col-span-2">
            Descrizione
            <textarea name="description" rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/70">
            CTA
            <input name="ctaLabel" defaultValue="Scopri" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/70">
            Destinazione
            <input name="destinationUrl" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm text-white/70">Placement</legend>
          {PLACEMENTS.map((placement) => (
            <label key={placement} className="flex min-h-11 items-center gap-2 text-sm text-white">
              <input type="checkbox" name="placements" value={placement} defaultChecked />
              {placement}
            </label>
          ))}
        </fieldset>
        <div>
          <p className="mb-2 text-sm text-white/70">Creatività</p>
          <MediaLibraryPicker fieldName="image" />
        </div>
        <button type="submit" className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white">
          Crea campagna
        </button>
      </form>
    </div>
  );
}
