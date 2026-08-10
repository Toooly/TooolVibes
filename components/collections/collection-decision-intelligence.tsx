import type { CuratedCollection } from "@/lib/types/collection";
import { Compass, AlertTriangle, ShieldAlert, Lock, Database, TrendingUp } from "lucide-react";

type CollectionDecisionIntelligenceProps = {
  collection: CuratedCollection;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Item = {
  key: string;
  eyebrow: string;
  body: string;
  variant: "strongest" | "weakest" | "neutral";
  icon: React.ReactNode;
  full?: boolean;
};

export function CollectionDecisionIntelligence({ collection }: CollectionDecisionIntelligenceProps) {
  const di = collection.decision_intelligence;
  if (!di) return null;

  const items: Item[] = [];
  if (di.strongest) {
    items.push({
      key: "strongest",
      eyebrow: "Punto di forza",
      body: di.strongest,
      variant: "strongest",
      icon: <TrendingUp className="size-3.5" aria-hidden="true" />,
    });
  }
  if (di.weakest) {
    items.push({
      key: "weakest",
      eyebrow: "Punto debole",
      body: di.weakest,
      variant: "weakest",
      icon: <AlertTriangle className="size-3.5" aria-hidden="true" />,
    });
  }
  if (di.fragility) {
    items.push({
      key: "fragility",
      eyebrow: "Dove si rompe",
      body: di.fragility,
      variant: "neutral",
      icon: <ShieldAlert className="size-3.5" aria-hidden="true" />,
    });
  }
  if (di.vendor_lock_in) {
    items.push({
      key: "vendor_lock_in",
      eyebrow: "Vendor lock-in",
      body: di.vendor_lock_in,
      variant: "neutral",
      icon: <Lock className="size-3.5" aria-hidden="true" />,
    });
  }
  if (di.data_privacy) {
    items.push({
      key: "data_privacy",
      eyebrow: "Privacy / dati",
      body: di.data_privacy,
      variant: "neutral",
      icon: <Database className="size-3.5" aria-hidden="true" />,
    });
  }
  if (di.scalability) {
    items.push({
      key: "scalability",
      eyebrow: "Quando smette di scalare",
      body: di.scalability,
      variant: "neutral",
      icon: <Compass className="size-3.5" aria-hidden="true" />,
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="cx-decision" aria-labelledby="cx-decision-title">
      <header className="cx-decision__head">
        <span className="cx-decision__eyebrow">
          <Compass className="size-3.5" aria-hidden="true" />
          Decision intelligence
        </span>
        <h2 id="cx-decision-title" className="cx-decision__title">
          Cosa ci tiene d&apos;occhio
        </h2>
        <p className="cx-decision__lede">
          Le cose che sapere prima di partire: non sono KPI, ma punti
          editoriali su cui fermarsi un attimo.
        </p>
      </header>

      <div className="cx-decision__grid">
        {items.map((item) => (
          <div
            key={item.key}
            className={cx(
              "cx-decision__item",
              item.variant === "strongest" && "cx-decision__item--strongest",
              item.variant === "weakest" && "cx-decision__item--weakest"
            )}
          >
            <span
              className={cx(
                "cx-decision__item-eyebrow",
                item.variant === "strongest" && "cx-decision__item-eyebrow--strongest",
                item.variant === "weakest" && "cx-decision__item-eyebrow--weakest"
              )}
            >
              {item.icon}
              {item.eyebrow}
            </span>
            <p className="cx-decision__item-body">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
