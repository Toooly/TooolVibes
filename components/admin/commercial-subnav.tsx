import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/commercial/partners", label: "Partner" },
  { href: "/admin/commercial/campaigns", label: "Campagne" },
  { href: "/admin/commercial/placements", label: "Placement" },
  { href: "/admin/commercial/preview", label: "Preview" },
  { href: "/admin/monetization", label: "Inventario" },
];

export function CommercialSubnav({ current }: { current: string }) {
  return (
    <LocalizedAttributes><nav aria-label="Commercial" className="tv-cc-filters">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn("tv-cc-filter", current === link.href && "is-active")}
        >
          <LocalizedText>{link.label}</LocalizedText>
        </Link>
      ))}
    </nav></LocalizedAttributes>
  );
}
