import { MediaAssetCard, MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { ControlCenterHeader } from "@/components/admin/control-center-header";
import { saveMediaAssetAction } from "@/lib/admin/control-center-actions";
import { getMediaCatalog } from "@/lib/admin/media-catalog";
import { findMediaUsage } from "@/lib/admin/media-usage";

export default function AdminMediaPage() {
  const catalog = getMediaCatalog();

  return (
    <div className="space-y-5">
      <ControlCenterHeader
        kicker="Media"
        title="Libreria asset"
        description="Seleziona, sostituisci o registra un percorso già approvato."
        metrics={[{ label: "asset", value: catalog.length }]}
      />
      <section className="tv-cc-panel">
        <p className="tv-cc-panel__desc">Upload nel bucket editorial-media, con fallback locale.</p>
        <div className="mt-3">
          <MediaLibraryPicker fieldName="previewSelected" />
        </div>
      </section>
      <form action={saveMediaAssetAction} className="tv-cc-panel grid gap-4 sm:grid-cols-2">
        <label>
          <span className="tv-cc-label">ID</span>
          <input name="id" required className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">Etichetta</span>
          <input name="label" required className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label">Percorso o URL</span>
          <input name="src" required className="tv-cc-field" placeholder="/media/... oppure https://" />
        </label>
        <label>
          <span className="tv-cc-label">Alt</span>
          <input name="alt" className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">Uso</span>
          <input name="usedIn" defaultValue="Editoriale" className="tv-cc-field" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="tv-cc-btn tv-cc-btn--primary">Registra asset</button>
        </div>
      </form>
      {catalog.length === 0 ? (
        <p className="tv-cc-notice">Nessun asset in catalogo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((asset) => (
            <div key={asset.id}>
              <MediaAssetCard asset={asset} />
              <p className="tv-cc-card__meta mt-2">
                Usato in: {findMediaUsage(asset.src).join(", ") || "nessun riferimento Control Center"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
