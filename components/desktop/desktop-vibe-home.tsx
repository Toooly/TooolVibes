import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Boxes,
  Compass,
  GitCompare,
  Layers3,
  Radar,
  Search,
  Sparkles,
} from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type DesktopVibeHomeProps = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
};

const journeyCards = [
  {
    icon: Search,
    label: "Discovery",
    title: "Filtra il rumore",
    description: "Parti dal catalogo curato, non da una lista infinita di nomi uguali.",
    href: "/archivio",
  },
  {
    icon: Radar,
    label: "Signals",
    title: "Leggi i trend",
    description: "Aggiungi contesto Product Hunt quando un tool sta accelerando davvero.",
    href: "/product-hunt",
  },
  {
    icon: Bookmark,
    label: "Shortlist",
    title: "Chiudi il cerchio",
    description: "Porta i candidati migliori in una selezione pronta per decidere.",
    href: "/shortlist",
  },
];

const routeCards = [
  { icon: Compass, label: "Catalogo", href: "/archivio", tone: "catalog" },
  { icon: Radar, label: "Radar live", href: "/product-hunt", tone: "radar" },
  { icon: GitCompare, label: "Compare", href: "/compare", tone: "compare" },
];

const depthLayers = [
  {
    label: "Foreground",
    title: "Tool da aprire ora",
    description: "Il focus resta leggibile e cliccabile, con CTA e motivazione editoriale.",
  },
  {
    label: "Midground",
    title: "Alternative vicine",
    description: "Le opzioni utili non spariscono: restano in scena con peso minore.",
  },
  {
    label: "Background",
    title: "Segnali e contesto",
    description: "Radar, categorie e percorso guidano la scelta senza sporcare la UI.",
  },
];

