import { LocalizedText } from "@/components/i18n/localized-text";
export function AdminStatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className="tv-cc-metric"
      style={{
        background: active
          ? "color-mix(in srgb, var(--tv-accent-cyan) 16%, transparent)"
          : "var(--tv-surface-interactive)",
        color: active ? "var(--tv-accent-cyan-on-dark)" : "var(--tv-ink-secondary)",
        borderColor: active
          ? "color-mix(in srgb, var(--tv-accent-cyan) 32%, transparent)"
          : "var(--tv-border-default)",
      }}
    >
      <LocalizedText>{active ? activeLabel : inactiveLabel}</LocalizedText>
    </span>
  );
}
