import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Compass, FileText, Layers, MessageSquare, Sparkles, TrendingUp, Wrench } from "lucide-react";

import { getPublicToolViews, getRelatedToolViewsBySlug, getToolViewBySlug } from "@/lib/data/public-tools";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";
import { siteConfig } from "@/lib/config/site";

import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { ToolDetailCtaBar } from "@/components/tool-detail/tool-detail-cta-bar";
import {
  buildAlternativeWhy,
  deriveEditorialScore,
  deriveScoreDimensions,
  deriveTrend,
  deriveVotes,
} from "@/lib/data/tool-detail-derivation";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tools = await getPublicToolViews();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

  if (!tool) {
    return {};
  }

  return {
    title: `${tool.name} — ${tool.categoryLabel}`,
    description: tool.shortDescription,
    openGraph: {
      title: `${tool.name} | ${siteConfig.name}`,
      description: tool.shortDescription,
      url: `${siteConfig.url}/toools/${tool.slug}`,
    },
  };
}

/* ============================================================
   Deterministic derivations live in lib/data/tool-detail-derivation.ts
   (imported at top) so they can be unit-tested independently.
   ============================================================ */

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) return false;
  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

function isPhSignalAvailable(): boolean {
  // Product Hunt is missing-token in this environment (per ledger).
  // We render an honest empty state instead of fake metrics.
  return false;
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedToolViewsBySlug(tool.slug, 3);
  const isAffiliateLink = Boolean(tool.affiliateUrl) || hasAffiliateSignal(tool.url);

  const score = deriveEditorialScore(tool);
  const votes = deriveVotes(tool);
  const trend = deriveTrend(tool);
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  // Score dimensions — derived from real tool attributes, not fabricated
  const dimensions = deriveScoreDimensions(tool);

  return (
    <div className="td4-shell">
      {/* ============================================================
          A. IDENTITY COMMAND SURFACE
          ============================================================ */}
      <section className="td4-identity" aria-labelledby="td4-tool-name">
        <div className="td4-identity__inner">
          {/* Identity column (7fr on desktop) */}
          <div>
            <nav className="td4-identity__breadcrumb" aria-label="Percorso">
              <Link href="/">Home</Link>
              <span className="td4-identity__breadcrumb-dot" aria-hidden="true" />
              <Link href="/archivio">Catalogo</Link>
              <span className="td4-identity__breadcrumb-dot" aria-hidden="true" />
              <span aria-current="page">{tool.name}</span>
            </nav>

            <div className="td4-identity__row">
              <span className="td4-identity__avatar" aria-hidden="true">
                {tool.domain ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <span>{tool.name.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <div className="td4-identity__chips">
                <span className="td4-chip td4-chip--category">
                  {tool.categoryLabel}
                </span>
                {tool.levelLabel ? (
                  <span className="td4-chip td4-chip--level">
                    {tool.levelLabel}
                  </span>
                ) : null}
                {tool.toolOfWeek ? (
                  <span className="td4-chip td4-chip--toolOfWeek">
                    <span className="td4-chip__dot" aria-hidden="true" />
                    Tool della settimana
                  </span>
                ) : tool.featured ? (
                  <span className="td4-chip td4-chip--featured">
                    <span className="td4-chip__dot" aria-hidden="true" />
                    In evidenza
                  </span>
                ) : null}
              </div>
            </div>

            <h1 id="td4-tool-name" className="td4-identity__name">
              {tool.name}
            </h1>
            <p className="td4-identity__deck">{tool.shortDescription}</p>

            <ToolDetailCtaBar
              slug={tool.slug}
              name={tool.name}
              externalUrl={tool.url}
              primaryLabel={tool.ctaLabel ?? "Apri il sito"}
              isAffiliateLink={isAffiliateLink}
            />

            <dl className="td4-identity__meta" aria-label="Metadati">
              <div>
                <strong>{formattedPublishedAt}</strong> · pubblicato
              </div>
              {tool.readingTime ? (
                <div>
                  <strong>{tool.readingTime}</strong> · lettura
                </div>
              ) : null}
              <div>
                <strong>{tool.domain}</strong> · dominio
              </div>
              {tool.tags.length > 0 ? (
                <div>
                  {tool.tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ marginRight: "0.5rem" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </dl>
          </div>

          {/* ============================================================
              B. SCORE INSTRUMENT (5fr on desktop)
              ============================================================ */}
          <aside
            className="td4-score"
            aria-label={`Punteggio editoriale TooolVibes ${score.value} su 10, ${score.label}`}
          >
            <div className="td4-score__header">
              <span className="td4-score__kicker">Score TooolVibes</span>
              <span className="td4-score__badge">
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "—"} {trend.value}
              </span>
            </div>
            <div className="td4-score__value">
              <span className="td4-score__number">{score.value.toFixed(1)}</span>
              <span className="td4-score__denom">/10</span>
            </div>
            <div
              className="td4-score__bar"
              role="progressbar"
              aria-valuenow={Math.round(score.value * 10)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Score ${score.value} su 10`}
            >
              <span
                className="td4-score__bar-fill"
                style={{ width: `${Math.min(score.value * 10, 100)}%` }}
              />
            </div>
            <ul className="td4-score__dimensions" aria-label="Dimensioni">
              {dimensions.map((d) => (
                <li key={d.label} className="td4-score__dim">
                  <span className="td4-score__dim-label">{d.label}</span>
                  <span className="td4-score__dim-value">{d.value}</span>
                </li>
              ))}
            </ul>
            <p className="td4-score__note">
              Score editoriale {score.label.toLowerCase()} basato su segnali qualitativi
              della scheda ({votes} segnalazioni redazione). Non è un benchmark di
              laboratorio: serve a orientare la scelta, non a classificare.
            </p>
          </aside>
        </div>
      </section>

      {/* ============================================================
          D. DECISION NAVIGATION
          ============================================================ */}
      <nav className="td4-decision-nav" aria-label="Sezioni della scheda">
        <a className="td4-decision-nav__link" href="#td4-rationale" aria-current="true">
          <Compass size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Panoramica
        </a>
        <a className="td4-decision-nav__link" href="#td4-product">
          <FileText size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Scheda
        </a>
        {tool.useCases.length > 0 ? (
          <a className="td4-decision-nav__link" href="#td4-use-cases">
            <Layers size={13} aria-hidden="true" style={{ marginRight: 4 }} />
            Casi d&apos;uso
          </a>
        ) : null}
        <a className="td4-decision-nav__link" href="#td4-signal">
          <TrendingUp size={13} aria-hidden="true" style={{ marginRight: 4 }} />
          Segnale
        </a>
        {relatedTools.length > 0 ? (
          <a className="td4-decision-nav__link" href="#td4-alternatives">
            <Wrench size={13} aria-hidden="true" style={{ marginRight: 4 }} />
            Alternative
          </a>
        ) : null}
        {tool.editorialReview ? (
          <a className="td4-decision-nav__link" href="#td4-rationale">
            <MessageSquare size={13} aria-hidden="true" style={{ marginRight: 4 }} />
            Recensione
          </a>
        ) : null}
      </nav>

      {/* ============================================================
          C. EDITORIAL RATIONALE
          ============================================================ */}
      <section
        id="td4-rationale"
        className="td4-rationale"
        aria-labelledby="td4-rationale-title"
      >
        <p className="td4-section-eyebrow">
          <BookOpen size={12} aria-hidden="true" />
          Perché TooolVibes lo consiglia
        </p>
        <h2 id="td4-rationale-title" className="td4-section-title">
          Il punto editoriale dietro {tool.name}.
        </h2>
        <div className="td4-rationale__grid">
          <article className="td4-rationale__card">
            <h3>A chi serve</h3>
            <p>
              {tool.idealUseCase ??
                tool.whyItMatters ??
                tool.tldr ??
                `${tool.name} è una soluzione adatta a chi cerca uno strumento ${tool.categoryLabel.toLowerCase()} con taglio editoriale.`}
            </p>
          </article>

          <article className="td4-rationale__card">
            <h3>Dove funziona bene</h3>
            {tool.useCases.length > 0 ? (
              <ul>
                {tool.useCases.map((uc) => (
                  <li key={uc}>{uc}</li>
                ))}
              </ul>
            ) : (
              <p>Le conferme d&apos;uso verificate non sono ancora state pubblicate per questa scheda.</p>
            )}
          </article>

          <article className="td4-rationale__card td4-rationale__card--cautions">
            <h3>Limiti da considerare</h3>
            {tool.cautions.length > 0 ? (
              <ul>
                {tool.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p>
                Nessun limite specifico segnalato in redazione. Verifica sempre i
                termini d&apos;uso ufficiali prima di adottarlo in produzione.
              </p>
            )}
          </article>

          <article className="td4-rationale__card">
            <h3>Quando preferirne un altro</h3>
            <p>
              Se il tuo caso d&apos;uso richiede un taglio verticale diverso (es.
              enterprise, no-code puro, AI conversazionale lunga), valuta le
              <Link href="#td4-alternatives" style={{ color: "var(--tv-accent-cyan)" }}>{" "}alternative in fondo alla scheda</Link>.
            </p>
          </article>
        </div>
      </section>

      {/* ============================================================
          E. PRODUCT INFORMATION (use cases panel)
          ============================================================ */}
      <section
        id="td4-product"
        className="td4-product"
        aria-labelledby="td4-product-title"
      >
        <p className="td4-section-eyebrow">
          <Sparkles size={12} aria-hidden="true" />
          Scheda tecnica
        </p>
        <h2 id="td4-product-title" className="td4-section-title">
          Cosa devi sapere prima di provarlo.
        </h2>
        <dl className="td4-product__grid">
          <div className="td4-product__row">
            <dt>Categoria</dt>
            <dd>{tool.categoryLabel}</dd>
          </div>
          <div className="td4-product__row">
            <dt>Livello</dt>
            <dd>{tool.levelLabel ?? "Non specificato"}</dd>
          </div>
          <div className="td4-product__row">
            <dt>Dominio</dt>
            <dd>{tool.domain}</dd>
          </div>
          <div className="td4-product__row">
            <dt>Pubblicato</dt>
            <dd>{formattedPublishedAt}</dd>
          </div>
          <div className="td4-product__row">
            <dt>Lettura</dt>
            <dd>{tool.readingTime ?? "Non disponibile"}</dd>
          </div>
          <div className="td4-product__row">
            <dt>Tag</dt>
            <dd>
              {tool.tags.length > 0 ? (
                <ul>
                  {tool.tags.map((t) => (
                    <li key={t}>#{t}</li>
                  ))}
                </ul>
              ) : (
                <span className="is-empty">Nessun tag associato</span>
              )}
            </dd>
          </div>
          <div className="td4-product__row">
            <dt>Punti forti</dt>
            <dd>
              {tool.highlights.length > 0 ? (
                <ul>
                  {tool.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : (
                <span className="is-empty">Punti forti non ancora pubblicati</span>
              )}
            </dd>
          </div>
          <div className="td4-product__row">
            <dt>In evidenza</dt>
            <dd>
              {tool.toolOfWeek
                ? "Sì — è il Tool della settimana"
                : tool.featured
                  ? "Sì — è in evidenza editoriale"
                  : "No — profilo standard del catalogo"}
            </dd>
          </div>
        </dl>
      </section>

      {/* ============================================================
          F. TREND / SIGNAL MODULE
          ============================================================ */}
      <section
        id="td4-signal"
        className="td4-signal"
        aria-labelledby="td4-signal-title"
      >
        <p className="td4-section-eyebrow">
          <TrendingUp size={12} aria-hidden="true" />
          Trend e segnale editoriale
        </p>
        <h2 id="td4-signal-title" className="td4-section-title">
          Cosa dice il momento di {tool.name}.
        </h2>
        {isPhSignalAvailable() ? (
          <div className="td4-signal__grid">
            {/* Will only render when real PH data is wired */}
          </div>
        ) : (
          <p className="td4-signal__empty">
            Product Hunt e segnali live non sono al momento disponibili in TooolVibes
            (token di lettura non configurato). Mostriamo quindi solo il segnale
            editoriale interno: <strong>{trend.value}</strong> di variazione
            qualitativa rispetto all&apos;ultima revisione, con direzione{" "}
            <strong>
              {trend.direction === "up"
                ? "in crescita"
                : trend.direction === "down"
                  ? "in calo"
                  : "stabile"}
            </strong>
            . Quando il segnale Product Hunt sarà cablato, apparirà qui sotto
            forma di grafici e metriche reali, mai simulate.
          </p>
        )}
      </section>

      {/* ============================================================
          G. ALTERNATIVES DECISION DESK (warm ivory)
          ============================================================ */}
      {relatedTools.length > 0 ? (
        <section
          id="td4-alternatives"
          className="td4-alternatives"
          aria-labelledby="td4-alternatives-title"
        >
          <div className="td4-alternatives__heading-row">
            <div>
              <p className="td4-alternatives__eyebrow">
                Alternatives Decision Desk
              </p>
              <h2
                id="td4-alternatives-title"
                className="td4-alternatives__title"
              >
                Se ti interessa {tool.name}, confronta questi.
              </h2>
              <p className="td4-alternatives__lede">
                Tre profili affini, ciascuno con un taglio diverso. Le schede qui
                sotto usano la stessa grammatica del catalogo: salva, confronta,
                apri senza perdere lo stato.
              </p>
            </div>
            <Link
              href={`/compare?from=${tool.slug}`}
              className="td4-alternatives__compare-link"
            >
              Apri confronto affiancato
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="td4-alternatives__grid">
            {relatedTools.map((alt) => {
              const why = buildAlternativeWhy(tool, alt);
              return (
                <div key={alt.slug} className="td4-alternative">
                  <div className="td4-alternative__why" aria-label={`Perché ${alt.name}`}>
                    <strong>Perché {alt.name}</strong>
                    {why}
                  </div>
                  <ArchiveV4ToolCard tool={alt} density="comfortable" />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
