"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Columns3, Home, Radar, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

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

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Navigazione mobile principale"
      className={cn(
        "mobile-bottom-motion fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-[45] mx-auto w-[min(calc(100vw-1.5rem),30rem)] rounded-[26px] border border-[rgba(76,55,166,0.18)] bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.9),transparent_32%),radial-gradient(circle_at_84%_0%,rgba(94,226,255,0.18),transparent_34%),linear-gradient(135deg,#fffdf8_0%,#f4efff_54%,#edf7ff_100%)] p-1.5 shadow-[0_20px_58px_rgba(47,33,126,0.16),inset_0_1px_0_rgba(255,255,255,0.74)] lg:hidden transition-opacity duration-300",
        isOverlayOpen && "opacity-0 pointer-events-none"
      )}
    >
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mobile-bottom-link flex min-h-12 flex-col items-center justify-center gap-1 rounded-[20px] text-[0.64rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80",
                active
                  ? "bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.32),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(94,226,255,0.32),transparent_34%),linear-gradient(135deg,#24105c_0%,#7c3aed_45%,#5268ff_74%,#0f766e_100%)] text-white shadow-[0_12px_28px_rgba(99,102,241,0.34),0_0_24px_rgba(94,226,255,0.16),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "text-[var(--muted-strong)] hover:bg-white/80 hover:text-[var(--accent-strong)]",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
