import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { MediaLibraryDesk } from "@/components/admin/media-library-desk";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { saveMediaAssetAction } from "@/lib/admin/control-center-actions";
import { getMediaCatalog } from "@/lib/admin/media-catalog";
import { findMediaUsage } from "@/lib/admin/media-usage";

export default function AdminMediaPage() {
  const catalog = getMediaCatalog();

  return (
    <div className="space-y-5">
      <LocalizedAttributes><ControlCenterHeader
        kicker="Media"
        title="Libreria asset"
        description="Trascina i file nella libreria. L'URL resta solo per un asset già pubblicato."
        metrics={[{ label: "asset", value: catalog.length }]}
      /></LocalizedAttributes>
      <MediaLibraryDesk
        initialAssets={catalog}
        usage={Object.fromEntries(catalog.map((asset) => [asset.src, findMediaUsage(asset.src)]))}
      />
      <details className="tv-cc-panel">
        <summary className="cursor-pointer text-sm font-semibold"><LocalizedText>{"Registra un URL già approvato"}</LocalizedText></summary>
        <form action={saveMediaAssetAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="tv-cc-label"><LocalizedText>{"ID"}</LocalizedText></span>
          <input name="id" required className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Etichetta"}</LocalizedText></span>
          <input name="label" required className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label"><LocalizedText>{"Percorso o URL"}</LocalizedText></span>
          <LocalizedAttributes><input name="src" required className="tv-cc-field" placeholder="/media/... oppure https://" /></LocalizedAttributes>
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Alt"}</LocalizedText></span>
          <input name="alt" className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Uso"}</LocalizedText></span>
          <input name="usedIn" defaultValue="Editoriale" className="tv-cc-field" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="tv-cc-btn tv-cc-btn--secondary"><LocalizedText>{"Registra asset"}</LocalizedText></button>
        </div>
        </form>
      </details>
    </div>
  );
}