export function DesktopVibeHome({ tools, weeklyTool }: DesktopVibeHomeProps) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const sceneTools = [
    focusTool,
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ]
    .filter(Boolean)
    .slice(0, 6) as DirectoryTool[];
  const supportingTools = sceneTools.slice(1, 5);
  const railTools = tools.filter((tool) => tool.slug !== focusTool?.slug).slice(0, 6);

  return (
    <div className="desktop-home-v2 hidden lg:block" data-home-source="desktop-home-3d-v2">
      <section className="desktop-home-hero" aria-labelledby="desktop-home-title">
        <div
          className="desktop-home-stage"
          aria-label="Sistema 3D desktop TooolVibes"
          data-home-region="desktop-3d-system-v2"
        >
          <span className="desktop-home-stage__grid" aria-hidden="true" />
          <span className="desktop-home-stage__beam desktop-home-stage__beam--one" aria-hidden="true" />
          <span className="desktop-home-stage__beam desktop-home-stage__beam--two" aria-hidden="true" />

          <div className="desktop-home-plane desktop-home-plane--background" data-depth-layer="background">
            <span>AI App Builder</span>
            <span>Vibe Coding</span>
            <span>No-Code</span>
            <span>Automation</span>
          </div>

          <div className="desktop-home-plane desktop-home-plane--midground" data-depth-layer="midground">
            {supportingTools.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className={`desktop-home-floating-card desktop-home-floating-card--${index + 1}`}
                data-home-card="midground-tool"
                data-depth-layer={index + 2}
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
                  <small>{tool.categoryLabel}</small>
                </span>
              </Link>
            ))}
          </div>

          {focusTool ? (
            <Link
              href={`/toools/${focusTool.slug}`}
              className="desktop-home-focus-tool"
              data-home-card="foreground-tool"
              data-depth-layer="foreground"
              style={
                {
                  "--tool-from": focusTool.accentFrom,
                  "--tool-to": focusTool.accentTo,
                } as CSSProperties
              }
            >
              <div className="desktop-home-focus-tool__header">
                <DirectoryToolGlyph tool={focusTool} size="lg" />
                <span>
                  <small>Tool in primo piano</small>
                  <strong>{focusTool.name}</strong>
                </span>
              </div>
              <p>{focusTool.whyItMatters}</p>
              <div className="desktop-home-focus-tool__chips">
                {focusTool.highlights.slice(0, 3).map((highlight) => (
                  <span key={highlight}>{highlight}</span>
                ))}
              </div>
            </Link>
          ) : null}

          <div className="desktop-home-command-panel" data-home-card="foreground-panel">
            <div>
              <span>Decision path</span>
              <strong>3 rotte pulite</strong>
            </div>
            <div className="desktop-home-command-panel__routes">
              {routeCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} className={`desktop-home-route-pill is-${item.tone}`}>
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="desktop-home-hero__copy">
          <p className="desktop-home-kicker">
            <Sparkles aria-hidden="true" />
            AI discovery system
          </p>
          <h1 id="desktop-home-title">Scopri tool AI validi con una vista che dà priorità.</h1>
          <p>
            TooolVibes trasforma catalogo, segnali e shortlist in una scena desktop
            ordinata: il tool giusto sta davanti, le alternative restano vicine, il rumore
            resta dietro.
          </p>
          <div className="desktop-home-actions">
            <Link href="/archivio" className="desktop-home-action desktop-home-action--primary">
              Apri il catalogo
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/wishlist" className="desktop-home-action desktop-home-action--secondary">
              Suggerisci un tool
            </Link>
          </div>
          <div className="desktop-home-proof">
            <span>
              <strong>{tools.length}</strong>
              tool curati
            </span>
            <span>
              <strong>{featuredTools.length}</strong>
              focus editoriali
            </span>
            <span>
              <strong>3</strong>
              rotte decisionali
            </span>
          </div>
        </div>
      </section>

      <section className="desktop-home-journey" aria-label="Percorso di scoperta">
        {journeyCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="desktop-home-journey-card">
              <span className="desktop-home-journey-card__icon">
                <Icon aria-hidden="true" />
              </span>
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="desktop-home-depth-system" aria-labelledby="desktop-home-depth-title">
        <div className="desktop-home-depth-copy">
          <p className="desktop-home-kicker">
            <Layers3 aria-hidden="true" />
            Depth design
          </p>
          <h2 id="desktop-home-depth-title">Una gerarchia, non un collage.</h2>
          <p>
            La home desktop usa piani visivi chiari: focus, alternative e contesto. Ogni
            elemento ha una distanza, una funzione e una priorità.
          </p>
        </div>

        <div className="desktop-home-depth-board">
          {depthLayers.map((layer, index) => (
            <article
              key={layer.label}
              className={`desktop-home-depth-card desktop-home-depth-card--${index + 1}`}
              data-home-card="depth-layer"
              data-depth-layer={layer.label.toLowerCase()}
            >
              <span>{layer.label}</span>
              <h3>{layer.title}</h3>
              <p>{layer.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="desktop-home-tool-constellation" aria-label="Tool reali nel catalogo">
        <div className="desktop-home-tool-constellation__header">
          <div>
            <p className="desktop-home-kicker">
              <Boxes aria-hidden="true" />
              Catalogo vivo
            </p>
            <h2>Dal segnale al tool, senza perdere contesto.</h2>
          </div>
          <Link href="/compare" className="desktop-home-action desktop-home-action--secondary">
            Apri compare
          </Link>
        </div>

        <div className="desktop-home-tool-grid">
          {railTools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className={`desktop-home-tool-tile desktop-home-tool-tile--${index + 1}`}
              data-home-card="tool-tile"
              data-depth-layer={(index % 3) + 1}
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
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="desktop-home-final-cta" aria-label="Azione finale">
        <div>
          <p className="desktop-home-kicker">
            <Sparkles aria-hidden="true" />
            Next step
          </p>
          <h2>Costruisci la tua shortlist operativa.</h2>
        </div>
        <div className="desktop-home-final-cta__actions">
          <Link href="/archivio" className="desktop-home-action desktop-home-action--primary">
            Esplora ora
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/wishlist" className="desktop-home-action desktop-home-action--secondary">
            Proponi un tool
          </Link>
        </div>
      </section>
    </div>
  );
}
