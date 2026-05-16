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
    <footer className="page-shell pb-6 pt-6 sm:pb-8 sm:pt-9">
      <PremiumPanel as="section" tone="dark" className="footer-motion px-5 py-5 sm:px-7 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(18rem,1.12fr)] lg:items-stretch">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} />
              <div>
                <p className="text-[0.84rem] font-semibold uppercase tracking-[0.18em] text-white">
                  TooolVibes
                </p>
                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-white/46">
                  AI tools discovery platform
                </p>
              </div>
            </div>

            <h2 className="mt-4 max-w-[20rem] text-[1.15rem] leading-tight text-white sm:text-[1.85rem]">
              I tool migliori, senza perdere tempo nel rumore.
            </h2>
            <p className="mt-3 max-w-[36rem] text-[0.82rem] leading-6 text-white/64 sm:text-[0.94rem] sm:leading-7">
              Directory curata di AI tools, SaaS, no-code builder, vibe coding e
              automazioni con link chiari, filtri utili e una selezione pensata per
              l&apos;uso reale.
            </p>

            <div className="mt-5 hidden flex-col gap-3 sm:flex sm:flex-row">
              <PremiumLink href="/wishlist" tone="secondary" size="sm">
                Suggerisci un tool
              </PremiumLink>
              <PremiumLink href={siteConfig.shopUrl} tone="ghost" size="sm" external>
                Apri il Digital Shop
              </PremiumLink>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            <details className="mobile-native-accordion dynamic-card rounded-[20px] border border-white/12 bg-white/8 px-4 py-3">
              <summary>Navigazione</summary>
              <div className="mt-3 grid gap-1">
                {footerNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="animated-link dynamic-link-card rounded-[14px] px-2 py-2 text-sm font-semibold text-white/72 transition duration-200 hover:bg-white/12 hover:text-white focus-visible:bg-white/12"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>

            <details className="mobile-native-accordion dynamic-card rounded-[20px] border border-white/12 bg-white/8 px-4 py-3">
              <summary>Categorie</summary>
              <div className="mt-3 grid gap-1">
                {categoryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="animated-link dynamic-link-card rounded-[14px] px-2 py-2 text-sm font-semibold text-white/72 transition duration-200 hover:bg-white/12 hover:text-white focus-visible:bg-white/12"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>

          <div className="hidden min-w-0 gap-4 md:grid md:grid-cols-2 md:items-stretch">
            <div className="dynamic-card h-full rounded-[22px] border border-white/12 bg-white/8 p-4">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/48">
                Navigazione
              </p>
              <div className="motion-stagger mt-3 grid gap-1.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                {footerNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="animated-link dynamic-link-card rounded-[14px] px-3 py-2 text-sm font-semibold text-white/68 transition duration-200 hover:bg-white/12 hover:text-white focus-visible:bg-white/12"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="dynamic-card h-full rounded-[22px] border border-white/12 bg-white/8 p-4">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/48">
                Categorie
              </p>
              <div className="motion-stagger mt-3 grid gap-1.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                {categoryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="animated-link dynamic-link-card rounded-[14px] px-3 py-2 text-sm font-semibold text-white/68 transition duration-200 hover:bg-white/12 hover:text-white focus-visible:bg-white/12"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex min-w-0 flex-col gap-3 border-t border-white/12 pt-4 text-[0.76rem] sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-white/50">&copy; 2026 TooolVibes. Directory premium per AI, SaaS, no-code e automazioni.</p>
          <div className="hidden shrink-0 flex-wrap justify-end gap-3 sm:flex">
            <a
              href={siteConfig.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="animated-link text-white/50 hover:text-white"
            >
              Shop
            </a>
            <Link href="/product-hunt" className="animated-link text-white/50 hover:text-white">
              Product Hunt
            </Link>
            <Link href="/wishlist" className="animated-link text-white/50 hover:text-white">
              Suggerisci
            </Link>
            <Link href="/archivio" className="animated-link text-white/50 hover:text-white">
              Archivio
            </Link>
          </div>
        </div>
      </PremiumPanel>
    </footer>
  );
}
