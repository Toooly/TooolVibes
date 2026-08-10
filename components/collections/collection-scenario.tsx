import type { CuratedCollection } from "@/lib/types/collection";
import { FlaskConical } from "lucide-react";

type CollectionScenarioProps = {
  collection: CuratedCollection;
};

export function CollectionScenario({ collection }: CollectionScenarioProps) {
  const scenario = collection.scenario;
  if (!scenario) return null;

  return (
    <section className="cx-scenario" aria-labelledby="cx-scenario-title">
      <header className="cx-scenario__head">
        <span className="cx-scenario__eyebrow">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Esempio reale
        </span>
        <h2 id="cx-scenario-title" className="cx-scenario__title">
          {scenario.title}
        </h2>
      </header>
      <p className="cx-scenario__body">{scenario.body}</p>
      <p className="cx-scenario__disclaimer">Scenario ipotetico ma credibile</p>
    </section>
  );
}
