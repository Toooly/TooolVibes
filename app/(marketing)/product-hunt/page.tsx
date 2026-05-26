import type { Metadata } from "next";
import { Activity, MessageCircle, TrendingUp } from "lucide-react";

import { DesktopVibeRadar } from "@/components/desktop/desktop-vibe-radar";
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
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
    <>
      <DesktopVibeRadar />

      <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6 lg:hidden">
        <section className="hero-shell hero-shell-radar motion-reveal px-5 py-5 text-white sm:rounded-[38px] sm:px-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-center">
            <div className="max-w-[48rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                Product Hunt radar
              </p>
              <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
                I lanci pi&ugrave; forti da tenere d&apos;occhio.
              </h1>
              <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                Una vista compatta sui prodotti pi&ugrave; votati in Product Hunt: giorno,
                settimana e mese, con token protetto lato server e cache per restare veloce
                su Cloudflare.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <PremiumLink href="/archivio">Esplora la directory</PremiumLink>
                <PremiumLink href="/wishlist" tone="secondary">
                  Suggerisci un tool
                </PremiumLink>
              </div>
            </div>

            <div className="hero-mini-visual rounded-[28px] border border-white/12 bg-white/9 p-4">
              <div className="flex items-center justify-between gap-3">
                <PremiumBadge tone="dark">Live radar</PremiumBadge>
                <TrendingUp className="size-5 text-violet-100" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { icon: Activity, label: "Rank", value: "Giorno / settimana / mese" },
                  { icon: MessageCircle, label: "Segnali", value: "Commenti e voti solo se validi" },
                  { icon: TrendingUp, label: "Fallback", value: "Stati chiari se l'API non risponde" },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/7 p-3">
                      <span className="grid size-10 place-items-center rounded-[16px] bg-white/10 text-white">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white/44">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-white/82">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <ProductHuntRankings variant="wide" className="mx-auto max-w-[70rem]" />
      </div>
    </>
  );
}
