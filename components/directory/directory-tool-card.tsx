import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

/* ═══════════════════════════════════════════════════════════════
   DirectoryToolCard — adapter sottile (B24 / DS-306) sopra la
   ToolCard canonica in density="grid". Export e props invariati:
   le route consumer (es. related tools in /toools/[slug]) montano
   lo stesso componente; la density grid aggiunge le azioni
   save/compare condivise richieste dal contratto DS-306.
   Reversibilità: git revert.
   ═══════════════════════════════════════════════════════════════ */

type DirectoryToolCardData = DirectoryTool | ToolPublicView;

type DirectoryToolCardProps = {
  tool: DirectoryToolCardData;
  priority?: boolean;
};

export function DirectoryToolCard({
  tool,
  priority = false,
}: DirectoryToolCardProps) {
  return <CanonicalToolCard tool={tool} density="grid" priority={priority} />;
}
