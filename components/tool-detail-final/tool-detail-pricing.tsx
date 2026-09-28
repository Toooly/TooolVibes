import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { parsePublicToolMarkdown } from "@/lib/content/tool-markdown-public";

type ToolDetailPricingProps = {
  tool: ToolPublicView;
};

function isGeneric(body: string) {
  const text = body.replace(/[`*_>#-]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return true;
  return /^Piani e condizioni possono cambiare/i.test(text) && text.length < 180;
}

export function ToolDetailPricing({ tool }: ToolDetailPricingProps) {
  const parsed = parsePublicToolMarkdown(tool.extendedContent);
  const body = parsed.byId.pricing?.trim() ?? "";
  const known = body.length > 0 && !isGeneric(body);

  return (
    <section id="td-final-pricing" className="td-final-pricing" aria-labelledby="td-final-pricing-title">
      <p className="td-final-pricing__eyebrow">Prezzi</p>
      <h2 id="td-final-pricing-title" className="td-final-section-title">
        Quanto costa {tool.name}
      </h2>
      {known ? (
        <div className="td-final-pricing__body">{body}</div>
      ) : (
        <p className="td-final-pricing__unknown">
          Questa scheda non pubblica un listino verificato. Controlla il sito del tool prima di decidere.
        </p>
      )}
    </section>
  );
}
