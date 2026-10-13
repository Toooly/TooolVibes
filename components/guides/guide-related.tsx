import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import type { ToolPublic } from "@/lib/types/tool-public";

type GuideRelatedRailProps = {
  tool: ToolPublic | null;
  toolHref: string | null;
};

export function GuideRelatedRail({
  tool,
  toolHref,
}: GuideRelatedRailProps) {
  if (!tool || !toolHref) {
    return null;
  }

  return (
    <LocalizedAttributes><aside className="guides-rail" aria-label="Risorse collegate">
      <div className="guides-rail__card">
        <span className="guides-rail__label"><LocalizedText>{"Tool in primo piano"}</LocalizedText></span>
        <h3 className="guides-rail__title">{tool.name}</h3>
        {tool.content.bestFor ? (
          <p className="guides-rail__hint"><LocalizedText>{tool.content.bestFor}</LocalizedText></p>
        ) : null}
        <div className="guides-rail__cta-row">
          <Link href={toolHref} className="guides-rail__cta" data-variant="primary"><LocalizedText>{"Apri scheda "}</LocalizedText><span aria-hidden>→</span>
          </Link>
          {tool.urls.website ? (
            <Link
              href={tool.urls.website}
              target="_blank"
              rel="noopener noreferrer"
              className="guides-rail__cta"
            ><LocalizedText>{"Sito ufficiale "}</LocalizedText><span aria-hidden>↗</span>
            </Link>
          ) : null}
        </div>
      </div>
    </aside></LocalizedAttributes>
  );
}
