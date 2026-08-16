import { MediaAssetCard, MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveMediaAssetAction } from "@/lib/admin/control-center-actions";
import { getMediaCatalog } from "@/lib/admin/media-catalog";
import { findMediaUsage } from "@/lib/admin/media-usage";
import { SectionHeader } from "@/components/ui/section-header";

export default function AdminMediaPage() {
  const catalog = getMediaCatalog();

  return (
    <div className="space-y-6">
      <SectionHeader invert
        eyebrow="Media"
        title="Libreria asset di prodotto"
        description="Catalogo first-party già spedito più URL editoriali registrati. Nessun secondo store e nessun upload binario: selezioni, sostituisci o registri un percorso già approvato."
      />
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="mb-3 text-sm text-white/70">Carica o seleziona. L&apos;upload va nel bucket editorial-media, con fallback locale.</p>
        <MediaLibraryPicker fieldName="previewSelected" />
      </section>
      <form action={saveMediaAssetAction} className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2">
        <label className="text-sm text-white/70">
          ID
          <input name="id" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          Etichetta
          <input name="label" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70 sm:col-span-2">
          Percorso o URL
          <input name="src" required className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" placeholder="/media/... oppure https://" />
        </label>
        <label className="text-sm text-white/70">
          Alt
          <input name="alt" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          Uso
          <input name="usedIn" defaultValue="Editoriale" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white">
            Registra asset
          </button>
        </div>
      </form>
      {catalog.length === 0 ? (
        <p className="rounded-2xl border border-white/10 p-5 text-white/70">Nessun asset in catalogo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((asset) => (
            <div key={asset.id}>
              <MediaAssetCard asset={asset} />
              <p className="mt-2 px-1 text-xs text-white/45">
                Usato in: {findMediaUsage(asset.src).join(", ") || "nessun riferimento Control Center"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
