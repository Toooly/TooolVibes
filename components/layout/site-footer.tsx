import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { siteConfig } from "@/lib/config/site";

const footerNav = [
  { href: "/", label: "Home" },
  { href: "/archivio", label: "Archivio dei Toools" },
  { href: "/tags", label: "Tags" },
  { href: "/shop", label: "Digital Shop" },
  { href: "/account", label: "Login" },
];

export function SiteFooter() {
  return (
    <footer className="page-shell pb-6 pt-10 sm:pb-8 sm:pt-14">
      <div className="overflow-hidden rounded-[36px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(145deg,#18112f_0%,#23144d_54%,#140d28_100%)] px-5 py-6 text-white shadow-[0_30px_90px_rgba(15,9,42,0.28)] sm:px-7 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
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
              Ricevi i Toools migliori senza perdere tempo sul rumore.
            </h2>
            <p className="mt-4 max-w-[38rem] text-[1rem] leading-7 text-white/72">
              TooolVibes seleziona tool AI, no-code e vibe coding con un taglio più editoriale,
              più leggibile e più orientato all&apos;uso reale.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/account#account-upgrade"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Iscriviti
              </Link>
              <a
                href={siteConfig.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Apri il Digital Shop
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
              Navigazione
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

            <p className="mt-5 text-sm leading-7 text-white/64">{siteConfig.signature}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-[0.78rem] text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TooolVibes. Directory premium per AI, no-code e vibe coding.</p>
          <div className="flex flex-wrap gap-3">
            <a href={siteConfig.shopUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Shop
            </a>
            <Link href="/tags" className="hover:text-white">
              Tags
            </Link>
            <Link href="/archivio" className="hover:text-white">
              Archivio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
