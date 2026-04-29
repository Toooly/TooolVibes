import Link from "next/link";

import type { EditorialPostRecord } from "@/lib/types/article";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";

type HomeEditorialPostsSectionProps = {
  posts: EditorialPostRecord[];
};

const curationCriteria = [
  "Speed-to-value",
  "Clarity",
  "Interoperabilita`",
  "Pricing sanity",
  "Privacy",
];

export function HomeEditorialPostsSection({ posts }: HomeEditorialPostsSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="tone-issue page-shell home-section-gap">
      <div className="dark-panel brand-aura section-stage rounded-[38px] p-6 sm:p-8 lg:p-9">
        <div className="editorial-grid items-start gap-y-6">
          <div className="col-span-12 lg:col-span-5">
            <SectionHeading
              eyebrow="Approfondimenti importati"
              title="Il vecchio contenuto editoriale, ripulito e rimesso al suo posto."
              description="Qui vivono i writeup dei tool e le guide legacy: non un blog generico, ma un layer che aiuta a leggere meglio archivio, profili e collection."
              invert
            />

            <div className="discovery-strip-dark mt-6 rounded-[28px] p-4.5">
              <p className="editorial-label !text-white/60">Come li scegliamo</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {curationCriteria.map((item) => (
                  <span
                    key={item}
                    className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/84"
                    style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/72">
                Recuperiamo il framing utile e scartiamo il rumore: resta solo ci? che aiuta a capire il prodotto, non a decorarlo.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/posts">Vai a tutti gli approfondimenti</ButtonLink>
              <Link href="/archivio" className="section-quiet-link text-sm font-semibold text-white/82">
                Torna all&apos;archivio
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="tool-rail -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 sm:hidden">
              {posts.map((post) => (
                <div key={post.slug} className="w-[19.25rem] shrink-0 snap-start">
                  <EditorialPostCard post={post} compact />
                </div>
              ))}
            </div>

            <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <EditorialPostCard key={post.slug} post={post} compact />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
