import Link from "next/link";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryHeroProps = {
  tools: DirectoryTool[];
};

export function DirectoryHero({ tools }: DirectoryHeroProps) {
  const previewTools = tools.slice(0, 4);

  return (
    <section className="page-shell pt-3 sm:pt-5">
      <div className="relative overflow-hidden rounded-[40px] border border-[rgba(83,63,170,0.14)] bg-[linear-gradient(135deg,#fefcff_0%,#f6f1ff_42%,#eef2ff_100%)] px-5 py-6 shadow-[0_28px_80px_rgba(40,22,110,0.1)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_72%)]" />
        <div className="absolute -left-10 top-14 h-40 w-40 rounded-full bg-[rgba(109,59,255,0.12)] blur-3xl" />
        <div className="absolute right-[-3rem] top-8 h-52 w-52 rounded-full bg-[rgba(67,198,255,0.14)] blur-3xl" />
        <div className="absolute bottom-[-2rem] left-[42%] h-44 w-44 rounded-full bg-[rgba(143,101,255,0.14)] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:items-center">
          <div className="max-w-[44rem]">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Welcome to TooolVibes
            </p>
            <h1 className="mt-4 max-w-[14ch] text-[2.5rem] leading-[0.94] text-[var(--foreground)] sm:text-[3.6rem] lg:text-[4.4rem]">
              Scopri i migliori Toools per creare, automatizzare e lanciare più velocemente.
            </h1>
            <p className="mt-5 max-w-[40rem] text-[1.02rem] leading-7 text-[var(--muted-strong)] sm:text-[1.08rem]">
              Una directory premium e curata di tool AI, no-code e vibe coding. Pochi nomi,
              contesto utile, CTA chiare e link già pronti per passare dal browsing al test.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/archivio"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3.5 text-sm font-semibold shadow-[0_16px_32px_rgba(95,66,255,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
                style={{ color: "#ffffff" }}
              >
                Scopri i Toools
              </Link>
              <Link
                href="/account#account-upgrade"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(83,63,170,0.12)] bg-white/84 px-5 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Iscriviti
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                `${tools.length} tool curati`,
                "Link esterni verificati",
                "Ricerca client-side e filtri rapidi",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(83,63,170,0.1)] bg-white/78 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/82 p-4 shadow-[0_22px_60px_rgba(38,22,108,0.12)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.92)] px-4 py-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Directory snapshot
                </p>
                <p className="mt-1 text-sm text-[var(--muted-strong)]">
                  Builder, no-code, headless CMS e UI tools in una vista sola.
                </p>
              </div>
              <span className="rounded-full bg-[rgba(109,59,255,0.12)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                Premium
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {previewTools.map((tool) => (
                <div
                  key={tool.slug}
                  className="flex h-full flex-col rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-white/84 p-4 shadow-[0_14px_30px_rgba(40,22,108,0.08)]"
                  style={{
                    background: `radial-gradient(circle at top right, ${tool.accentFrom}1f, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,241,255,0.92))`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <DirectoryToolGlyph tool={tool} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {tool.category}
                      </p>
                      <p className="mt-1 text-[1rem] font-semibold text-[var(--foreground)]">
                        {tool.name}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[var(--muted-strong)]">
                    {tool.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(83,63,170,0.08)] pt-3 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    <span>{formatItalianDate(tool.publishedAt)}</span>
                    <span>{tool.readingTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
