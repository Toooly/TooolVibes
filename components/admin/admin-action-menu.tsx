import { LocalizedText } from "@/components/i18n/localized-text";
export function AdminActionMenu({
  label = "Altro",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="tv-cc-menu">
      <summary className="tv-cc-menu__trigger"><LocalizedText>{label}</LocalizedText></summary>
      <div className="tv-cc-menu__list">{children}</div>
    </details>
  );
}
