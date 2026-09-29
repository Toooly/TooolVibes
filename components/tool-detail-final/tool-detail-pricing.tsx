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

type PricingPlan = { name: string; price: string; period: string };

export function ToolDetailPricing({ tool }: ToolDetailPricingProps) {
  const parsed = parsePublicToolMarkdown(tool.extendedContent);
  const body = parsed.byId.pricing?.trim() ?? "";
  const known = body.length > 0 && !isGeneric(body);
  const publicTool = tool.publicTool;
  const plans: PricingPlan[] = (publicTool as Record<string, unknown>)?.pricingPlans as PricingPlan[] ?? [];
  const pricingStatus = (publicTool as Record<string, unknown>)?.pricingStatus as string ?? "unverified";
  const sourceUrl = (publicTool as Record<string, unknown>)?.pricingSourceUrl as string ?? null;
  const verifiedAt = (publicTool as Record<string, unknown>)?.pricingLastVerifiedAt as string ?? null;

  return (
    <section id="td-final-pricing" className="td-final-pricing" aria-labelledby="td-final-pricing-title">
      <p className="td-final-pricing__eyebrow">Prezzi</p>
      <h2 id="td-final-pricing-title" className="td-final-section-title">
        Quanto costa {tool.name}
      </h2>
      {plans.length > 0 ? (
        <div className="td-final-pricing__plans">
          {plans.map((plan) => (
            <div key={plan.name} className="td-final-pricing__plan">
              <p className="td-final-pricing__plan-name">{plan.name}</p>
              <p className="td-final-pricing__plan-price">{plan.price}</p>
              {plan.period ? <p className="td-final-pricing__plan-period">{plan.period}</p> : null}
            </div>
          ))}
          {sourceUrl ? (
            <p className="td-final-pricing__source">
              Prezzi verificati il {verifiedAt}
              {tool.domain ? ` — Fonte: ${tool.domain}` : ""}
            </p>
          ) : null}
          <a
            href={tool.affiliateUrl ?? tool.externalUrl}
            className="td-final-pricing__cta"
            target="_blank"
            rel={tool.affiliateUrl ? "noopener noreferrer sponsored" : "noopener noreferrer"}
          >
            Vedi prezzi aggiornati ↗
          </a>
        </div>
      ) : known ? (
        <div className="td-final-pricing__body">{body}</div>
      ) : (
        <div className="td-final-pricing__unknown">
          <span className="td-final-pricing__unknown-icon" aria-hidden="true">?</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Prezzo non verificato</p>
            <p style={{ margin: 0, color: "var(--tv-ink-secondary)" }}>
              {pricingStatus === "contact"
                ? "Listino su richiesta. Contatta il team per un preventivo."
                : "Questa scheda non pubblica un listino verificato. Controlla il sito del tool prima di decidere."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
