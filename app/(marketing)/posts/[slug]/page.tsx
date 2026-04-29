import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { getCollectionBySlug } from "@/lib/data/public-collections";
import {
  getEditorialPostBySlug,
  getPublishedEditorialPosts,
} from "@/lib/data/public-articles";
import { getCollectionsByToolSlug } from "@/lib/data/public-collections";
import { getToolBySlug } from "@/lib/data/public-tools";
import type { CuratedCollection } from "@/lib/types/collection";
import { formatItalianDate } from "@/lib/utils";

type EditorialPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditorialPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: `${post.title} | ${siteConfig.name}`,
      description: post.summary,
    },
  };
}

export default async function EditorialPostPage({ params }: EditorialPostPageProps) {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const editorialPosts = await getPublishedEditorialPosts();
  const guideCount = editorialPosts.filter((item) => item.kind === "guide").length;
  const writeupCount = editorialPosts.filter((item) => item.kind === "tool-writeup").length;

  let tool: Awaited<ReturnType<typeof getToolBySlug>> = null;
  let relatedCollections: CuratedCollection[] = [];

  if (post.tool_slug) {
    [tool, relatedCollections] = await Promise.all([
      getToolBySlug(post.tool_slug),
      getCollectionsByToolSlug(post.tool_slug),
    ]);
  } else {
    relatedCollections = (
      await Promise.all(
        (post.related_collection_slugs ?? []).map((collectionSlug) => getCollectionBySlug(collectionSlug)),
      )
    ).filter((collection): collection is CuratedCollection => Boolean(collection));
  }

  const sourceHref = post.source_url;
  const sourceLabel = post.tool_slug ? "Legacy tool writeup" : "Legacy guide";

  return (
    <div className="tone-issue page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="dark-panel brand-aura section-stage group relative overflow-hidden rounded-[36px]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_72%)]" />
        <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-[rgba(112,82,255,0.16)] blur-3xl" />
        <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-[rgba(68,220,255,0.12)] blur-3xl" />

        <div className="editorial-grid relative gap-y-0">
          <div className={tool ? "col-span-12 p-5 sm:p-6 lg:col-span-7 lg:p-7" : "col-span-12 p-5 sm:p-6 lg:p-7"}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill !bg-white/12 !text-white">{post.kind === "tool-writeup" ? "Approfondimento tool" : "Guida legacy"}</span>
              <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                {post.source_label}
              </span>
              <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                {formatItalianDate(post.published_at)}
              </span>
            </div>

            <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/56">
              Importato nel layer contenuti di TooolVibes
            </p>
            <h1 className="text-display-hero mt-3 max-w-none text-[2.02rem] text-white sm:max-w-[14ch] sm:text-[2.76rem] sm:text-balance">
              {post.title}
            </h1>
            <p className="mt-4 max-w-[44rem] text-[0.98rem] leading-7 text-white/78">
              {post.summary}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {post.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/84"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {tool ? (
                <ButtonLink href={`/toools/${tool.slug}`}>Apri il tool</ButtonLink>
              ) : null}
              <ButtonLink href="/archivio" variant="secondary">
                Apri l&apos;archivio
              </ButtonLink>
              <ButtonLink href="/collections" variant="secondary">
                Vai alle collection
              </ButtonLink>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            {tool ? (
              <div className="relative h-full min-h-[22rem] overflow-hidden lg:min-h-[100%]">
                <Image
                  src={tool.cover_image_url}
                  alt={tool.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="image-float object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.08),rgba(18,15,35,0.72))]" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <span className="selection-chip rounded-full border border-white/18 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white" style={{ background: "rgba(24,17,12,0.28)" }}>
                    Profilo collegato
                  </span>
                  <span className="selection-chip rounded-full border border-white/18 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                    {tool.category}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/12 bg-[rgba(15,12,31,0.36)] px-4 py-4 backdrop-blur-sm">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                    Perché conta
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/82">
                    {tool.best_for ?? tool.short_description_it}
                  </p>
                  <p className="mt-3 text-[0.82rem] leading-6 text-white/66">
                    {tool.why_here ?? tool.description_it}
                  </p>
                </div>
              </div>
            ) : (
              <div className="brand-panel panel-lift flex h-full min-h-[22rem] flex-col justify-between rounded-[32px] p-5 sm:p-6">
                <div>
                  <p className="editorial-label">Guida legacy</p>
                  <h2 className="text-display-card mt-3 text-[1.62rem] sm:text-[1.9rem] sm:text-balance">
                    Una lettura importata per mantenere vivo il contenuto storico senza il tono da demo.
                  </h2>
                  <p className="mt-3 text-[0.98rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                    Questa guida conserva il valore editoriale del vecchio sito ma entra qui con una gerarchia molto pi? chiara.
                  </p>
                </div>

                <div className="metadata-block rounded-[24px] px-4.5 py-4">
                  <p className="brand-kicker">Source</p>
                  <p className="mt-2.5 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                    {sourceLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                    {formatItalianDate(post.published_at)} · {guideCount} guide legacy · {writeupCount} writeup tool
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="editorial-grid gap-y-4">
        <div className="col-span-12 lg:col-span-7">
          <div className="brand-panel panel-lift rounded-[32px] p-5 sm:p-6">
            <SectionHeading
              eyebrow="Lettura"
              title="Il contenuto qui non parla da solo: ti porta verso il prossimo passo."
              description="Ogni blocco serve a ridurre rumore e aiutare il salto giusto tra approfondimento, archivio, shortlist e collection."
            />

            <div className="mt-5 grid gap-3.5">
              {post.details.map((item, index) => (
                <div
                  key={item}
                  className="stat-block rounded-[22px] border px-4 py-4"
                  style={{
                    borderColor: "var(--line)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))",
                  }}
                >
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-body-strong text-[0.98rem]">{item}</p>
                </div>
              ))}
            </div>

            {post.cautions.length > 0 ? (
              <div
                className="mt-5 rounded-[26px] border px-5 py-5"
                style={{
                  borderColor: "rgba(212,177,101,0.28)",
                  background: "linear-gradient(180deg, rgba(255,249,240,0.96), rgba(249,239,212,0.74))",
                }}
              >
                <p className="brand-kicker">Limiti / attenzione</p>
                <div className="mt-3 grid gap-3">
                  {post.cautions.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border px-4 py-3.5"
                      style={{ borderColor: "rgba(212,177,101,0.22)", background: "rgba(255,255,255,0.56)" }}
                    >
                      <p className="text-body-strong text-[0.95rem]" style={{ color: "var(--muted-strong)" }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="space-y-3 lg:sticky lg:top-28">
            <div className="dark-panel panel-lift rounded-[28px] p-4 sm:p-5">
              <p className="editorial-label !text-white/60">Connessioni</p>
              <p className="text-display-card mt-3 max-w-none text-[1.5rem] text-white sm:max-w-[16ch] sm:text-balance">
                Parti da qui, poi torna dentro il sistema.
              </p>
              <div className="mt-5 grid gap-3">
                {tool ? (
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                      Tool collegato
                    </p>
                    <p className="text-meta mt-2 text-[0.96rem] text-white">{tool.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink href={`/toools/${tool.slug}`} variant="secondary" className="sm:min-w-0">
                        Apri profilo
                      </ButtonLink>
                      <Link
                        href={tool.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="section-quiet-link text-sm font-semibold text-white/82"
                      >
                        Vai al sito
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                    Fonte legacy
                  </p>
                  <Link
                    href={sourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-meta mt-2 block text-[0.96rem] text-white"
                  >
                    Apri la pagina originale
                  </Link>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="editorial-label !text-white/60">Prossimo passo</p>
                <div className="mt-3 flex flex-col gap-3">
                  <ButtonLink href="/shortlist" variant="secondary">
                    Porta il tema in shortlist
                  </ButtonLink>
                  <ButtonLink href="/compare" variant="secondary">
                    Confronta il contesto
                  </ButtonLink>
                </div>
              </div>
            </div>

            {relatedCollections.length > 0 ? (
              <div className="brand-panel panel-lift rounded-[28px] p-4 sm:p-4.5">
                <p className="editorial-label">Collection collegate</p>
                <div className="mt-4 grid gap-3">
                  {relatedCollections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="editorial-label">{collection.cover_kicker}</p>
                      <p className="text-display-card mt-2 text-[1.12rem]">{collection.title}</p>
                      <p className="mt-2 hidden text-sm leading-6 sm:block" style={{ color: "var(--muted-strong)" }}>
                        {collection.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
