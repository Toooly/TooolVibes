import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { buildAlternativeWhy } from "@/lib/data/tool-detail-derivation";

import { VisualLabAltCard } from "./visual-lab-alt-card";

type VisualLabDecisionDeskProps = {
  current: ToolPublicView;
  related: ToolPublicView[];
};

function deriveTargetUser(alt: ToolPublicView): string {
  if (alt.level === "beginner") return "Chi parte da zero e vuole velocità";
  if (alt.level === "expert") return "Team avanzati con esigenze verticali";
  if (alt.toolOfWeek) return "Chi cerca il segnale editoriale del momento";
  if (alt.featured) return "Chi vuole un profilo già validato in redazione";
  return alt.idealUseCase ?? `Chi esplora ${alt.categoryLabel.toLowerCase()}`;
}

function deriveDifference(current: ToolPublicView, alt: ToolPublicView): string {
  const shared = alt.tags.filter((t) => current.tags.includes(t));
  if (alt.level && current.level && alt.level !== current.level) {
    return `Livello ${alt.levelLabel ?? alt.level} vs ${current.levelLabel ?? current.level}`;
  }
  if (shared.length > 0) {
    return `Overlap su ${shared.slice(0, 2).join(", ")}, taglio diverso`;
  }
  if (alt.filterGroups[0] && !current.filterGroups.includes(alt.filterGroups[0])) {
    return `Focus su ${alt.filterGroups[0].replaceAll("-", " ")}`;
  }
  return `Profilo complementare nella stessa area di ${current.name}`;
}

export function VisualLabDecisionDesk({ current, related }: VisualLabDecisionDeskProps) {
  if (related.length === 0) return null;

  return (
    <section
      id="td-lab-alternatives"
      className="td-lab-desk"
      aria-labelledby="td-lab-desk-title"
    >
      <header className="td-lab-desk__head">
        <div>
          <p className="td-lab-section-eyebrow">Alternatives Decision Desk</p>
          <h2 id="td-lab-desk-title" className="td-lab-section-title td-lab-section-title--editorial">
            Se ti interessa {current.name}, confronta questi.
          </h2>
          <p className="td-lab-desk__lede">
            Tre profili affini con grammatica Decision Card dedicata — non card di archivio.
            Salva, confronta e apri senza perdere lo stato workspace.
          </p>
        </div>
        <Link href={`/compare?from=${current.slug}`} className="td-lab-desk__compare-link">
          Apri confronto affiancato
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <div className="td-lab-desk__rail">
        {related.map((alt, index) => (
          <div key={alt.slug} className="td-lab-desk__slot" data-slot={index + 1}>
            <VisualLabAltCard
              tool={alt}
              why={buildAlternativeWhy(current, alt)}
              targetUser={deriveTargetUser(alt)}
              difference={deriveDifference(current, alt)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
