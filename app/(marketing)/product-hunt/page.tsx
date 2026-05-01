import type { Metadata } from "next";
import Link from "next/link";

import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Product Hunt Top",
  description:
    "Classifica dei migliori lanci Product Hunt del giorno, della settimana e del mese dentro TooolVibes.",
  openGraph: {
    title: `Product Hunt Top | ${siteConfig.name}`,
    description:
      "Classifica dei migliori lanci Product Hunt del giorno, della settimana e del mese.",
    url: `${siteConfig.url}/product-hunt`,
  },
};

export default function ProductHuntPage() {
  return (
    <div className="page-shell space-y-6 pb-16 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="overflow-hidden rounded-[38px] border border-white/10 bg-[radial-gradient(circle_at_86%_12%,rgba(168,85,247,0.22),transparent_32%),linear-gradient(135deg,#11111f_0%,#18122f_52%,#0b0b1a_100%)] px-5 py-6 text-white shadow-[0_24px_72px_rgba(0,0,0,0.28)] sm:px-7 sm:py-8">
        <div className="max-w-[48rem]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/58">
            Product Hunt radar
          </p>
          <h1 className="mt-4 text-[2.4rem] leading-[0.95] text-white sm:max-w-[13ch] sm:text-[3.5rem]">
            I lanci pi&ugrave; forti da tenere d&apos;occhio.
          </h1>
          <p className="mt-5 max-w-[42rem] text-[1rem] leading-7 text-white/70">
            Una vista compatta sui prodotti pi&ugrave; votati in Product Hunt: giorno,
            settimana e mese, con token protetto lato server e cache per restare veloce
            su Cloudflare.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/archivio"
              className="rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)]"
            >
              Esplora la directory
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white/84 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
            >
              Suggerisci un Toool
            </Link>
          </div>
        </div>
      </section>

      <ProductHuntRankings className="mx-auto max-w-[50rem]" />
    </div>
  );
}
