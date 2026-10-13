import { LocalizedText } from "@/components/i18n/localized-text";
import { createToolFormAction } from "@/app/(admin)/admin/actions/tools";
import { ControlCenterNotice } from "@/components/admin/control-center-header";
import { ToolForm } from "@/components/admin/tool-form";
import { getSuggestionById } from "@/lib/admin/suggestion-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import { slugifyToolName, type ToolFormValues } from "@/lib/admin/tool-form";
import { siteConfig } from "@/lib/config/site";
import { toolCategories } from "@/lib/config/tool-taxonomy";
import type { ToolCategory } from "@/lib/types/tool";

type NewToolPageProps = {
  searchParams: Promise<{ suggestion?: string }>;
};

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

  return (
    <div className="page-shell py-6">
      {!canWrite ? <ControlCenterNotice tone="warn"><LocalizedText>{runtime.writeMessage}</LocalizedText></ControlCenterNotice> : null}
      {suggestionId && !suggestion ? (
        <ControlCenterNotice tone="warn"><LocalizedText>{"Suggerimento non trovato. Puoi comunque creare il tool manualmente."}</LocalizedText></ControlCenterNotice>
      ) : null}
      <ToolForm
        action={createToolFormAction}
        initialValues={initialValues}
        sourceRequestId={suggestion?.id}
        submitLabel={suggestion ? "Crea tool e approva richiesta" : "Crea tool"}
        disabled={!canWrite}
        backHref={suggestion ? "/admin/suggestions" : "/admin/tools"}
        entityTitle={suggestion ? suggestion.tool_name : "Nuovo tool"}
        entityStatus={canWrite ? "Modificabile" : "Sola lettura"}
      />
    </div>
  );
}
