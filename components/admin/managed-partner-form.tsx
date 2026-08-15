import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { saveManagedPartnerAction } from "@/lib/admin/control-center-actions";
import type { ManagedPartner } from "@/lib/sponsors/managed-commercial";

export function ManagedPartnerForm({ partner }: { partner?: ManagedPartner }) {
  return (
    <form action={saveManagedPartnerAction} className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/70">
          ID / slug
          <input name="id" required defaultValue={partner?.id ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          Nome
          <input name="name" required defaultValue={partner?.name ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          Stato
          <select name="status" defaultValue={partner?.status ?? "draft"} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="text-sm text-white/70">
          Sito
          <input name="website" defaultValue={partner?.website ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          CTA
          <input name="defaultCta" defaultValue={partner?.defaultCta ?? "Scopri"} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70">
          Destinazione
          <input name="destinationUrl" defaultValue={partner?.destinationUrl ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70 sm:col-span-2">
          Segmenti (virgola)
          <input name="segments" defaultValue={partner?.segments?.join(", ") ?? ""} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-white/70 sm:col-span-2">
          Note
          <textarea name="notes" defaultValue={partner?.notes ?? ""} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" />
        </label>
      </div>
      <div>
        <p className="mb-2 text-sm text-white/70">Logo</p>
        <MediaLibraryPicker fieldName="logo" defaultValue={partner?.logo ?? ""} />
      </div>
      <div>
        <p className="mb-2 text-sm text-white/70">Brand plate / creatività</p>
        <MediaLibraryPicker fieldName="brandPlate" defaultValue={partner?.brandPlate ?? ""} />
      </div>
      <button type="submit" className="min-h-11 rounded-full bg-[linear-gradient(135deg,#6a3cff,#39d2f6)] px-5 text-sm font-semibold text-white">
        Salva partner
      </button>
    </form>
  );
}
