import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, Layers3, Radar, Sparkles, Waypoints } from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumLink } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type DesktopVibeHomeProps = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
};

const homeSignals = [
  {
    icon: Radar,
    label: "Radar",
    title: "Segnali vivi",
    description: "Tool emergenti, fonti ufficiali e contesto editoriale nello stesso spazio.",
  },
  {
    icon: Layers3,
    label: "Depth",
    title: "Stack leggibile",
    description: "Le alternative non sono una lista: diventano livelli da attraversare.",
  },
  {
    icon: Waypoints,
    label: "Route",
    title: "Decisione rapida",
    description: "Ogni scroll porta da scoperta a shortlist, confronto e suggerimento.",
  },
];

const scrollScenes = [
  {
    step: "01",
    title: "Scopri senza rumore",
    description: "La home apre un campo 3D: i tool importanti stanno davanti, i dettagli restano in profondita.",
  },
  {
    step: "02",
    title: "Entra nel catalogo",
    description: "Le categorie diventano piani navigabili e ogni card ha peso, distanza e priorita visiva.",
  },
  {
    step: "03",
    title: "Costruisci lo stack",
    description: "Salvati, confronto e stack non sono azioni laterali: sono il percorso naturale della UI.",
  },
];

export function DesktopVibeHome({ tools, weeklyTool }: DesktopVibeHomeProps) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 5);
  const railTools = tools.slice(0, 9);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];

  return (
    <div className="desktop-vibe desktop-vibe-home hidden lg:block">
      <section className="desktop-vibe-hero desktop-vibe-section">
        <div className="desktop-vibe-copy">
          <p className="desktop-vibe-eyebrow">TooolVibes 3D discovery system</p>
          <h1>Tool AI in uno spazio 3D.</h1>
          <p>
            La nuova home desktop non appoggia effetti sopra una pagina piatta: mette
            catalogo, radar e decisione dentro una scena con profondita, parallasse e
            percorsi chiari.
          </p>
          <div className="desktop-vibe-actions">
            <PremiumLink href="/archivio" size="lg">
              Entra nel catalogo
            </PremiumLink>
            <PremiumLink href="/wishlist" tone="secondary" size="lg">
              Suggerisci un tool
            </PremiumLink>
          </div>
        </div>

        <div className="desktop-vibe-hero-stage" aria-label="Preview 3D dei tool in evidenza">
          <div className="desktop-vibe-stage-grid" aria-hidden="true" />
          <div className="desktop-vibe-stage-rail" aria-hidden="true" />
          <div className="desktop-vibe-stage-halo desktop-vibe-stage-halo--one" aria-hidden="true" />
          <div className="desktop-vibe-stage-halo desktop-vibe-stage-halo--two" aria-hidden="true" />
          <div className="desktop-vibe-stage-beam" aria-hidden="true" />
          <div className="desktop-vibe-prism-core" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          {featuredTools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className={`desktop-vibe-orbit-card desktop-vibe-orbit-card--${index + 1}`}
              style={
                {
                  "--tool-from": tool.accentFrom,
                  "--tool-to": tool.accentTo,
                } as CSSProperties
              }
            >
              <DirectoryToolGlyph tool={tool} size={index === 0 ? "lg" : "md"} />
              <span>
                <strong>{tool.name}</strong>
                <small>{tool.categoryLabel}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-signal-row" aria-label="Sistema desktop 3D">
        {homeSignals.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="desktop-vibe-signal-card">
              <span className="desktop-vibe-signal-icon">
                <Icon aria-hidden="true" />
              </span>
              <p>{item.label}</p>
              <h2>{item.title}</h2>
              <span>{item.description}</span>
            </article>
          );
        })}
      </section>

      <section className="desktop-vibe-section desktop-vibe-scroll-story">
        <div className="desktop-vibe-sticky-copy">
          <p className="desktop-vibe-eyebrow">Scroll effect</p>
          <h2>Ogni sezione avanza come una camera dentro il prodotto.</h2>
          <p>
            Lo scroll non sposta solo contenuto: cambia profondita, enfasi e distanza tra
            i livelli della directory.
          </p>
        </div>

        <div className="desktop-vibe-scroll-stack">
          {scrollScenes.map((scene, index) => (
            <article
              key={scene.step}
              className="desktop-vibe-depth-panel"
              style={
                {
                  "--panel-index": index,
                  "--panel-rotate-x": `${5.5 - index * 0.7}deg`,
                  "--panel-rotate-y": `${-6 + index * 3}deg`,
                  "--panel-depth": `${1.8 + index * 1.45}rem`,
                } as CSSProperties
              }
            >
              <span>{scene.step}</span>
              <h3>{scene.title}</h3>
              <p>{scene.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-lab">
        <div className="desktop-vibe-lab-main">
          <p className="desktop-vibe-eyebrow">Tool of the week</p>
          <h2>{focusTool.name} in primo piano, gli altri in orbita.</h2>
          <p>{focusTool.whyItMatters}</p>
          <div className="desktop-vibe-chip-row">
            {focusTool.highlights.slice(0, 3).map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          <PremiumLink href={`/toools/${focusTool.slug}`} size="md">
            Apri scheda
          </PremiumLink>
        </div>

        <div className="desktop-vibe-tool-rail">
          {railTools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className="desktop-vibe-rail-card"
              style={
                {
                  "--rail-index": index,
                  "--rail-column": index % 3,
                  "--rail-row": Math.floor(index / 3),
                  "--rail-left": `${7 + (index % 3) * 30}%`,
                  "--rail-top": `${4 + Math.floor(index / 3) * 27}%`,
                  "--rail-depth": `${2 + (index % 4) * 1.3}rem`,
                  "--rail-tilt": `${-7 + (index % 3) * 7}deg`,
                  "--rail-roll": `${((index % 2) * 2 - 1) * 0.7}deg`,
                  "--tool-from": tool.accentFrom,
                  "--tool-to": tool.accentTo,
                } as CSSProperties
              }
            >
              <DirectoryToolGlyph tool={tool} size="sm" />
              <strong>{tool.name}</strong>
              <span>{tool.levelLabel}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-final-cta">
        <div>
          <p className="desktop-vibe-eyebrow">Next route</p>
          <h2>Dal campo 3D alla tua shortlist operativa.</h2>
        </div>
        <div className="desktop-vibe-final-actions">
          <Link href="/archivio" className="desktop-vibe-plain-link">
            Catalogo
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/wishlist" className="desktop-vibe-plain-link">
            Suggerisci
            <Sparkles aria-hidden="true" />
          </Link>
          <Link href="/compare" className="desktop-vibe-plain-link">
            Compare
            <Boxes aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
