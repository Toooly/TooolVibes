import { MarkdownContent } from "@/components/editorial/markdown-content";
import { cn } from "@/lib/utils";

type ToolDetailExtendedContentProps = {
  content: string | null;
  toolName: string;
};

/**
 * Editorial body of a tool page.
 *
 * Renders the long-form content sourced from docs/final-copy/tools/<slug>_FINAL_COPY.md
 * (Overview, Features, Use cases, Strengths, Limitations, Editorial verdict, FAQ).
 * The body is markdown with safe HTML sanitization via the shared
 * MarkdownContent renderer.
 *
 * Returns null when no extended content is available, so the section is fully
 * omitted from the rendered page (no fallback text, no empty card).
 */
export function ToolDetailExtendedContent({
  content,
  toolName,
}: ToolDetailExtendedContentProps) {
  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <section
      id="td-final-extended-content"
      className="td-final-section td-final-extended-content"
      aria-labelledby="td-final-extended-content-title"
    >
      <p className="td-final-section-eyebrow">Approfondimento editoriale</p>
      <h2
        id="td-final-extended-content-title"
        className="td-final-section-title"
      >
        Cosa sappiamo davvero di {toolName}.
      </h2>
      <div
        className={cn(
          "td-final-extended-content__body",
          "prose prose-invert max-w-none",
        )}
      >
        <MarkdownContent content={content} />
      </div>
    </section>
  );
}
