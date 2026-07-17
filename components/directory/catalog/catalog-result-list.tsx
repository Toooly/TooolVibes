"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Columns3 } from "lucide-react";
import type { CSSProperties } from "react";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import {
  MAX_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { extractDomain } from "./catalog-controller";

/* ═══════════════════════════════════════════════════════════════
   CatalogResultList — result list (grid header, cards, compare tray).
   Presentational extraction from MobileCatalogView (B25).
   ═══════════════════════════════════════════════════════════════ */

type CatalogResultListProps = {
  tools: ToolPublicView[];
  groupLabel: string;
  searchQuery: string;
};

export function CatalogResultList({ tools, groupLabel, searchQuery }: CatalogResultListProps) {
  const subtitle = searchQuery.trim() ? `${tools.length} risultati` : `${tools.length} tool`;

  return (
    <section className="mobile-tool-grid" aria-label={`Tool in ${groupLabel}`}>
      <div className="mobile-tool-grid__header">
        <h2>{groupLabel}</h2>
        <span>{subtitle}</span>
      </div>

      <div className="mobile-tool-grid__list">
        {tools.map((tool, index) => (
          <MobileToolCard key={tool.slug} tool={tool} index={index} />
        ))}
      </div>

      <MobileCompareToolbox tools={tools.slice(0, 3)} />
    </section>
  );
}

function MobileCompareToolbox({ tools }: { tools: ToolPublicView[] }) {
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const selectedTools = compareSlugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolPublicView => Boolean(tool));
  const toolboxTools = [
    ...selectedTools,
    ...tools.filter((tool) => !compareSlugs.includes(tool.slug)),
  ].slice(0, MAX_COMPARE_TOOLS);

  if (!tools.length) return null;

  return (
    <section className="mobile-compare-toolbox" aria-label="Confronto rapido">
      <div className="mobile-compare-toolbox__header">
        <span className="mobile-compare-toolbox__icon">
          <Columns3 size={16} aria-hidden="true" />
        </span>
        <div>
          <h3>Confronto rapido</h3>
          <p>
            {compareSlugs.length >= 2
              ? `${compareSlugs.length} candidati pronti. Apri il confronto completo.`
              : "Aggiungi almeno 2 candidati e apri il confronto completo."}
          </p>
        </div>
      </div>
      <div className="mobile-compare-toolbox__pills">
        {toolboxTools.map((tool) => (
          <span key={tool.slug} className="mobile-compare-toolbox__pill">
            <span>{tool.name}</span>
            <CompareToggle slug={tool.slug} compact />
          </span>
        ))}
      </div>
      <Link href="/compare" className="mobile-compare-toolbox__cta">
        {compareSlugs.length >= 2 ? "Vai al confronto" : "Apri confronto"}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

type MobileToolCardProps = {
  tool: ToolPublicView;
  index: number;
};

function MobileToolCard({ tool, index }: MobileToolCardProps) {
  const domain = extractDomain(tool.url);
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="relative"
    >
      <Link
        href={`/toools/${tool.slug}`}
        className="mobile-tool-card"
        aria-label={`${tool.name}. ${tool.shortDescription || ""}`}
        style={iconUrl ? { "--tool-icon": `url("${iconUrl}")` } as CSSProperties : undefined}
      >
        <div className="mobile-tool-card__visual">
          {iconUrl ? (
            <span className="mobile-tool-card__icon" aria-hidden="true" />
          ) : (
            <span className="mobile-tool-card__fallback">
              {tool.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="mobile-tool-card__meta">
          <div className="mobile-tool-card__topline">
            <span className="mobile-tool-card__category">{tool.categoryLabel}</span>
            <span className="mobile-tool-card__level">{tool.levelLabel}</span>
          </div>
          <h3 className="mobile-tool-card__title">{tool.name}</h3>
          <p className="mobile-tool-card__description">
            {tool.shortDescription || tool.tldr || ""}
          </p>
          <span className="mobile-tool-card__open">
            Apri scheda
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </Link>
      <div className="mobile-tool-card__actions">
        <CompareToggle slug={tool.slug} compact />
        <ShortlistToggle slug={tool.slug} mode="compact" />
      </div>
    </motion.div>
  );
}
