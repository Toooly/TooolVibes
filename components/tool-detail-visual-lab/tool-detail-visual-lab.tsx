import type { ToolPublicView } from "@/lib/data/tool-public-view";

import { VisualLabDecisionDesk } from "./visual-lab-decision-desk";
import { VisualLabEditorialVerdict } from "./visual-lab-editorial-verdict";
import { VisualLabHero } from "./visual-lab-hero";
import { VisualLabProductIntelligence } from "./visual-lab-product-intelligence";
import { VisualLabResponsiveShell } from "./visual-lab-responsive-shell";
import { VisualLabSignalModule } from "./visual-lab-signal-module";

type ToolDetailVisualLabProps = {
  tool: ToolPublicView;
  related: ToolPublicView[];
  isAffiliateLink: boolean;
};

/**
 * Tool Detail Visual Lab — isolated exploration owner.
 * Namespace: .td-lab-*
 * Does not touch ToolDetailFinalPage or production route styles.
 */
export function ToolDetailVisualLab({
  tool,
  related,
  isAffiliateLink,
}: ToolDetailVisualLabProps) {
  return (
    <VisualLabResponsiveShell>
      <div className="td-lab-page">
        <VisualLabHero tool={tool} isAffiliateLink={isAffiliateLink} />

        <div className="td-lab-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false">
            <path
              className="td-lab-wave__path"
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            />
            <path
              className="td-lab-wave__trace"
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40"
              fill="none"
            />
          </svg>
        </div>

        <div className="td-lab-ivory">
          <VisualLabEditorialVerdict tool={tool} />
          <VisualLabProductIntelligence tool={tool} />
          <VisualLabSignalModule tool={tool} />
          <VisualLabDecisionDesk current={tool} related={related} />
          <p className="td-lab-end">Fine esplorazione visual lab · baseline produzione invariata</p>
        </div>
      </div>
    </VisualLabResponsiveShell>
  );
}
