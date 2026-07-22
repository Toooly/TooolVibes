import Link from "next/link";

import { createToolFormAction } from "@/app/(admin)/admin/actions/tools";
import { ToolForm } from "@/components/admin/tool-form";
import { SectionHeader } from "@/components/ui/section-header";
import { getSuggestionById } from "@/lib/admin/suggestion-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import { slugifyToolName, type ToolFormValues } from "@/lib/admin/tool-form";
import { siteConfig } from "@/lib/config/site";
import { toolCategories } from "@/lib/config/tool-taxonomy";
import type { ToolCategory } from "@/lib/types/tool";

type NewToolPageProps = {
  searchParams: Promise<{ suggestion?: string }>;
};

function getReadSourceLabel(source: string) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "snapshot":
      return "Copia locale";
    default:
      return source;
  }
}

function buildSuggestionInitialValues(
  suggestion: Awaited<ReturnType<typeof getSuggestionById>>,
): Partial<ToolFormValues> | undefined {
  if (!suggestion) return undefined;

  const slug = slugifyToolName(suggestion.tool_name);
  const category = toolCategories.includes(suggestion.category as ToolCategory)
    ? (suggestion.category as ToolCategory)
    : "Assistente AI";
  const shortDescription =
    suggestion.message && suggestion.message.length >= 20
      ? suggestion.message.slice(0, 220)
      : `${suggestion.tool_name} e' stato suggerito dalla community TooolVibes per una valutazione editoriale.`;

  return {
    name: suggestion.tool_name,
    slug,
    category,
    tags: suggestion.category,
    short_description_it: shortDescription,
    description_it:
      `${shortDescription}\n\nCompleta questa descrizione con casi d'uso, limiti, pubblico ideale e motivo per cui il tool merita di entrare nel catalogo.`,
    website_url: suggestion.tool_url,
    tooolvibes_post_url: `${siteConfig.url}/toools/${slug}`,
    source: "Suggerimento community",
    date_discovered: new Date().toISOString().slice(0, 10),
  };
}

export default async function NewToolPage({ searchParams }: NewToolPageProps) {
  const params = await searchParams;
  const suggestionId = params.suggestion?.trim();
  const [runtime, suggestion] = await Promise.all([
    getAdminToolsRuntime(),
    suggestionId ? getSuggestionById(suggestionId) : Promise.resolve(null),
  ]);
  const canWrite = runtime.canWrite;
  const initialValues = buildSuggestionInitialValues(suggestion);
  const runtimeHighlights = [
    { label: "Lettura", value: getReadSourceLabel(runtime.adminReadSource) },
    { label: "Tool", value: String(runtime.tools.length) },
    { label: "Salvataggio", value: canWrite ? "Attivo" : "Sola lettura" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            eyebrow={suggestion ? "Converti suggerimento" : "Nuovo tool"}
            title={suggestion ? `Crea "${suggestion.tool_name}" nel catalogo` : "Crea una nuova scheda tool"}
            description={
              suggestion
                ? "Ho precompilato i campi disponibili dalla richiesta utente. Completa testo, immagine e stato prima di pubblicare."
                : "Aggiungi un tool al catalogo principale: questa scheda alimenta homepage, archivio, confronto e raccolte."
            }
          />
          <Link
            href={suggestion ? "/admin/suggestions" : "/admin/tools"}
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)]"
          >
            {suggestion ? "Torna ai suggerimenti" : "Torna ai tool"}
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {runtimeHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border px-4 py-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}
            >
              <p className="editorial-label">{item.label}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {!canWrite ? (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
          >
            {runtime.writeMessage}
          </div>
        ) : null}

        {suggestionId && !suggestion ? (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(255,251,235,0.96)" }}
          >
            Suggerimento non trovato. Puoi comunque creare il tool manualmente.
          </div>
        ) : null}

        <div className="mt-8">
          <ToolForm
            action={createToolFormAction}
            initialValues={initialValues}
            sourceRequestId={suggestion?.id}
            submitLabel={suggestion ? "Crea tool e approva richiesta" : "Crea tool"}
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
