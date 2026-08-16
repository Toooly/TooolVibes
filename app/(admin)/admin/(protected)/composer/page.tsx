import { saveHomepageControlsAction } from "@/lib/admin/control-center-actions";
import { getHomepageControls } from "@/lib/content/homepage-controls";
import { getPublicToolViews, getToolSpotlightView } from "@/lib/data/public-tools";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { SectionHeader } from "@/components/ui/section-header";

export default async function AdminComposerPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const [controls, tools, spotlight] = await Promise.all([
    Promise.resolve(getHomepageControls()),
    getPublicToolViews(),
    getToolSpotlightView(),
  ]);
  const featured =
    (controls.featuredToolSlug
      ? tools.find((tool) => tool.slug === controls.featuredToolSlug)
      : null) ?? spotlight;
  const partner = resolvePartnerCampaign({
    placementKey: "home-featured-tool",
    route: "home",
    strategy: "rotation",
    rotationOffset: 0,
  });

  return (
    <div className="space-y-6">
      <AdminSaveBanner saved={params.saved} />
      <SectionHeader invert
        eyebrow="Composer"
        title="Controlli homepage"
        description="Il codice tiene il design. Qui decidi solo i contenuti editoriali che la Home consuma davvero: annuncio e tool in evidenza. Le guide e le raccolte restano sulle loro superfici. Il partner è nel motore commercial."
      />

      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Preview Home</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/40">Annuncio</dt>
            <dd className="mt-1 text-sm text-white">
              {controls.announcement.enabled && controls.announcement.text
                ? `${controls.announcement.text} → ${controls.announcement.href}`
                : "Nascosto (stato vuoto sicuro)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/40">Tool in evidenza</dt>
            <dd className="mt-1 text-sm text-white">
              {featured ? `${featured.name} · ${featured.slug}` : "Nessun tool pubblico — Home nasconde lo spotlight"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/40">Partner spotlight</dt>
            <dd className="mt-1 text-sm text-white">
              {partner ? `${partner.name} · ${partner.status}` : "Nessuna campagna eleggibile — sezione nascosta"}
            </dd>
          </div>
        </dl>
      </section>

      <form action={saveHomepageControlsAction} className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <label className="flex min-h-11 items-center gap-3 text-sm text-white">
          <input type="checkbox" name="announcementEnabled" defaultChecked={controls.announcement.enabled} />
          Mostra annuncio in homepage
        </label>
        <label className="block text-sm text-white/70">
          Testo annuncio
          <input
            name="announcementText"
            defaultValue={controls.announcement.text}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
            placeholder="Vuoto = annuncio nascosto"
          />
        </label>
        <label className="block text-sm text-white/70">
          Destinazione interna
          <input
            name="announcementHref"
            defaultValue={controls.announcement.href}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
            placeholder="/radar"
          />
        </label>
        <div>
          <p className="mb-2 text-sm text-white/70">Creatività annuncio (opzionale)</p>
          <MediaLibraryPicker fieldName="announcementImage" defaultValue={controls.announcement.image ?? ""} />
        </div>
        <label className="block text-sm text-white/70">
          Tool in evidenza
          <select
            name="featuredToolSlug"
            defaultValue={controls.featuredToolSlug ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          >
            <option value="">Selezione automatica</option>
            {tools.map((tool) => (
              <option key={tool.slug} value={tool.slug}>
                {tool.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white">
          Salva controlli
        </button>
      </form>
    </div>
  );
}
