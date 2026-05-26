"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Boxes,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
} from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type MobileVibeHomeProps = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

const routeCards = [
  {
    label: "Catalogo",
    title: "Filtra i tool",
    description: "Categorie, livelli e casi d'uso senza una lista infinita.",
    href: "/archivio",
    icon: Compass,
  },
  {
    label: "Radar",
    title: "Segnali live",
    description: "Vai ai trend Product Hunt quando vuoi contesto esterno.",
    href: "/product-hunt",
    icon: Radar,
  },
  {
    label: "Compare",
    title: "Decidi meglio",
    description: "Metti i candidati fianco a fianco prima di provarli.",
    href: "/compare",
    icon: GitCompare,
  },
  {
    label: "Shortlist",
    title: "Salva lo stack",
    description: "Tieni vivi i candidati utili per il prossimo test.",
    href: "/shortlist",
    icon: Bookmark,
  },
];

export function MobileVibeHome({ tools, weeklyTool, supportingTools }: MobileVibeHomeProps) {
  const [isReady, setIsReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setShouldRender(query.matches);
      setIsReady(true);
    };

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  if (!isReady || !shouldRender) {
    return null;
  }

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 5);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const previewTools = [
    focusTool,
    ...supportingTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
  ]
    .filter(Boolean)
    .slice(0, 4) as DirectoryTool[];

  return (
    <div className="mobile-vibe-home lg:hidden" data-home-source="mobile-vibe-fallback">
      <section className="page-shell mobile-vibe-section" aria-labelledby="mobile-vibe-title">
        <PremiumPanel tone="blue" className="mobile-vibe-hero-panel">
          <div className="mobile-vibe-hero-copy">
            <PremiumBadge tone="accent">TooolVibes 3D</PremiumBadge>
            <h1 id="mobile-vibe-title">Tool AI in uno spazio 3D.</h1>
            <p>
              La home mobile usa lo stesso sistema 3D della versione desktop, ma lo
              comprime in un campo piu leggibile: tool davanti, percorsi sotto, zero doppioni.
            </p>
            <div className="mobile-vibe-actions">
              <PremiumLink href="/archivio" size="md">
                Entra nel catalogo
              </PremiumLink>
              <PremiumLink href="/wishlist" tone="secondary" size="md">
                Suggerisci
              </PremiumLink>
            </div>
          </div>

          <div className="mobile-vibe-field" aria-label="Campo 3D dei tool in evidenza">
            <span className="mobile-vibe-field-grid" aria-hidden="true" />
            <span className="mobile-vibe-field-core" aria-hidden="true">
              <Boxes />
            </span>
            {featuredTools.slice(0, 4).map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className={`mobile-vibe-node mobile-vibe-node--${index + 1}`}
                style={
                  {
                    "--tool-from": tool.accentFrom,
                    "--tool-to": tool.accentTo,
                  } as CSSProperties
                }
              >
                <DirectoryToolGlyph tool={tool} size="sm" />
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.levelLabel}</small>
                </span>
              </Link>
            ))}
          </div>
        </PremiumPanel>
      </section>

      <section className="page-shell mobile-vibe-section" aria-labelledby="mobile-vibe-routes-title">
        <div className="mobile-vibe-section-heading">
          <PremiumBadge tone="dark">Rotte</PremiumBadge>
          <h2 id="mobile-vibe-routes-title">Scegli il prossimo livello.</h2>
        </div>
        <div className="mobile-vibe-route-grid">
          {routeCards.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="mobile-vibe-route-card">
                <span className="mobile-vibe-route-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <small>{item.label}</small>
                  <strong>{item.title}</strong>
                  <em>{item.description}</em>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {focusTool ? (
        <section className="page-shell mobile-vibe-section" aria-labelledby="mobile-vibe-focus-title">
          <PremiumPanel tone="violet" className="mobile-vibe-focus-panel">
            <div className="mobile-vibe-section-heading">
              <PremiumBadge tone="accent">Focus editoriale</PremiumBadge>
              <h2 id="mobile-vibe-focus-title">{focusTool.name} resta in primo piano.</h2>
            </div>
            <div className="mobile-vibe-focus-card">
              <DirectoryToolGlyph tool={focusTool} size="lg" />
              <div>
                <p>{focusTool.categoryLabel}</p>
                <h3>{focusTool.name}</h3>
                <span>{formatItalianDate(focusTool.publishedAt)}</span>
              </div>
            </div>
            <p className="mobile-vibe-focus-copy">{focusTool.whyItMatters}</p>
            <div className="mobile-vibe-chip-row">
              {focusTool.highlights.slice(0, 3).map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
            <PremiumLink href={`/toools/${focusTool.slug}`} size="md">
              Apri scheda
            </PremiumLink>
          </PremiumPanel>
        </section>
      ) : null}

      <section className="page-shell mobile-vibe-section" aria-labelledby="mobile-vibe-catalog-title">
        <PremiumPanel tone="airy" className="mobile-vibe-catalog-panel">
          <div className="mobile-vibe-section-heading">
            <PremiumBadge tone="dark">Tool reali</PremiumBadge>
            <h2 id="mobile-vibe-catalog-title">Una preview compatta, poi il catalogo.</h2>
          </div>
          <div className="mobile-vibe-tool-list">
            {previewTools.map((tool) => (
              <Link key={tool.slug} href={`/toools/${tool.slug}`} className="mobile-vibe-tool-row">
                <DirectoryToolGlyph tool={tool} size="sm" />
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.shortDescription}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="mobile-vibe-final-row">
            <PremiumLink href="/archivio" size="sm">
              Apri catalogo
            </PremiumLink>
            <PremiumLink href="/product-hunt" tone="secondary" size="sm">
              Radar live
            </PremiumLink>
          </div>
        </PremiumPanel>
      </section>

      <section className="page-shell mobile-vibe-section">
        <div className="mobile-vibe-final-strip">
          <Sparkles aria-hidden="true" />
          <p>Una sola home, un solo flusso: scoperta, profondita, scelta.</p>
        </div>
      </section>
    </div>
  );
}
