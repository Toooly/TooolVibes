"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Columns3, Home, Radar, Search } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/archivio", label: "Cerca", icon: Search },
  { href: "/product-hunt", label: "Radar", icon: Radar },
  { href: "/shortlist", label: "Salvati", icon: Bookmark },
  { href: "/compare", label: "Confronta", icon: Columns3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Navigazione mobile principale"
      className="mobile-bottom-motion fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-[26px] border border-white/16 bg-[rgba(24,32,58,0.9)] p-1.5 shadow-[0_24px_70px_rgba(8,14,38,0.28)] backdrop-blur-xl lg:hidden"
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
                  ? "bg-[linear-gradient(135deg,#a78bfa_0%,#7c3aed_48%,#5268ff_100%)] text-white shadow-[0_12px_28px_rgba(99,102,241,0.32),inset_0_1px_0_rgba(255,255,255,0.28)]"
                  : "text-white/62 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
