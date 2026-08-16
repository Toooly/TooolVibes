import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveManagedPartnerAction } from "@/lib/admin/control-center-actions";
import type { ManagedPartner } from "@/lib/sponsors/managed-commercial";

export function ManagedPartnerForm({ partner }: { partner?: ManagedPartner }) {
  return (
    <form action={saveManagedPartnerAction} className="space-y-4">
      <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
        <label>
          <span className="tv-cc-label">ID / slug</span>
          <input name="id" required defaultValue={partner?.id ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">Nome</span>
          <input name="name" required defaultValue={partner?.name ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">Stato</span>
          <select name="status" defaultValue={partner?.status ?? "draft"} className="tv-cc-field">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label>
          <span className="tv-cc-label">Sito</span>
          <input name="website" defaultValue={partner?.website ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">CTA</span>
          <input name="defaultCta" defaultValue={partner?.defaultCta ?? "Scopri"} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label">Destinazione</span>
          <input name="destinationUrl" defaultValue={partner?.destinationUrl ?? ""} className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label">Segmenti (virgola)</span>
          <input name="segments" defaultValue={partner?.segments?.join(", ") ?? ""} className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label">Note</span>
          <textarea name="notes" defaultValue={partner?.notes ?? ""} rows={3} className="tv-cc-field" />
        </label>
      </section>
      <section className="tv-cc-panel">
        <p className="tv-cc-label">Logo</p>
        <MediaLibraryPicker fieldName="logo" defaultValue={partner?.logo ?? ""} />
      </section>
      <section className="tv-cc-panel">
        <p className="tv-cc-label">Brand plate / creatività</p>
        <MediaLibraryPicker fieldName="brandPlate" defaultValue={partner?.brandPlate ?? ""} />
      </section>
      <div className="tv-cc-savebar">
        <p className="tv-cc-panel__desc" style={{ margin: 0 }}>Salva partner</p>
        <button type="submit" className="tv-cc-btn tv-cc-btn--primary">Salva partner</button>
      </div>
    </form>
  );
}
