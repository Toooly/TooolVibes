import Link from "next/link";

const LINKS = [
  { href: "/admin/commercial/partners", label: "Partner" },
  { href: "/admin/commercial/campaigns", label: "Campagne" },
  { href: "/admin/commercial/placements", label: "Placement" },
  { href: "/admin/commercial/preview", label: "Preview" },
  { href: "/admin/monetization", label: "Inventario" },
];

export function CommercialSubnav({ current }: { current: string }) {
  return (
    <nav aria-label="Commercial" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = current === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: active ? "rgba(57,210,246,0.4)" : "rgba(255,255,255,0.12)",
              background: active ? "rgba(57,210,246,0.12)" : "transparent",
              color: "white",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
