import Link from "next/link";

import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { DirectoryHero } from "@/components/directory/directory-hero";
import { DirectoryWeeklySpotlight } from "@/components/directory/directory-weekly-spotlight";
import {
  directoryTools,
  getFeaturedDirectoryTools,
  getToolOfTheWeek,
} from "@/lib/data/tooolvibes-directory";

export default function HomePage() {
  const weeklyTool = getToolOfTheWeek();
  const supportingTools = getFeaturedDirectoryTools(4).filter(
    (tool) => tool.slug !== weeklyTool?.slug,
  );

  return (
    <div className="space-y-10 pb-16 sm:space-y-14 sm:pb-20">
      <DirectoryHero tools={directoryTools} />

      {weeklyTool ? (
        <DirectoryWeeklySpotlight
          weeklyTool={weeklyTool}
          supportingTools={supportingTools.slice(0, 3)}
        />
      ) : null}

      <section id="toools" className="page-shell">
        <div className="rounded-[36px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(246,242,255,0.9))] px-5 py-6 shadow-[0_24px_70px_rgba(37,21,102,0.08)] sm:px-7 sm:py-8">
          <DirectoryBrowser
            tools={directoryTools}
            eyebrow="Tutti i Toools"
            title="Scopri tutti i Toools che abbiamo selezionato per te."
            description="Una vista più chiara e moderna del catalogo TooolVibes: ricerca client-side, filtri utili, card curate e link pronti al click."
          />
        </div>
      </section>

      <section className="page-shell">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[34px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_22px_64px_rgba(35,18,95,0.08)] sm:p-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Wishlist
            </p>
            <h2 className="mt-3 text-[1.8rem] leading-[0.98] text-[var(--foreground)] sm:text-[2.4rem]">
              Hai trovato un tool che manca?
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-[var(--muted-strong)]">
              Suggerisci nuovi AI tool, SaaS, no-code builder o automazioni e aiutaci a
              rendere la directory sempre pi&ugrave; utile.
            </p>
            <Link
              href="/wishlist"
              className="mt-5 inline-flex rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)]"
            >
              Suggerisci un Toool
            </Link>
          </article>

          <article className="rounded-[34px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#18112f,#24144f)] p-5 text-white shadow-[0_22px_64px_rgba(18,10,51,0.2)] sm:p-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/60">
              Community
            </p>
            <h2 className="mt-3 text-[1.8rem] leading-[0.98] sm:text-[2.4rem]">
              Una directory viva, curata con criterio.
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-white/74">
              Use case, tool emergenti e workflow pratici entrano in TooolVibes solo
              quando hanno valore reale per chi costruisce.
            </p>
            <Link
              href="/community"
              className="mt-5 inline-flex rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
            >
              Vai alla community
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
