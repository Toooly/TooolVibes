export function AdminActionMenu({
  label = "Altro",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="tv-cc-menu">
      <summary className="tv-cc-menu__trigger">{label}</summary>
      <div className="tv-cc-menu__list">{children}</div>
    </details>
  );
}
