import Link from "next/link";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";
import { ProgressiveEditorialList } from "@/components/editorial/progressive-editorial-list";
import { RouteMarker } from "@/components/ui/route-marker";
import { SectionHeader } from "@/components/ui/section-header";
import { ButtonLink } from "@/components/ui/button";
import {
  getBlogPosts,
  getFeaturedEditorialPosts,
  getGuidePosts,
  getToolWriteupPosts,
} from "@/lib/data/public-articles";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicPageMetadata({
  title: "Post",
  description: "Guide, note editoriali e analisi TooolVibes sui tool da provare.",
  path: "/posts",
});

export const revalidate = 3600;

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
  const featuredSlugs = new Set(featuredPosts.map((post) => post.slug));
  const remainingBlogPosts = blogPosts.filter(
    (post) => !featuredSlugs.has(post.slug),
  );
  const remainingToolWriteups = toolWriteups.filter(
    (post) => !featuredSlugs.has(post.slug),
  );
  const remainingGuides = guides.filter(
    (post) => !featuredSlugs.has(post.slug),
  );
  const hasAny =
    guides.length > 0 || toolWriteups.length > 0 || blogPosts.length > 0;
  const [heroPost, ...supportingPosts] = featuredPosts;

  return (
    <div className="posts-page tone-screen page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      {/* ═══════════════════════════════════════════════════════════
          1. Editorial masthead
          ═══════════════════════════════════════════════════════════ */}
      <section className="posts-masthead brand-panel section-stage relative overflow-hidden rounded-[36px] p-4 sm:p-6 lg:p-7">
        <div className="editorial-grid items-start gap-y-6">
          <div className="col-span-12 lg:col-span-8">
            <RouteMarker
              index="08"
              label="Archivio editoriale"
              status={`${blogPosts.length + toolWriteups.length + guides.length} letture`}
              density="hero"
              className="mb-3 sm:mb-5"
            />
            <SectionHeader
              as="h1"
              eyebrow="Approfondimenti"
              title="Guide e articoli per capire meglio cosa scegliere."
              description="Qui non trovi un magazine generico: trovi letture brevi, guide e approfondimenti collegati ai tool, alle raccolte e ai casi d'uso più concreti."
            />

            <div className="metadata-block mt-3 rounded-[24px] px-4 py-3.5 sm:mt-4 sm:px-4.5 sm:py-4">
              <p className="brand-kicker">Come li leggiamo</p>
              <p
                className="mt-2.5 max-w-[42rem] text-[0.9375rem] leading-[1.5] sm:text-[0.98rem] sm:leading-7"
                style={{ color: "var(--muted-strong)" }}
              >
                Gli approfondimenti sui tool ti portano dal catalogo a un
                giudizio pi&ugrave; chiaro. Le guide spiegano temi, flussi
                e scelte di prodotto senza farti ricominciare la ricerca da
                zero.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                <ButtonLink
                  href="/archivio"
                  variant="secondary"
                  className="min-w-0 px-2 text-[0.8125rem] sm:text-[0.95rem]"
                >
                  Apri l&apos;archivio
                </ButtonLink>
                <ButtonLink
                  href="/collections"
                  variant="secondary"
                  className="min-w-0 px-2 text-[0.8125rem] sm:text-[0.95rem]"
                >
                  Vai alle raccolte
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="dark-panel rounded-[28px] p-4 sm:p-5 lg:ml-4">
              {hasAny ? (
                <div>
                  <p className="editorial-label !text-white/60">
                    Contenuti attivi
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    {guides.length > 0 ? (
                      <Link
                        href="#guide"
                        className="discovery-strip-dark rounded-[22px] px-2 py-3 sm:px-4 sm:py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                          Guide
                        </p>
                        <p className="mt-2 text-[1.5rem] leading-none text-white sm:text-[1.8rem]">
                          {guides.length}
                        </p>
                      </Link>
                    ) : null}
                    {toolWriteups.length > 0 ? (
                      <Link
                        href="#analisi"
                        className="discovery-strip-dark rounded-[22px] px-2 py-3 sm:px-4 sm:py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                          Analisi tool
                        </p>
                        <p className="mt-2 text-[1.5rem] leading-none text-white sm:text-[1.8rem]">
                          {toolWriteups.length}
                        </p>
                      </Link>
                    ) : null}
                    {blogPosts.length > 0 ? (
                      <Link
                        href="#blog"
                        className="discovery-strip-dark rounded-[22px] px-2 py-3 sm:px-4 sm:py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                          Blog
                        </p>
                        <p className="mt-2 text-[1.5rem] leading-none text-white sm:text-[1.8rem]">
                          {blogPosts.length}
                        </p>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border-t border-white/10 pt-3.5 sm:mt-5 sm:pt-4">
                <p className="editorial-label !text-white/60">
                  Criteri di lettura
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {curationCriteria.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tv-ink-secondary)]"
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

      {/* ═══════════════════════════════════════════════════════════
          2. Featured: one dominant article + two supporting
          ═══════════════════════════════════════════════════════════ */}
      {featuredPosts.length > 0 ? (
        <section className="home-section-gap">
          <div className="posts-featured-panel section-stage rounded-[38px] p-6 sm:p-8 lg:p-9">
            <h2 className="editorial-label !text-white/58 mb-5">
              In evidenza editoriale
            </h2>

            <div className="flex flex-col gap-4">
              {/* Hero — dominant featured article */}
              {heroPost ? (
                <EditorialPostCard
                  key={heroPost.slug}
                  post={heroPost}
                  variant="hero"
                  className="h-full"
                />
              ) : null}

              {/* Supporting — two featured stories */}
              {supportingPosts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {supportingPosts.map((post) => (
                    <EditorialPostCard
                      key={post.slug}
                      post={post}
                      variant="card"
                      className="h-full"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          3. Guides — compact editorial rows
          ═══════════════════════════════════════════════════════════ */}
      {remainingGuides.length > 0 ? (
        <section id="guide" className="home-section-gap">
          <div className="brand-panel rounded-[34px] p-5 sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Guide"
              title="Le guide pi&ugrave; utili, riscritte per il TooolVibes di oggi."
              description="Recuperiamo i pezzi ancora validi e li rendiamo pi&ugrave; chiari, pratici e coerenti con il catalogo attuale."
            />
            <ProgressiveEditorialList
              listId="posts-guide-list"
              posts={remainingGuides}
              sectionLabel="guide"
            />
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          4. Tool insights — compact tool-oriented entries
          ═══════════════════════════════════════════════════════════ */}
      {remainingToolWriteups.length > 0 ? (
        <section id="analisi" className="home-section-gap">
          <div className="brand-panel rounded-[34px] p-5 sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Analisi tool"
              title="Gli approfondimenti collegati ai tool gi&agrave; presenti nel catalogo."
              description="Ogni articolo aggiunge contesto alla scheda del tool: non una duplicazione, ma una lettura pi&ugrave; chiara del perch&eacute; pu&ograve; servirti."
            />
            <ProgressiveEditorialList
              listId="posts-tool-writeup-list"
              posts={remainingToolWriteups}
              sectionLabel="approfondimenti"
            />
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          5. Blog — progressive disclosure
          ═══════════════════════════════════════════════════════════ */}
      {remainingBlogPosts.length > 0 ? (
        <section id="blog" className="home-section-gap">
          <div className="brand-panel rounded-[34px] p-5 sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Blog"
              title="Articoli pubblicati da TooolVibes."
              description="Contenuti originali, aggiornamenti e letture nate per aiutarti a scegliere con pi&ugrave; criterio."
            />
            <ProgressiveEditorialList
              listId="posts-blog-list"
              posts={remainingBlogPosts}
              sectionLabel="articoli"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
