import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Community",
  description:
    "La community TooolVibes per scoprire, proporre e discutere i migliori AI tools, SaaS tools, no-code builder e automazioni.",
  openGraph: {
    title: `Community | ${siteConfig.name}`,
    description:
      "La community TooolVibes per scoprire e proporre i migliori tool digitali.",
    url: `${siteConfig.url}/community`,
  },
};

export default function CommunityPage() {
  return (
    <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="light-surface overflow-hidden rounded-[30px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#fdfcff_0%,#f5f0ff_44%,#eef2ff_100%)] px-5 py-5 shadow-[0_24px_72px_rgba(38,21,104,0.08)] sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
          <div className="max-w-[48rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Community TooolVibes
            </p>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,10vw,2.75rem)] leading-[0.96] text-[var(--foreground)] sm:text-[3.5rem]">
              Tool, workflow e idee migliori restano condivisi.
            </h1>
            <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-[var(--muted-strong)] sm:mt-5 sm:text-[1rem]">
              La community raccoglie suggerimenti, use case e tool emergenti per rendere la
              directory sempre pi&ugrave; utile a creator, founder e team.
            </p>
          </div>

          <div className="light-surface rounded-[24px] border border-[rgba(83,63,170,0.1)] bg-white/78 p-4 shadow-[0_18px_48px_rgba(36,19,103,0.08)] sm:rounded-[28px] sm:p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Partecipa
            </p>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted-strong)]">
              Il modo pi&ugrave; rapido per contribuire oggi &egrave; suggerire un tool con link,
              categoria e contesto d&apos;uso.
            </p>
            <Link
              href="/wishlist"
              className="mt-5 inline-flex rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)]"
            >
              Suggerisci un tool
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
