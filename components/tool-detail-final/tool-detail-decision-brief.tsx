import { Target, Scale, Star } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  extractMarkdownTradeOff,
  extractMarkdownVerdict,
  firstListItemOrSentence,
  parsePublicToolMarkdown,
} from "@/lib/content/tool-markdown-public";

type ToolDetailDecisionBriefProps = {
  tool: ToolPublicView;
};

export function ToolDetailDecisionBrief({ tool }: ToolDetailDecisionBriefProps) {
  const markdown = parsePublicToolMarkdown(tool.extendedContent);
  const fit =
    tool.idealUseCase?.trim() ||
    firstListItemOrSentence(markdown.byId.fit) ||
    tool.useCases[0] ||
    null;
  const tradeOff = extractMarkdownTradeOff(markdown.byId.verdict);
  const verdict =
    tool.editorialNote?.trim() ||
    tool.editorialReview?.trim() ||
    extractMarkdownVerdict(markdown.byId.verdict) ||
    null;

  const strengths = (markdown.byId.strengths ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").replace(/\*\*/g, "").trim())
    .filter((line) => line.length > 2)
    .slice(0, 3);
  const briefSummary = (tool.whyItMatters ?? "").trim() || (verdict ?? "");

  const rows = [
    fit ? { dt: "Ideale per", dd: fit } : null,
    tradeOff ? { dt: "Trade-off", dd: tradeOff } : null,
    verdict ? { dt: "Verdetto", dd: verdict } : null,
  ].filter((row): row is { dt: string; dd: string } => row !== null);

  if (rows.length === 0) return null;

  return (
    <section
      className="td-final-brief tv-emphasis tv-emphasis--decision"
      aria-labelledby="td-final-brief-heading"
    >
      <p id="td-final-brief-heading" className="td-final-brief__eyebrow">
        In sintesi
      </p>
      {briefSummary ? (
        <p className="td-final-brief__summary">{briefSummary}</p>
      ) : null}
      {strengths.length > 0 ? (
        <ul className="td-final-brief__points">
          {strengths.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
      <dl>
        {rows.map((row, rowIndex) => (
          <div key={row.dt}>
            <span className="td-final-brief__icon" aria-hidden="true">
              {rowIndex === 0 ? <Target size={16} /> : rowIndex === 1 ? <Scale size={16} /> : <Star size={16} />}
            </span>
            <dt>{row.dt}</dt>
            <dd>{row.dd}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
