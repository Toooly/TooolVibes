import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { marketingStrings } from "@/lib/config/strings";
import { siteConfig } from "@/lib/config/site";

export function SiteFooter() {
  return (
    <footer className="page-shell pb-5 pt-5 sm:pb-7 sm:pt-6">
      <div className="shell-panel-dark footer-stage brand-aura rounded-[34px] px-5 py-5 sm:px-7 sm:py-6">
        <div className="border-b pb-4.5 soft-divider">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <BrandLogo size={46} />
              <div>
                <p className="text-[0.88rem] font-medium uppercase tracking-[0.18em] text-white/72 sm:text-[0.94rem] sm:tracking-[0.2em]">{siteConfig.name}</p>
                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.2em] text-white/44">Archivio editoriale AI e SaaS</p>
              </div>
            </div>
            <p className="text-display-card mt-3.5 max-w-[17ch] text-[1.42rem] text-white sm:max-w-[18ch] sm:text-[1.7rem]">
              Poche sezioni, ruoli piu` chiari, percorsi piu` leggibili.
            </p>
            <p className="text-body-soft mt-3 text-[0.9rem] text-white/66">
              {siteConfig.signature}
            </p>
          </div>
        </div>

        <div className="pt-4">
          <div className="tool-rail -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
            {marketingStrings.footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="selection-chip inline-flex shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-[0.74rem] font-medium text-white/82"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden flex-wrap gap-3 text-[0.84rem] text-white/68 sm:flex sm:text-[0.9rem]">
            {marketingStrings.footerNav.map((item) => (
              <Link key={item.href} href={item.href} className="section-quiet-link transition-colors duration-200 hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[0.8rem] text-white/56 sm:text-[0.84rem]">
            <Link href="/posts" className="section-quiet-link transition-colors duration-200 hover:text-white">
              Approfondimenti
            </Link>
            <Link href="/shop" className="section-quiet-link transition-colors duration-200 hover:text-white">
              Premium
            </Link>
          </div>

          <p className="mt-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/50 sm:mt-4">
            Curation italiana, percorsi piu` chiari.
          </p>
        </div>
      </div>
    </footer>
  );
}
