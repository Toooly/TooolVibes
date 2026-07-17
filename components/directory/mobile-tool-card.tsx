"use client";

import { motion } from "motion/react";

import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

/* ═══════════════════════════════════════════════════════════════
   MobileToolCard — adapter sottile (B24 / DS-306) sopra la
   ToolCard canonica in density="mobile". Export e props invariati:
   il facade del catalogo (catalog-result-list, B25) monta lo
   stesso componente con lo stesso contract; il wrapper motion
   whileInView è preservato 1:1. Reversibilità: git revert.
   ═══════════════════════════════════════════════════════════════ */

export type MobileToolCardProps = {
  tool: ToolPublicView;
  index: number;
};

export function MobileToolCard({ tool, index }: MobileToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="relative"
    >
      <CanonicalToolCard tool={tool} density="mobile" />
    </motion.div>
  );
}
