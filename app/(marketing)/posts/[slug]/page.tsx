import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReadingProgressBar } from "@/components/posts/reading-progress-bar";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { ButtonLink } from "@/components/ui/button";
import { MarkdownContent } from "@/components/editorial/markdown-content";
import {
  ContextualPartnerBlock,
  PartnerToolCard,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";
import { JsonLd } from "@/components/seo/json-ld";
import { RouteMarker } from "@/components/ui/route-marker";
import { siteConfig } from "@/lib/config/site";
import { getCollectionBySlug } from "@/lib/data/public-collections";
import {
  getEditorialPostBySlug,
} from "@/lib/data/public-articles";
import { getCollectionsByToolSlug } from "@/lib/data/public-collections";
import { getToolBySlug } from "@/lib/data/public-tools";
import {
  createPublicPageMetadata,
  defaultSocialImage,
} from "@/lib/seo/metadata";
import type { CuratedCollection } from "@/lib/types/collection";
import { formatItalianDate } from "@/lib/utils";

type EditorialPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;



const kindLabels: Record<NonNullable<Awaited<ReturnType<typeof getEditorialPostBySlug>>>["kind"], string> = {
  "tool-writeup": "Analisi tool",
  guide: "Guida",
  editorial: "Blog",
};

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) {
    return false;
  }

  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: EditorialPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);

  if (!post) {
    return {};
  }

  return createPublicPageMetadata({
    title: post.title,
    description: post.summary,
    path: `/posts/${post.slug}`,
    type: "article",
    image: post.cover_image_url
      ? {
          url: post.cover_image_url,
          alt: post.cover_image_alt ?? post.title,
        }
      : defaultSocialImage,
  });
}

