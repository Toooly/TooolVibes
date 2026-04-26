import type { Metadata } from "next";
import Link from "next/link";

import { RequestToolForm } from "@/components/wishlist/request-tool-form";
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
    <div className="page-shell space-y-6 pb-16 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="overflow-hidden rounded-[38px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#fdfcff_0%,#f5f0ff_44%,#eef2ff_100%)] px-5 py-6 shadow-[0_24px_72px_rgba(38,21,104,0.08)] sm:px-7 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
          <div className="max-w-[48rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Wishlist TooolVibes
            </p>
            <h1 className="mt-4 text-[2.4rem] leading-[0.95] text-[var(--foreground)] sm:max-w-[13ch] sm:text-[3.5rem]">
              Suggerisci il prossimo Toool da inserire.
            </h1>
            <p className="mt-5 max-w-[42rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
              La directory resta premium solo se la selezione cresce con criterio. Se hai
              trovato un tool AI, SaaS, no-code o automation davvero utile, portalo qui.
            </p>
          </div>

          <div className="rounded-[28px] border border-[rgba(83,63,170,0.1)] bg-white/78 p-5 shadow-[0_18px_48px_rgba(36,19,103,0.08)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Criterio editoriale
            </p>
            <p className="mt-3 text-[1rem] leading-7 text-[var(--muted-strong)]">
              Privilegiamo tool con casi d&apos;uso chiari, link ufficiali, valore pratico
              e una qualita&apos; percepita alta per founder, creator e team.
            </p>
            <Link
              href="/archivio"
              className="mt-5 inline-flex rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Vedi i Toools attuali
            </Link>
          </div>
        </div>
      </section>

      <RequestToolForm />
    </div>
  );
}
