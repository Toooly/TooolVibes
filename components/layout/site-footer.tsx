import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumLink, PremiumPanel } from "@/components/ui/premium";
import {
  getNavDestination,
  getNavItemsForSurface,
} from "@/lib/navigation/selectors";

const footerNav = getNavItemsForSurface("footer-nav");
const categoryNav = getNavItemsForSurface("footer-categories");
const footerMeta = getNavItemsForSurface("footer-meta");
const suggestDestination = getNavDestination("suggest");
const affiliatesDestination = getNavDestination("affiliates");
const shopExternalDestination = getNavDestination("shop-external");

export function SiteFooter() {
  return (
    <footer className="page-shell pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:pb-8 sm:pt-9">
      <PremiumPanel as="section" tone="dark" className="footer-motion px-5 py-5 sm:px-7 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(18rem,1.12fr)] lg:items-stretch">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} />
              <div>
                <p className="text-[0.84rem] font-semibold uppercase tracking-[0.18em] text-white">
                  TooolVibes
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/58">
                  Guida italiana ai tool AI
                </p>
              </div>
            </div>

            <h2 className="mt-4 max-w-[20rem] text-[1.15rem] leading-tight text-white sm:text-[1.85rem]">
              I tool migliori, già filtrati dal rumore.
            </h2>
            <p className="mt-3 max-w-[36rem] text-[0.82rem] leading-6 text-white/64 sm:text-[0.94rem] sm:leading-7">
              Catalogo curato di tool AI, SaaS, no-code, vibe coding e
              automazioni, con link chiari, filtri utili e una selezione pensata per
              scegliere con più lucidità.
            </p>

            <div className="mt-5 hidden flex-col gap-3 sm:flex sm:flex-row">
              <PremiumLink href={suggestDestination.href} tone="secondary" size="sm">
                Suggerisci un tool
              </PremiumLink>
              <PremiumLink href={affiliatesDestination.href} tone="ghost" size="sm">
                Diventa affiliato
              </PremiumLink>
              <PremiumLink href={shopExternalDestination.href} tone="ghost" size="sm" external>
                Apri lo shop digitale
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
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
          <p className="min-w-0 text-white/58">&copy; 2026 TooolVibes. Catalogo premium per AI, SaaS, no-code e automazioni operative.</p>
          <div className="hidden shrink-0 flex-wrap justify-end gap-3 sm:flex">
            {footerMeta.map((item) =>
              item.external ? (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animated-link text-white/50 hover:text-white"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="animated-link text-white/50 hover:text-white"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </PremiumPanel>
    </footer>
  );
}
