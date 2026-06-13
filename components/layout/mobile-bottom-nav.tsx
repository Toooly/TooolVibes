"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Columns3, Home, Radar, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

const mobileItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/archivio", label: "Cerca", icon: Search },
  { href: "/product-hunt", label: "Radar", icon: Radar },
  { href: "/shortlist", label: "Salvati", icon: Bookmark },
  { href: "/compare", label: "Confronta", icon: Columns3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Navigazione mobile principale"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2",
        "flex items-center gap-1 px-2 py-2 rounded-full",
        "bg-white/70 backdrop-blur-xl border border-white/20",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
        "max-w-[calc(100%-2rem)]",
        "lg:hidden transition-opacity duration-300",
        isOverlayOpen && "opacity-0 pointer-events-none"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)", transform: "translateZ(0)" }}
    >
      <div className="grid grid-cols-5 gap-1 p-1.5">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isCompareItem = item.href === "/compare";
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const compareHasItems = isCompareItem && compareCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mobile-bottom-link flex min-h-12 flex-col items-center justify-center gap-1 rounded-[20px] text-[0.64rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80",
                active || compareHasItems
                  ? "text-[#6a3cff] shadow-[0_0_12px_rgba(106,60,255,0.3)]"
                  : "text-[var(--muted-strong)] hover:bg-white/80 hover:text-[var(--accent-strong)]",
                active && "[&>svg]:scale-110",
                compareHasItems && "mobile-bottom-link--compare-ready"
              )}
            >
              <Icon className="size-5 transition-transform" aria-hidden="true" />
              <span>{item.label}</span>
              {isCompareItem && compareCount > 0 ? (
                <span
                  key={compareCount}
                  className="mobile-bottom-link__badge animate-compare-ping"
                  aria-label={`${compareCount} tool in confronto`}
                >
                  {compareCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
