import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
export function ScenicLoading({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <LocalizedAttributes><div
      className={compact ? "tv-scenic-load tv-scenic-load--compact" : "tv-scenic-load"}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="tv-scenic-load__stage" aria-hidden="true">
        <span className="tv-scenic-load__orb" />
        <span className="tv-scenic-load__ring" />
        <span className="tv-scenic-load__ring tv-scenic-load__ring--late" />
      </div>
      <p className="tv-scenic-load__mark"><LocalizedText>{"TOOOLVIBES"}</LocalizedText></p>
      <p className="tv-scenic-load__hint"><LocalizedText>{label}</LocalizedText></p>
    </div></LocalizedAttributes>
  );
}
