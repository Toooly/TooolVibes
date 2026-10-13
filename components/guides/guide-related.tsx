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
    <aside className="guides-rail" aria-label="Risorse collegate">
      <div className="guides-rail__card">
        <span className="guides-rail__label">Tool in primo piano</span>
        <h3 className="guides-rail__title">{tool.name}</h3>
        {tool.content.bestFor ? (
          <p className="guides-rail__hint">{tool.content.bestFor}</p>
        ) : null}
        <div className="guides-rail__cta-row">
          <Link href={toolHref} className="guides-rail__cta" data-variant="primary">
            Apri scheda
            <span aria-hidden>→</span>
          </Link>
          {tool.urls.website ? (
            <Link
              href={tool.urls.website}
              target="_blank"
              rel="noopener noreferrer"
              className="guides-rail__cta"
            >
              Sito ufficiale
              <span aria-hidden>↗</span>
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
