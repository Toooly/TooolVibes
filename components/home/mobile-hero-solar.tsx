"use client";

import Link from "next/link";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type MobileHeroSolarProps = {
  focusTool: DirectoryTool | null;
  supportingTools?: DirectoryTool[];
};

export function MobileHeroSolar({ focusTool, supportingTools = [] }: MobileHeroSolarProps) {
  const title = focusTool?.name
    ? `Scopri ${focusTool.name}.`
    : "Scopri i tool AI che meritano davvero apertura.";
  const copy = focusTool?.tldr || focusTool?.shortDescription || "Un solo focus sopra la piega: il candidato più forte, con contesto e CTA immediata.";

  return (
    <section className="hero-focus-stack" aria-label="Tool in primo piano">
      <div className="hero-focus-stack__shell">
        <span className="hero-focus-stack__eyebrow">Tool in primo piano</span>
        <h1 className="hero-focus-stack__title">{title}</h1>
        <p className="hero-focus-stack__copy">{copy}</p>
        <div className="hero-focus-stack__actions">
          <Link className="hero-focus-stack__cta-primary" href="/archivio">Apri il catalogo</Link>
          <Link className="hero-focus-stack__cta-secondary" href="/radar">Vai al radar</Link>
        </div>
      </div>

      {supportingTools.length > 0 && (
        <div className="hero-focus-stack__rail">
          {supportingTools.slice(0, 4).map((tool) => (
            <Link key={tool.slug} href={`/toools/${tool.slug}`} className="hero-focus-stack__mini">
              <span>{tool.name.slice(0, 2).toUpperCase()}</span>
              <strong>{tool.name}</strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
