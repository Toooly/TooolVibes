import Link from "next/link";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import {
  getFeaturedEditorialPosts,
  getGuidePosts,
  getToolWriteupPosts,
} from "@/lib/data/public-articles";

const curationCriteria = [
  "Speed-to-value",
  "Clarity",
  "Interoperabilita`",
  "Pricing sanity",
  "Privacy",
];

export default async function PostsPage() {
  const [featuredPosts, toolWriteups, guides] = await Promise.all([
    getFeaturedEditorialPosts(3),
    getToolWriteupPosts(),
    getGuidePosts(),
  ]);

  return (
    <div className="tone-screen page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="brand-panel brand-aura panel-lift section-stage relative overflow-hidden rounded-[36px] p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_74%)]" />
        <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-[rgba(99,50,255,0.12)] blur-3xl" />
        <div className="absolute left-10 top-16 h-20 w-20 rounded-full bg-[rgba(68,220,255,0.1)] blur-3xl" />

        <div className="editorial-grid relative items-start gap-y-6">
          <div className="col-span-12 lg:col-span-8">
            <SectionHeading
              eyebrow="Approfondimenti"
              title="Il contenuto legacy importato, ripulito e messo nel sistema giusto."
              description="Qui non trovi un magazine generico: trovi i writeup dei tool e le guide storiche che aiutano a leggere meglio archive, tool profile, collections e premium."
            />

            <div className="metadata-block mt-4 rounded-[24px] px-4.5 py-4">
              <p className="brand-kicker">Come li leggiamo</p>
              <p className="mt-2.5 max-w-[42rem] text-[0.98rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                I writeup tool ti portano dal catalogo al giudizio. Le guide legacy servono a spiegare un tema, un flusso o una scelta di prodotto senza aprire una nuova area del sistema.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href="/archivio" variant="secondary">
                  Apri l&apos;archivio
                </ButtonLink>
                <ButtonLink href="/collections" variant="secondary">
                  Vai alle collection
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-3 lg:pl-4">
              <div className="dark-panel panel-lift rounded-[28px] p-4.5 sm:p-5">
                <p className="editorial-label !text-white/60">Importi attivi</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">Tool writeup</p>
                    <p className="mt-2 text-[1.8rem] leading-none text-white">{toolWriteups.length}</p>
                  </div>
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">Guide legacy</p>
                    <p className="mt-2 text-[1.8rem] leading-none text-white">{guides.length}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {curationCriteria.map((item) => (
                  <div
                    key={item}
                    className="stat-block rounded-[22px] border p-3.5"
                    style={{
                      borderColor: "var(--line)",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))",
                    }}
                  >
                    <p className="editorial-label">{item}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                      Resta dentro del prodotto solo se aiuta a scegliere meglio e piu` in fretta.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tone-issue page-shell home-section-gap">
        <div className="dark-panel brand-aura section-stage rounded-[38px] p-6 sm:p-8 lg:p-9">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="editorial-label !text-white/58">Featured</p>
              <p className="text-display-card mt-2.5 max-w-none text-[1.4rem] text-white sm:max-w-[18ch] sm:text-[1.72rem] sm:text-balance">
                Tre approfondimenti che fanno capire subito il taglio del layer editoriale.
              </p>
            </div>
            <Link
              href="#legacy-guides"
              className="selection-chip rounded-full border px-4 py-2 text-sm font-semibold text-white/86"
              style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)" }}
            >
              Vai alle guide legacy
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((post) => (
              <EditorialPostCard key={post.slug} post={post} className="h-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell home-section-gap">
        <div className="brand-panel panel-lift rounded-[34px] p-5 sm:p-7 lg:p-8">
          <SectionHeading
            eyebrow="Tool writeup"
            title="Gli articoli collegati ai tool gia` presenti nel catalogo."
            description="Ogni scheda prende il contenuto editoriale del tool e lo rimette in forma di lettura: non duplicazione, ma accesso piu` chiaro."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {toolWriteups.map((post) => (
              <EditorialPostCard key={post.slug} post={post} compact />
            ))}
          </div>
        </div>
      </section>

      <section id="legacy-guides" className="page-shell home-section-gap">
        <div className="brand-panel panel-lift rounded-[34px] p-5 sm:p-7 lg:p-8">
          <SectionHeading
            eyebrow="Guide legacy"
            title="Le guide storiche ripulite e riallineate al prodotto attuale."
            description="Qui recuperiamo i pezzi piu` utili del vecchio sito senza portarci dietro il tono da demo o il framing promozionale troppo pesante."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((post) => (
              <EditorialPostCard key={post.slug} post={post} compact />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
