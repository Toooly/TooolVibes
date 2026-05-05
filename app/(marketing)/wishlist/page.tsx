import type { Metadata } from "next";
import { CheckCircle2, ClipboardList } from "lucide-react";

import { RequestToolForm } from "@/components/wishlist/request-tool-form";
import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Suggerisci un nuovo Toool da inserire nella directory TooolVibes: AI tools, SaaS, no-code builder, vibe coding e automazioni.",
  openGraph: {
    title: `Wishlist | ${siteConfig.name}`,
    description:
      "Suggerisci un nuovo Toool da inserire nella directory TooolVibes.",
    url: `${siteConfig.url}/wishlist`,
  },
};

export default function WishlistPage() {
  return (
    <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="hero-shell hero-shell-wishlist motion-reveal px-5 py-5 text-white sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
          <div className="max-w-[48rem]">
            <PremiumBadge tone="accent">Wishlist TooolVibes</PremiumBadge>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2.05rem,9vw,3.35rem)] leading-[0.98] text-white">
              Suggerisci il prossimo tool da inserire.
            </h1>
            <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
              La directory resta premium solo se la selezione cresce con criterio. Se hai
              trovato un tool AI, SaaS, no-code o automation davvero utile, portalo qui.
            </p>
          </div>

          <div className="hero-mini-visual rounded-[24px] border border-white/12 bg-white/9 p-4 shadow-[0_18px_48px_rgba(8,14,38,0.16)] sm:rounded-[28px] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Criterio editoriale
              </p>
              <ClipboardList className="size-5 text-violet-100" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[1rem] leading-7 text-white/72">
              Privilegiamo tool con casi d&apos;uso chiari, link ufficiali, valore pratico
              e qualità percepita alta per founder, creator e team.
            </p>
            <div className="mt-4 grid gap-2">
              {["Uso concreto", "Link verificabile", "Categoria chiara"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/70">
                  <CheckCircle2 className="size-4 text-emerald-200" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <PremiumLink href="/archivio" tone="secondary" size="sm" className="mt-5">
              Vedi i tool attuali
            </PremiumLink>
          </div>
        </div>
      </section>

      <RequestToolForm />
    </div>
  );
}
