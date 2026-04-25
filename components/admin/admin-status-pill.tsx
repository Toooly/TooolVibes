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
      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
      style={{
        background: active ? "var(--cyan-soft)" : "var(--gold-soft)",
        color: active ? "var(--accent-strong)" : "var(--muted-strong)",
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
