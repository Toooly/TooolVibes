import Link from "next/link";

import type { ToolRecord } from "@/lib/types/tool";

import { ToolCard } from "@/components/tools/tool-card";

type FeaturedWeekProps = {
  tools: ToolRecord[];
};

export function FeaturedWeek({ tools }: FeaturedWeekProps) {
  const visibleTools = tools.slice(0, 2);

  return (
    <section id="toools-della-settimana" className="tone-focus page-shell home-section-gap">
      <div className="dark-panel brand-aura section-stage focus-stage group rounded-[38px] p-5 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="editorial-label !text-white/58">Focus settimanale</p>
            <p className="text-display-card mt-2.5 max-w-none text-[1.34rem] text-white sm:max-w-[15ch] sm:text-[1.62rem] sm:text-balance">
              Due ingressi forti da guardare prima del resto.
            </p>
          </div>
          <Link
            href="/archivio"
            className="section-quiet-link text-sm font-semibold text-white/86"
            style={{
              color: "white",
            }}
          >
            Apri l&apos;archivio completo
          </Link>
        </div>

        <div className="editorial-grid items-start gap-y-5">
          <div className="col-span-12 lg:col-span-4">
            <p className="brand-kicker !text-white/62">Radar corto</p>
            <p className="mt-3 max-w-[28rem] text-sm leading-7 text-white/72">
              Se uno di questi tiene, esci dalla home con una direzione gia` credibile. Se no, il posto giusto resta archivio.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-8">
            {visibleTools.length > 0 ? (
              <>
                <div className="tool-rail -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 sm:hidden">
                  {visibleTools.map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="compact"
                      priority
                      index={index}
                      contextLabel="Focus settimanale"
                      swipeFriendly
                    />
                  ))}
                </div>
                <div className="hidden gap-4 sm:grid xl:grid-cols-2">
                  {visibleTools.map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="compact"
                      priority
                      index={index}
                      contextLabel="Focus settimanale"
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                className="rounded-[28px] border px-6 py-10 text-center"
                style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)" }}
              >
                <h3 className="text-2xl text-white">Il radar settimanale e` in aggiornamento.</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Quando non c&apos;e` ancora un focus attivo, il resto dell&apos;archivio resta comunque il punto giusto da cui partire.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
