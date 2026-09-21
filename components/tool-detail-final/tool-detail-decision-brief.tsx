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
        In breve
      </p>
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