export default async function EditorialPostPage({ params }: EditorialPostPageProps) {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Keep detail rendering bounded for Worker CPU: one post fetch already done,
  // optional related tool/collections only, no full catalog recount on every hit.
  let tool: Awaited<ReturnType<typeof getToolBySlug>> = null;
  let relatedCollections: CuratedCollection[] = [];

  if (post.tool_slug) {
    [tool, relatedCollections] = await Promise.all([
      getToolBySlug(post.tool_slug),
      getCollectionsByToolSlug(post.tool_slug),
    ]);
  } else if ((post.related_collection_slugs ?? []).length > 0) {
    relatedCollections = (
      await Promise.all(
        (post.related_collection_slugs ?? [])
          .slice(0, 4)
          .map((collectionSlug) => getCollectionBySlug(collectionSlug)),
      )
    ).filter((collection): collection is CuratedCollection => Boolean(collection));
  }

  const sourceHref = post.source_url;
  const sourceLabel = post.source_label;
  const isAuthoredPost = Boolean(post.content_markdown);
  const relatedToolHref = tool ? (tool.urls.affiliate ?? tool.urls.website) : null;
  const isRelatedToolAffiliate = Boolean(tool?.urls.affiliate) || hasAffiliateSignal(relatedToolHref);
  const relatedToolRationale = tool?.editorial.evidence.find(
    (item) => item.kind === "rationale" || item.kind === "review",
  )?.text ?? tool?.content.description;
  const kindLabel =
    post.kind === "guide" && post.source_label === "Blog TooolVibes"
      ? "Guida"
      : kindLabels[post.kind];
  const canonicalUrl = `${siteConfig.url}/posts/${post.slug}`;
  const postStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.summary,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        datePublished: post.published_at,
        dateModified: post.updated_at,
        image: post.cover_image_url ?? defaultSocialImage.url,
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "TooolVibes",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guide",
            item: `${siteConfig.url}/posts`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={postStructuredData} />
      <div className="internal-page internal-editorial-page tone-issue page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
        <ReadingProgressBar />
        <section
          data-reading-progress-root
          className="dark-panel section-stage group relative overflow-hidden rounded-[36px]"
        >
        <div className="editorial-grid gap-y-0">
          <div className={tool ? "col-span-12 p-5 sm:p-6 lg:col-span-7 lg:p-7" : "col-span-12 p-5 sm:p-6 lg:p-7"}>
            <RouteMarker
              index={post.kind === "guide" ? "G" : post.kind === "tool-writeup" ? "T" : "E"}
              label={kindLabel}
              status={post.source_label}
              density="editorial"
              className="mb-5"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill !bg-[var(--tv-surface-elevated)] !text-[var(--tv-ink-secondary)]">{kindLabel}</span>
              <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/82">
                {post.source_label}
              </span>
              <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/82">
                {formatItalianDate(post.published_at)}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-white/56">
              {isAuthoredPost ? "Pubblicato nel blog TooolVibes" : "Aggiornato e integrato in TooolVibes"}
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
                  className="rounded-[22px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] px-4 py-4 text-sm leading-6 text-[var(--tv-ink-primary)]"
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
                Vai alle raccolte
              </ButtonLink>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            {tool?.media.coverImageUrl ? (
              <div className="relative h-full min-h-[22rem] overflow-hidden lg:min-h-[100%]">
                <Image
                  src={tool.media.coverImageUrl}
                  alt={tool.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="image-float object-cover"
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <span className="selection-chip rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tv-ink-primary)]">
                    Profilo collegato
                  </span>
                  <span className="selection-chip rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tv-ink-primary)]">
                    {tool.taxonomy.sourceCategoryLabel}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                    Perché conta
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/82">
                    {tool.content.bestFor ?? tool.content.summary}
                  </p>
                  <p className="mt-3 text-[0.82rem] leading-6 text-white/66">
                    {relatedToolRationale}
                  </p>
                </div>
              </div>
            ) : post.cover_image_url ? (
              <div className="relative h-full min-h-[22rem] overflow-hidden lg:min-h-[100%]">
                <Image
                  src={post.cover_image_url}
                  alt={post.cover_image_alt ?? post.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="image-float object-cover"
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                    Cover editoriale
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/82">
                    {post.dek}
                  </p>
                </div>
              </div>
            ) : (
              <div className="brand-panel flex h-full min-h-[22rem] flex-col justify-between rounded-[32px] p-5 sm:p-6">
                <div>
                  <p className="editorial-label">Guida TooolVibes</p>
                  <h2 className="text-display-card mt-3 text-[1.62rem] sm:text-[1.9rem] sm:text-balance">
                    Una lettura aggiornata per mantenere vivo il contenuto utile senza rumore promozionale.
                  </h2>
                  <p className="mt-3 text-[0.98rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                    Questa guida conserva ciò che serve davvero e lo riorganizza in una gerarchia più chiara.
                  </p>
                </div>

                <div className="metadata-block rounded-[24px] px-4.5 py-4">
                  <p className="brand-kicker">Fonte</p>
                  <p className="mt-2.5 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                    {sourceLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
                    {formatItalianDate(post.published_at)} · {kindLabel}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <TinyAdzInlineSlot placement="article-body" />

      <section className="editorial-grid gap-y-4">
        <div className="col-span-12 lg:col-span-7">
          <div className="brand-panel rounded-[32px] p-5 sm:p-6">
            {post.content_markdown ? (
              <MarkdownContent content={post.content_markdown} />
            ) : (
              <>
                <SectionHeader
                  eyebrow="Nel dettaglio"
                  title="Il contenuto qui non parla da solo: ti porta verso il prossimo passo."
                  description="Ogni blocco serve a ridurre rumore e aiutare il salto giusto tra approfondimento, archivio, salvati e raccolte."
                />

                <div className="mt-5 grid gap-3.5">
                  {post.details.map((item, index) => (
                    <div
                      key={item}
                      className="stat-block rounded-[22px] border px-4 py-4"
                      style={{
                        borderColor: "var(--line)",
                        background: "var(--tv-surface-inverted)",
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
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
                      background: "var(--tv-surface-inverted)",
                    }}
                  >
                    <p className="brand-kicker">Limiti / attenzione</p>
                    <div className="mt-3 grid gap-3">
                      {post.cautions.map((item) => (
                        <div
                          key={item}
                          className="rounded-[20px] border px-4 py-3.5"
                          style={{ borderColor: "rgba(212,177,101,0.22)", background: "transparent" }}
                        >
                          <p className="text-body-strong text-[0.95rem]" style={{ color: "var(--muted-strong)" }}>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <ContextualPartnerBlock
            placementKey="guide-inline-promo"
            className="mt-4"
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="space-y-3 lg:sticky lg:top-28">
            <div className="dark-panel rounded-[28px] p-4 sm:p-5">
              <p className="editorial-label !text-white/60">Connessioni</p>
              <p className="text-display-card mt-3 max-w-none text-[1.5rem] text-white sm:max-w-[16ch] sm:text-balance">
                Parti da qui, poi torna dentro il sistema.
              </p>
              <div className="mt-5 grid gap-3">
                {tool ? (
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                      Tool collegato
                    </p>
                    <p className="text-meta mt-2 text-[0.96rem] text-white">{tool.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink href={`/toools/${tool.slug}`} variant="secondary" className="sm:min-w-0">
                        Apri profilo
                      </ButtonLink>
                      {isRelatedToolAffiliate ? (
                        <p className="basis-full text-xs leading-5 text-white/62">
                          Link partner: potremmo ricevere una commissione senza costi extra per te.
                        </p>
                      ) : null}
                      <Link
                        href={relatedToolHref ?? tool.urls.website}
                        target="_blank"
                        rel={
                          isRelatedToolAffiliate
                            ? "sponsored noopener noreferrer"
                            : "noopener noreferrer"
                        }
                        className="section-quiet-link text-sm font-semibold text-white/82"
                      >
                        Vai al sito
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                    Lettura editoriale
                  </p>
                  <div className="mt-3 grid gap-1.5 text-sm leading-6 text-white/70">
                    <p>Pubblicato: {formatItalianDate(post.published_at)}</p>
                    <p>Aggiornato: {formatItalianDate(post.updated_at)}</p>
                    <p>Autore: {post.author_name ?? "TooolVibes"}</p>
                    <p>Revisione editoriale: TooolVibes.</p>
                  </div>
                </div>

                {sourceHref.startsWith("http") ? (
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                      Fonte
                    </p>
                    <Link
                      href={sourceHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-meta mt-2 block text-[0.96rem] text-white"
                    >
                      {sourceLabel}
                    </Link>
                  </div>
                ) : (
                  <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                      Blog
                    </p>
                    <p className="text-meta mt-2 block text-[0.96rem] text-white">
                      {post.author_name ?? "TooolVibes"}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="editorial-label !text-white/60">Prossimo passo</p>
                <div className="mt-3 flex flex-col gap-3">
                  <ButtonLink href="/shortlist" variant="secondary">
                    Porta il tema nei salvati
                  </ButtonLink>
                  <ButtonLink href="/compare" variant="secondary">
                    Confronta il contesto
                  </ButtonLink>
                </div>
              </div>
            </div>

            <PartnerToolCard placementKey="article-sidebar-sponsor" />

            {relatedCollections.length > 0 ? (
              <div className="brand-panel rounded-[28px] p-4 sm:p-4.5">
                <p className="editorial-label">Raccolte collegate</p>
                <div className="mt-4 grid gap-3">
                  {relatedCollections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="metadata-block rounded-[22px] px-4 py-4 transition-colors duration-200 hover:border-[var(--tv-accent-brand)] focus-visible:border-[var(--tv-accent-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-accent-brand)]"
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

            <div className="internal-editorial-page__sponsor-opportunity">
              <SponsorOpportunityLink placementId="posts-sponsor-opportunity" route={`/posts/${slug}`} />
            </div>
          </div>
        </div>
        </section>
      </div>
    </>
  );
}
