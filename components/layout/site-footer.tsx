import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { siteConfig } from "@/lib/config/site";

const footerNav = [
  { href: "/", label: "Home" },
  { href: "/archivio", label: "Catalogo" },
  { href: "/tags", label: "Categorie" },
  { href: "/wishlist", label: "Suggerisci" },
  { href: "/product-hunt", label: "Product Hunt" },
  { href: "/community", label: "Community" },
  { href: "/shop", label: "Shop Digitale" },
  { href: "/account", label: "Login" },
];

const categoryNav = [
  { href: "/archivio?group=vibe-coding", label: "Vibe Coding" },
  { href: "/archivio?group=ai-app-builder", label: "AI App Builder" },
  { href: "/archivio?group=no-code", label: "No-Code" },
  { href: "/archivio?group=automation", label: "Automation" },
  { href: "/archivio?group=ai-agents", label: "AI Agents" },
  { href: "/archivio?group=ai-video", label: "AI Video" },
];

export function SiteFooter() {
  return (
    <footer className="page-shell pb-6 pt-10 sm:pb-8 sm:pt-14">
      <PremiumPanel tone="dark" className="px-5 py-6 sm:px-7 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo size={46} />
              <div>
                <p className="text-[0.9rem] font-semibold uppercase tracking-[0.2em] text-white/86">
                  TooolVibes
                </p>
                <p className="mt-1 text-[0.72rem] uppercase tracking-[0.16em] text-white/46">
                  AI tools discovery platform
                </p>
              </div>
            </div>

            <h2 className="mt-5 max-w-[14ch] text-[2rem] leading-[0.98] sm:text-[2.6rem]">
              I tool migliori, senza perdere tempo nel rumore.
            </h2>
            <p className="mt-4 max-w-[38rem] text-[1rem] leading-7 text-white/72">
              Directory curata di AI tools, SaaS, no-code builder, vibe coding e
              automazioni con link chiari, filtri utili e una selezione pensata per
              l&apos;uso reale.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PremiumLink href="/wishlist" tone="secondary">
                Suggerisci un tool
              </PremiumLink>
              <PremiumLink href={siteConfig.shopUrl} tone="dark" external>
                Apri il Digital Shop
              </PremiumLink>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Navigazione
              </p>
              <div className="mt-4 grid gap-3">
                {footerNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white/82 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Categorie
              </p>
              <div className="mt-4 grid gap-3">
                {categoryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white/82 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-[0.78rem] text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 TooolVibes. Directory premium per AI, SaaS, no-code e automazioni.</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={siteConfig.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Shop
            </a>
            <Link href="/product-hunt" className="hover:text-white">
              Product Hunt
            </Link>
            <Link href="/wishlist" className="hover:text-white">
              Suggerisci
            </Link>
            <Link href="/archivio" className="hover:text-white">
              Archivio
            </Link>
          </div>
        </div>
      </PremiumPanel>
    </footer>
  );
}
