import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { saveHomepageControlsAction } from "@/lib/admin/control-center-actions";
import { getHomepageControls } from "@/lib/content/homepage-controls";
import { getPublicToolViews, getToolSpotlightView } from "@/lib/data/public-tools";
import { resolvePartnerCampaign } from "@/lib/sponsors/partner-resolver";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { AdminSaveBanner } from "@/components/admin/admin-save-banner";
import { ControlCenterHeader } from "@/components/admin/control-center-header";

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
    <div className="space-y-5">
      <AdminSaveBanner saved={params.saved} />
      <LocalizedAttributes><ControlCenterHeader
        kicker="Composer"
        title="Controlli homepage"
        description="Annuncio e tool in evidenza. Il partner resta nel motore commercial."
      /></LocalizedAttributes>

      <section className="tv-cc-panel">
        <p className="tv-cc-panel__kicker"><LocalizedText>{"Preview Home"}</LocalizedText></p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="tv-cc-card__meta"><LocalizedText>{"Annuncio"}</LocalizedText></dt>
            <dd className="mt-1 text-sm">
              <LocalizedText>{controls.announcement.enabled && controls.announcement.text
                ? `${controls.announcement.text} → ${controls.announcement.href}`
                : "Nascosto"}</LocalizedText>
            </dd>
          </div>
          <div>
            <dt className="tv-cc-card__meta"><LocalizedText>{"Tool in evidenza"}</LocalizedText></dt>
            <dd className="mt-1 text-sm">
              <LocalizedText>{featured ? `${featured.name} · ${featured.slug}` : "Nessun tool pubblico"}</LocalizedText>
            </dd>
          </div>
          <div>
            <dt className="tv-cc-card__meta"><LocalizedText>{"Partner spotlight"}</LocalizedText></dt>
            <dd className="mt-1 text-sm">
              <LocalizedText>{partner ? `${partner.name} · ${partner.status}` : "Nessuna campagna eleggibile"}</LocalizedText>
            </dd>
          </div>
        </dl>
      </section>

      <form action={saveHomepageControlsAction} className="space-y-4">
        <section className="tv-cc-panel space-y-4">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="announcementEnabled" defaultChecked={controls.announcement.enabled} /><LocalizedText>{"Mostra annuncio in homepage "}</LocalizedText></label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Testo annuncio"}</LocalizedText></span>
            <LocalizedAttributes><input name="announcementText" defaultValue={controls.announcement.text} className="tv-cc-field" placeholder="Vuoto = nascosto" /></LocalizedAttributes>
          </label>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Destinazione interna"}</LocalizedText></span>
            <LocalizedAttributes><input name="announcementHref" defaultValue={controls.announcement.href} className="tv-cc-field" placeholder="/radar" /></LocalizedAttributes>
          </label>
          <div>
            <p className="tv-cc-label"><LocalizedText>{"Creatività annuncio"}</LocalizedText></p>
            <MediaLibraryPicker fieldName="announcementImage" defaultValue={controls.announcement.image ?? ""} />
          </div>
          <label>
            <span className="tv-cc-label"><LocalizedText>{"Tool in evidenza"}</LocalizedText></span>
            <select name="featuredToolSlug" defaultValue={controls.featuredToolSlug ?? ""} className="tv-cc-field">
              <option value=""><LocalizedText>{"Selezione automatica"}</LocalizedText></option>
              {tools.map((tool) => (
                <option key={tool.slug} value={tool.slug}>{tool.name}</option>
              ))}
            </select>
          </label>
        </section>
        <div className="tv-cc-savebar">
          <p className="tv-cc-panel__desc" style={{ margin: 0 }}><LocalizedText>{"Salva i controlli homepage"}</LocalizedText></p>
          <button type="submit" className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Salva controlli"}</LocalizedText></button>
        </div>
      </form>
    </div>
  );
}
