import type { ReactNode } from "react";

import { MarkdownContent } from "@/components/editorial/markdown-content";
import {
  parsePublicToolMarkdown,
  stripInternalToolMarkdown,
} from "@/lib/content/tool-markdown-public";
import { deriveScoreDimensions } from "@/lib/data/tool-detail-derivation";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { cn } from "@/lib/utils";

import { ToolDetailInformation } from "./tool-detail-information";

type ToolDetailExtendedContentProps = {
  tool: ToolPublicView;
  experiences?: ReactNode;
  /** @deprecated kept for call-site compatibility; prefer `tool`. */
  content?: string | null;
  toolName?: string;
};

type DeepenPanel = {
  id: string;
  title: string;
  content: ReactNode;
};

function MarkdownBody({ content }: { content: string }) {
  return (
    <div className={cn("td-final-deepen__body", "prose prose-invert max-w-none")}>
      <MarkdownContent content={stripInternalToolMarkdown(content)} />
    </div>
  );
}

/**
 * Approfondisci — progressive disclosure of extended editorial content.
 * Snapshot-only headings (Ideale per / Meno adatto / Verdetto) and
 * Alternative / CTA e stati are never rendered here.
 */
export function ToolDetailExtendedContent({
  tool,
  experiences,
  content,
}: ToolDetailExtendedContentProps) {
  const source = content ?? tool.extendedContent;
  const parsed = parsePublicToolMarkdown(source);
  const dimensions = deriveScoreDimensions(tool);
  const remainingUseCases = tool.idealUseCase?.trim()
    ? tool.useCases
    : tool.useCases.slice(1);
  const extraUseCases =
    parsed.byId.useCases || remainingUseCases.length === 0
      ? null
      : remainingUseCases.map((item) => `- ${item}`).join("\n");
  const useCasesBody = parsed.byId.useCases || extraUseCases;
  const hasPros = Boolean(parsed.byId.strengths || parsed.byId.limits);

  const panels: DeepenPanel[] = [];

  if (parsed.byId.overview || dimensions.length > 0) {
    panels.push({
      id: "overview",
      title: "Overview",
      content: (
        <>
          {parsed.byId.overview ? <MarkdownBody content={parsed.byId.overview} /> : null}
          {dimensions.length > 0 ? (
            <ul className="td-final-score__dimensions" aria-label="Dimensioni verificate">
              {dimensions.map((dimension) => (
                <li key={dimension.label} className="td-final-score__dim">
                  <span className="td-final-score__dim-label">{dimension.label}</span>
                  <span className="td-final-score__dim-value">{dimension.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ),
    });
  }

  if (parsed.byId.features) {
    panels.push({
      id: "features",
      title: "Funzionalità",
      content: <MarkdownBody content={parsed.byId.features} />,
    });
  }

  if (useCasesBody) {
    panels.push({
      id: "use-cases",
      title: "Casi d'uso",
      content: <MarkdownBody content={useCasesBody} />,
    });
  }

  if (hasPros) {
    panels.push({
      id: "pros-limits",
      title: "Pro e limiti",
      content: (
        <>
          {parsed.byId.strengths ? (
            <div className="td-final-deepen__block">
              <h3 className="td-final-deepen__subhead">Punti di forza</h3>
              <MarkdownBody content={parsed.byId.strengths} />
            </div>
          ) : null}
          {parsed.byId.limits ? (
            <div className="td-final-deepen__block">
              <h3 className="td-final-deepen__subhead">Limiti</h3>
              <MarkdownBody content={parsed.byId.limits} />
            </div>
          ) : null}
        </>
      ),
    });
  }

  if (parsed.byId.experience) {
    panels.push({
      id: "experience",
      title: "Esperienza",
      content: <MarkdownBody content={parsed.byId.experience} />,
    });
  }

  if (parsed.byId.pricing) {
    panels.push({
      id: "pricing",
      title: "Pricing",
      content: <MarkdownBody content={parsed.byId.pricing} />,
    });
  }

  if (parsed.byId.faq) {
    panels.push({
      id: "faq",
      title: "FAQ",
      content: <MarkdownBody content={parsed.byId.faq} />,
    });
  }

  panels.push({
    id: "specs",
    title: "Dati tecnici",
    content: <ToolDetailInformation tool={tool} embedded />,
  });

  if (experiences) {
    panels.push({
      id: "ugc",
      title: "Esperienze",
      content: experiences,
    });
  }

  return (
    <section
      id="td-final-approfondisci"
      className="td-final-deepen"
      aria-labelledby="td-final-approfondisci-title"
    >
      <p className="td-final-section-eyebrow">Approfondisci</p>
      <h2 id="td-final-approfondisci-title" className="td-final-section-title">
        Approfondisci
      </h2>
      <div className="td-final-deepen__list">
        {panels.map((panel) => (
          <details
            key={panel.id}
            className="td-final-deepen__item"
            name="td-final-approfondisci"
          >
            <summary className="td-final-deepen__summary">
              <span>{panel.title}</span>
              <span className="td-final-deepen__chevron" aria-hidden="true" />
            </summary>
            <div className="td-final-deepen__panel">{panel.content}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
