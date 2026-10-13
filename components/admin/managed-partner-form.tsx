import { LocalizedText } from "@/components/i18n/localized-text";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveManagedPartnerAction } from "@/lib/admin/control-center-actions";
import type { ManagedPartner } from "@/lib/sponsors/managed-commercial";

export function ManagedPartnerForm({ partner }: { partner?: ManagedPartner }) {
  return (
    <form action={saveManagedPartnerAction} className="space-y-4">
      <section className="tv-cc-panel grid gap-4 sm:grid-cols-2">
        <label>
          <span className="tv-cc-label"><LocalizedText>{"ID / slug"}</LocalizedText></span>
          <input name="id" required defaultValue={partner?.id ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Nome"}</LocalizedText></span>
          <input name="name" required defaultValue={partner?.name ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Stato"}</LocalizedText></span>
          <select name="status" defaultValue={partner?.status ?? "draft"} className="tv-cc-field">
            <option value="draft"><LocalizedText>{"draft"}</LocalizedText></option>
            <option value="active"><LocalizedText>{"active"}</LocalizedText></option>
            <option value="archived"><LocalizedText>{"archived"}</LocalizedText></option>
          </select>
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Sito"}</LocalizedText></span>
          <input name="website" defaultValue={partner?.website ?? ""} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"CTA"}</LocalizedText></span>
          <input name="defaultCta" defaultValue={partner?.defaultCta ?? "Scopri"} className="tv-cc-field" />
        </label>
        <label>
          <span className="tv-cc-label"><LocalizedText>{"Destinazione"}</LocalizedText></span>
          <input name="destinationUrl" defaultValue={partner?.destinationUrl ?? ""} className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label"><LocalizedText>{"Segmenti (virgola)"}</LocalizedText></span>
          <input name="segments" defaultValue={partner?.segments?.join(", ") ?? ""} className="tv-cc-field" />
        </label>
        <label className="sm:col-span-2">
          <span className="tv-cc-label"><LocalizedText>{"Note"}</LocalizedText></span>
          <textarea name="notes" defaultValue={partner?.notes ?? ""} rows={3} className="tv-cc-field" />
        </label>
      </section>
      <section className="tv-cc-panel">
        <p className="tv-cc-label"><LocalizedText>{"Logo"}</LocalizedText></p>
        <MediaLibraryPicker fieldName="logo" defaultValue={partner?.logo ?? ""} />
      </section>
      <section className="tv-cc-panel">
        <p className="tv-cc-label"><LocalizedText>{"Brand plate / creatività"}</LocalizedText></p>
        <MediaLibraryPicker fieldName="brandPlate" defaultValue={partner?.brandPlate ?? ""} />
      </section>
      <div className="tv-cc-savebar">
        <p className="tv-cc-panel__desc" style={{ margin: 0 }}><LocalizedText>{"Salva partner"}</LocalizedText></p>
        <button type="submit" className="tv-cc-btn tv-cc-btn--primary"><LocalizedText>{"Salva partner"}</LocalizedText></button>
      </div>
    </form>
  );
}
