import Link from "next/link";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";
import { SectionHeader } from "@/components/ui/section-header";
import { ButtonLink } from "@/components/ui/button";
import {
  getBlogPosts,
  getFeaturedEditorialPosts,
  getGuidePosts,
  getToolWriteupPosts,
} from "@/lib/data/public-articles";

export const metadata = {
  title: "Post",
  description: "Guide, note editoriali e analisi TooolVibes sui tool da provare.",
  alternates: { canonical: "/posts" },
};

const curationCriteria = [
  "Valore rapido",
  "Chiarezza",
  "Interoperabilità",
  "Prezzo sensato",
  "Privacy",
];

export default async function PostsPage() {
  const [featuredPosts, blogPosts, toolWriteups, guides] = await Promise.all([
    getFeaturedEditorialPosts(3),
    getBlogPosts(),
    getToolWriteupPosts(),
    getGuidePosts(),
  ]);

  return (
    <div className="tone-screen page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="brand-panel brand-aura panel-lift section-stage relative overflow-hidden rounded-[36px] p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_74%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_84%_18%,rgba(99,50,255,0.16),transparent_34%),radial-gradient(ellipse_at_14%_28%,rgba(68,220,255,0.12),transparent_32%)]" />
        <div className="absolute inset-x-5 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent)]" />

        <div className="editorial-grid relative items-start gap-y-6">
          <div className="col-span-12 lg:col-span-8">
            <SectionHeader
              eyebrow="Approfondimenti"
              title="Guide e articoli per capire meglio cosa scegliere."
              description="Qui non trovi un magazine generico: trovi letture brevi, guide e approfondimenti collegati ai tool, alle raccolte e ai casi d'uso più concreti."
            />

            <div className="metadata-block mt-4 rounded-[24px] px-4.5 py-4">
              <p className="brand-kicker">Come li leggiamo</p>
              <p className="mt-2.5 max-w-[42rem] text-[0.98rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                Gli approfondimenti sui tool ti portano dal catalogo a un giudizio più chiaro. Le guide spiegano temi, flussi e scelte di prodotto senza farti ricominciare la ricerca da zero.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href="/archivio" variant="secondary">
                  Apri l&apos;archivio
                </ButtonLink>
                <ButtonLink href="/collections" variant="secondary">
                  Vai alle raccolte
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="dark-panel panel-lift rounded-[28px] p-4.5 sm:p-5 lg:ml-4">
              <div>
                <p className="editorial-label !text-white/60">Contenuti attivi</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">Blog</p>
                    <p className="mt-2 text-[1.8rem] leading-none text-white">{blogPosts.length}</p>
                  </div>
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">Approfondimenti tool</p>
                    <p className="mt-2 text-[1.8rem] leading-none text-white">{toolWriteups.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="editorial-label !text-white/60">Criteri di lettura</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {curationCriteria.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/72"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="tone-issue page-shell home-section-gap">
        <div className="dark-panel brand-aura section-stage rounded-[38px] p-6 sm:p-8 lg:p-9">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="editorial-label !text-white/58">In evidenza</p>
              <p className="text-display-card mt-2.5 max-w-none text-[1.4rem] text-white sm:max-w-[24ch] sm:text-[1.72rem] sm:text-balance">
                Tre approfondimenti che fanno capire subito il taglio editoriale di TooolVibes.
              </p>
            </div>
            <Link
              href="#legacy-guides"
              className="selection-chip rounded-full border px-4 py-2 text-sm font-semibold text-white/86"
              style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)" }}
            >
              Vai alle guide
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((post) => (
              <EditorialPostCard key={post.slug} post={post} className="h-full" />
            ))}
          </div>
        </div>
      </section>

      {blogPosts.length > 0 ? (
        <section className="page-shell home-section-gap">
          <div className="brand-panel panel-lift rounded-[34px] p-5 sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Blog"
              title="Articoli pubblicati da TooolVibes."
              description="Contenuti originali, aggiornamenti e letture nate per aiutarti a scegliere con più criterio."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {blogPosts.map((post) => (
                <EditorialPostCard key={post.slug} post={post} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-shell home-section-gap">
        <div className="brand-panel panel-lift rounded-[34px] p-5 sm:p-7 lg:p-8">
          <SectionHeader
            eyebrow="Approfondimenti tool"
            title="Gli approfondimenti collegati ai tool già presenti nel catalogo."
            description="Ogni articolo aggiunge contesto alla scheda del tool: non una duplicazione, ma una lettura più chiara del perché può servirti."
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
          <SectionHeader
            eyebrow="Guide"
            title="Le guide più utili, riscritte per il TooolVibes di oggi."
            description="Recuperiamo i pezzi ancora validi e li rendiamo più chiari, pratici e coerenti con il catalogo attuale."
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
