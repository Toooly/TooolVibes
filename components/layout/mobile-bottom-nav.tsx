"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Columns3, Home, LayoutGrid, Radar, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

const mobileItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/archivio", label: "Catalogo", icon: LayoutGrid },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/shortlist", label: "Salvati", icon: Bookmark },
  { href: "/compare", label: "Confronto", icon: Columns3 },
  { href: "/chi-siamo", label: "Chi siamo", icon: UsersRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname.startsWith("/admin")) {
    return null;
  }

  const nav = (
    <nav
      aria-label="Navigazione mobile principale"
      className={cn(
        "mobile-bottom-motion site-mobile-footer-nav fixed z-50 mx-auto w-auto max-w-[25rem]",
        "md:hidden",
        "rounded-[1.75rem] border border-white/35 bg-white/78 backdrop-blur-2xl",
        "shadow-[0_14px_38px_rgba(47,33,126,0.16),inset_0_1px_0_rgba(255,255,255,0.72)]",
        "transition-opacity duration-300",
        isOverlayOpen && "opacity-0 pointer-events-none"
      )}
    >
      <div className="grid w-full grid-cols-6 gap-1.5 p-1.5">
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
                "mobile-bottom-link flex h-[3.55rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1 text-[0.66rem] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80",
                active ? "is-active text-[#ffffff]" : "text-[#16112d] hover:bg-white/72 hover:text-[#6a3cff]",
                active && "[&_.mobile-bottom-link__icon-wrap>svg]:scale-110",
                compareHasItems && "mobile-bottom-link--compare-ready"
              )}
            >
              <span className="mobile-bottom-link__icon-wrap" aria-hidden="true">
                <Icon className="size-5 transition-transform" />
                {isCompareItem && compareCount > 0 ? (
                  <span
                    key={compareCount}
                    className="mobile-bottom-link__badge animate-compare-ping"
                    aria-label={`${compareCount} tool in confronto`}
                  >
                    {compareCount}
                  </span>
                ) : null}
              </span>
              <span className="mobile-bottom-link__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
