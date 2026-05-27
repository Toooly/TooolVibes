import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Boxes,
  Compass,
  GitCompare,
  Radar,
  Search,
  Sparkles,
} from "lucide-react";

import { DesktopDepthScene } from "@/components/desktop/desktop-depth-scene";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type DesktopVibeHomeProps = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
};

const decisionSteps = [
  {
    icon: Search,
    label: "Discover",
    title: "Parti da tool gia curati",
    description: "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
  },
  {
    icon: GitCompare,
    label: "Compare",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
  },
  {
    icon: Bookmark,
    label: "Shortlist",
    title: "Chiudi con una scelta rapida",
    description: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
  },
];

const routeCards = [
  { icon: Compass, label: "Catalogo", href: "/archivio", detail: "Tool AI per categoria" },
  { icon: Radar, label: "Radar live", href: "/product-hunt", detail: "Segnali Product Hunt" },
  { icon: Boxes, label: "Collection", href: "/collections", detail: "Percorsi editoriali" },
];

export function DesktopVibeHome({ tools, weeklyTool }: DesktopVibeHomeProps) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const supportingTools = [
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ].slice(0, 4);
  const catalogTools = tools.filter((tool) => tool.slug !== focusTool?.slug).slice(0, 6);

  return (
    <div className="desktop-home-clean hidden lg:block" data-home-source="desktop-home-2d-clean">
      <section className="desktop-home-clean__hero" aria-labelledby="desktop-home-title">
        <div className="desktop-home-clean__copy">
          <p className="desktop-home-clean__kicker">
            <Sparkles aria-hidden="true" />
            AI tools discovery system
          </p>
          <h1 id="desktop-home-title">Scegli tool AI validi senza attraversare rumore.</h1>
          <p>
            TooolVibes organizza catalogo, segnali e shortlist in un percorso chiaro:
            trovi alternative credibili, confronti solo cio che conta e arrivi prima a
            una decisione.
          </p>
          <div className="desktop-home-clean__actions">
            <Link href="/archivio" className="desktop-home-clean__button desktop-home-clean__button--primary">
              Apri il catalogo
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/wishlist" className="desktop-home-clean__button desktop-home-clean__button--secondary">
              Suggerisci un tool
            </Link>
          </div>
          <div className="desktop-home-clean__proof" aria-label="Dati TooolVibes">
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

        <div className="desktop-home-clean__visual">
          <DesktopDepthScene focusTool={focusTool} supportingTools={supportingTools} />
        </div>
      </section>

      <section className="desktop-home-clean__routes" aria-label="Percorsi principali">
        {routeCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="desktop-home-clean__route-card">
              <span className="desktop-home-clean__route-icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          );
        })}
      </section>

      <section className="desktop-home-clean__process" aria-labelledby="desktop-home-process-title">
        <div>
          <p className="desktop-home-clean__kicker">
            <Compass aria-hidden="true" />
            Metodo
          </p>
          <h2 id="desktop-home-process-title">Un flusso ordinato, non una vetrina infinita.</h2>
        </div>
        <div className="desktop-home-clean__step-grid">
          {decisionSteps.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="desktop-home-clean__step-card">
                <span className="desktop-home-clean__step-icon">
                  <Icon aria-hidden="true" />
                </span>
                <small>{item.label}</small>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="desktop-home-clean__catalog" aria-labelledby="desktop-home-catalog-title">
        <div className="desktop-home-clean__section-header">
          <div>
            <p className="desktop-home-clean__kicker">
              <Boxes aria-hidden="true" />
              Catalogo vivo
            </p>
            <h2 id="desktop-home-catalog-title">Alternative reali, ordinate per decidere meglio.</h2>
          </div>
          <Link href="/compare" className="desktop-home-clean__button desktop-home-clean__button--secondary">
            Apri compare
          </Link>
        </div>

        <div className="desktop-home-clean__tool-grid">
          {catalogTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/toools/${tool.slug}`}
              className="desktop-home-clean__tool-tile"
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

      <section className="desktop-home-clean__final" aria-label="Azione finale">
        <div>
          <p className="desktop-home-clean__kicker">
            <Sparkles aria-hidden="true" />
            Next step
          </p>
          <h2>Costruisci la tua shortlist operativa.</h2>
        </div>
        <div className="desktop-home-clean__actions">
          <Link href="/archivio" className="desktop-home-clean__button desktop-home-clean__button--primary">
            Esplora ora
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/wishlist" className="desktop-home-clean__button desktop-home-clean__button--secondary">
            Proponi un tool
          </Link>
        </div>
      </section>
    </div>
  );
}
