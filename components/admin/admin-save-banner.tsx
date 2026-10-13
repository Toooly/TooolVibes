import { LocalizedText } from "@/components/i18n/localized-text";
export function AdminSaveBanner({ saved }: { saved?: string }) {
  if (saved !== "1" && saved !== "0") return null;
  const ok = saved === "1";
  return (
    <p role="status" className={ok ? "tv-cc-notice tv-cc-notice--ok" : "tv-cc-notice tv-cc-notice--warn"}>
      <LocalizedText>{ok ? "Modifiche salvate." : "Salvataggio non persistente su questo runtime."}</LocalizedText>
    </p>
  );
}
