"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Columns3 } from "lucide-react";
import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import { MobileToolCard } from "@/components/directory/mobile-tool-card";
import { CompareToggle } from "@/components/tools/compare-toggle";
import {
  MAX_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { isCatalogDensityPolicyEnabled } from "@/lib/config/catalog-density-policy";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

/* ═══════════════════════════════════════════════════════════════
   CatalogResultList — result list (grid header, cards, compare tray).
   Presentational extraction from MobileCatalogView (B25).

   B38 / MOB-702 — density policy: con il flag
   `catalog-density-policy` ON la sezione applica la variante
   `mobile-tool-grid--density-list` (una colonna sotto la soglia
   mobile, contract 320–430px) e monta le card in density
   "mobile-list" (information priority title → use case → CTA,
   action rail protetta). Flag OFF → adapter MobileToolCard
   density="mobile" 1:1, come prima del batch. Reversibilità: flag.
   ═══════════════════════════════════════════════════════════════ */

type CatalogResultListProps = {
  tools: ToolPublicView[];
  groupLabel: string;
  searchQuery: string;
};

export function CatalogResultList({ tools, groupLabel, searchQuery }: CatalogResultListProps) {
  const subtitle = searchQuery.trim() ? `${tools.length} risultati` : `${tools.length} tool`;
  const densityPolicy = isCatalogDensityPolicyEnabled();

  return (
    <section
      id="catalog-results"
      className={
        densityPolicy
          ? "mobile-tool-grid mobile-tool-grid--density-list scroll-mt-24"
          : "mobile-tool-grid scroll-mt-24"
      }
      aria-label={`Tool in ${groupLabel}`}
      data-density-policy={densityPolicy ? "list" : undefined}
    >
      <div className="mobile-tool-grid__header">
        <h2>{groupLabel}</h2>
        <span>{subtitle}</span>
      </div>

      <div className="mobile-tool-grid__list">
        {tools.map((tool, index) =>
          densityPolicy ? (
            <CatalogListToolCard key={tool.slug} tool={tool} index={index} />
          ) : (
            <MobileToolCard key={tool.slug} tool={tool} index={index} />
          ),
        )}
      </div>

      <MobileCompareToolbox tools={tools.slice(0, 3)} />
    </section>
  );
}

/* Wrapper 1:1 sul contratto motion di MobileToolCard (B24): stessa
   animazione whileInView e stesso stagger, density dedicata alla
   colonna singola. Reversibilità: spegnere il flag riattiva
   MobileToolCard senza toccare l'adapter. */
function CatalogListToolCard({
  tool,
  index,
}: {
  tool: ToolPublicView;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="relative"
    >
      <CanonicalToolCard tool={tool} density="mobile-list" />
    </motion.div>
  );
}

function MobileCompareToolbox({ tools }: { tools: ToolPublicView[] }) {
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const canCompare = compareSlugs.length >= 2;
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
            {canCompare
              ? `${compareSlugs.length} candidati pronti. Apri il confronto completo.`
              : "Aggiungi almeno 2 candidati per attivare il confronto completo."}
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
      <Link href={canCompare ? "/compare" : "#catalog-results"} className="mobile-compare-toolbox__cta">
        {canCompare ? "Vai al confronto" : "Aggiungi candidati"}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
