import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Columns3, Gauge, Layers3, Scale, Sparkles } from "lucide-react";
import { DesktopCompareCanvas } from "@/components/desktop/desktop-compare-canvas";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { ArenaGameMissions } from "@/components/gamification/arena-game-missions";
import { UnifiedCompareBoard } from "@/components/tools/unified-compare-board";
import { PremiumLink } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";

type DesktopVibeCompareProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};

const compareAxis = [
  {
    icon: Gauge,
    label: "Fit",
    title: "Workflow prima",
    description: "La lettura parte dall'uso reale, poi scende su pricing, piattaforme e note.",
  },
  {
    icon: Scale,
    label: "Scarto",
    title: "Differenze visibili",
    description: "Ogni colonna ha profondita propria: il confronto non diventa una tabella piatta.",
  },
  {
    icon: Layers3,
    label: "Stack",
    title: "Decisione agganciata",
    description: "Dal compare puoi tornare al catalogo o portare i candidati dentro il tuo stack.",
  },
];

export function DesktopVibeCompare({
  directoryTools,
  legacyTools,
}: DesktopVibeCompareProps) {
  const featuredTools = directoryTools
    .filter((tool) => tool.featured || tool.toolOfWeek)
    .slice(0, 5);

  return (
    <div className="desktop-vibe desktop-vibe-compare hidden lg:block">
      <section className="desktop-vibe-section desktop-vibe-compare-hero">
        <div className="desktop-vibe-copy">
          <p className="desktop-vibe-eyebrow">Compare 3D decision room</p>
          <h1>Il confronto diventa una stanza, non una tabella.</h1>
          <p>
            I candidati entrano su piani diversi: davanti il fit operativo, dietro le note
            che chiudono il verdetto. La UI resta leggibile, ma vive dentro lo stesso campo
            3D del resto di TooolVibes.
          </p>
          <div className="desktop-vibe-actions">
            <PremiumLink href="/archivio" size="lg">
              Aggiungi tool
            </PremiumLink>
            <PremiumLink href="/shortlist" tone="secondary" size="lg">
              Apri shortlist
            </PremiumLink>
          </div>
        </div>

        <div className="desktop-vibe-compare-stage" aria-label="Stanza 3D del confronto">
          <DesktopCompareCanvas />
          <span className="desktop-vibe-compare-core" aria-hidden="true">
            <Columns3 />
          </span>

          {featuredTools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className={`desktop-vibe-compare-float desktop-vibe-compare-float--${index + 1}`}
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
                <small>{tool.levelLabel}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-compare-axis" aria-label="Metodo di confronto">
        {compareAxis.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="desktop-vibe-signal-card desktop-vibe-compare-axis-card">
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

      <section className="desktop-vibe-section desktop-vibe-game-strip">
        <ArenaGameMissions />
      </section>

      <section className="desktop-vibe-section desktop-vibe-compare-console">
        <aside className="desktop-vibe-compare-guidance">
          <p className="desktop-vibe-eyebrow">Compare console</p>
          <h2>Leggi pochi tool con profondita, poi decidi.</h2>
          <p>
            Se il compare e vuoto, parti dal catalogo. Quando aggiungi candidati, la matrice
            resta qui dentro come plancia decisionale, con la scena 3D dietro e non sopra.
          </p>
          <div className="desktop-vibe-final-actions">
            <Link href="/archivio" className="desktop-vibe-plain-link">
              Catalogo
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/wishlist" className="desktop-vibe-plain-link">
              Suggerisci
              <Sparkles aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <div className="desktop-vibe-compare-board">
          <UnifiedCompareBoard directoryTools={directoryTools} legacyTools={legacyTools} />
        </div>
      </section>
    </div>
  );
}
