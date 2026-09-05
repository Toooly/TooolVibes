import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { skillLevelLabel } from "@/lib/product/skill-level";

type ToolDetailDecisionBriefProps = {
  tool: ToolPublicView;
};

export function ToolDetailDecisionBrief({ tool }: ToolDetailDecisionBriefProps) {
  const score = computeEditorialScore({
    publicTool: tool.publicTool,
    cautions: tool.cautions,
  });
  const bestFor =
    tool.idealUseCase?.trim() ||
    tool.publicTool.content.bestFor ||
    tool.useCases[0] ||
    null;
  const notFor = tool.cautions[0] ?? null;
  const tradeOff =
    tool.highlights.find((item) => item && item !== bestFor) ??
    tool.whyItMatters ??
    null;
  const skill = skillLevelLabel(tool.level, tool.levelLabel);
  const pricing = tool.publicTool.attributes.pricing;
  const assessed = score.status === "assessed" && score.value !== null;
  const rows = [
    bestFor ? { dt: "Ideale per", dd: bestFor } : null,
    notFor ? { dt: "Meno adatto se", dd: notFor } : null,
    tradeOff ? { dt: "Cosa lo distingue", dd: tradeOff } : null,
    pricing ? { dt: "Prezzo", dd: pricing } : null,
    skill ? { dt: "Livello", dd: skill } : null,
    assessed
      ? {
          dt: "Valutazione editoriale",
          dd: `${score.value!.toFixed(1)} / 10${
            score.lastVerified ? ` · aggiornata ${score.lastVerified.slice(0, 10)}` : ""
          }`,
        }
      : null,
  ].filter((row): row is { dt: string; dd: string } => row !== null);

  if (rows.length === 0) return null;

  return (
    <section className="td-final-brief" aria-label="Sintesi per decidere">
      <dl>
        {rows.map((row) => (
          <div key={row.dt}>
            <dt>{row.dt}</dt>
            <dd>{row.dd}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
