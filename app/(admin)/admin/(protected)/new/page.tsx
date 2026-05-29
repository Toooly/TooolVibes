import Link from "next/link";

import { createToolFormAction } from "@/app/(admin)/admin/actions/tools";
import { ToolForm } from "@/components/admin/tool-form";
import { SectionHeading } from "@/components/sections/section-heading";
import { getSuggestionById } from "@/lib/admin/suggestion-queries";
import { slugifyToolName, type ToolFormValues } from "@/lib/admin/tool-form";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import type { ToolCategory } from "@/lib/types/tool";

type NewToolPageProps = {
  searchParams: Promise<{ suggestion?: string }>;
};

const suggestionCategoryMap: Record<string, ToolCategory> = {
  "ai-app-builder": "Developer",
  "vibe-coding": "Developer",
  "no-code": "Developer",
  "headless-cms": "Developer",
  "ui-builder": "Design",
  "ai-writing": "Writing",
  "ai-image": "Design",
  "ai-video": "Video",
  marketing: "Marketing",
  sales: "Marketing",
  "customer-support": "Assistente AI",
  automation: "Produttivita",
  "ai-agents": "Assistente AI",
  payments: "Produttivita",
  "website-builder": "Developer",
  productivity: "Produttivita",
};

function isValidUuid(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export default async function NewToolPage({ searchParams }: NewToolPageProps) {
  const params = await searchParams;
  const suggestionId = isValidUuid(params.suggestion) ? params.suggestion : undefined;
  const [runtime, suggestion] = await Promise.all([
    getAdminToolsRuntime(),
    suggestionId ? getSuggestionById(suggestionId) : Promise.resolve(null),
  ]);
  const canWrite = runtime.canWrite;
  const suggestionInitialValues: Partial<ToolFormValues> | undefined = suggestion
    ? {
        name: suggestion.tool_name,
        slug: slugifyToolName(suggestion.tool_name),
        category: suggestionCategoryMap[suggestion.category] ?? "Assistente AI",
        tags: [suggestion.category, suggestion.level, "suggerimento-utente"]
          .filter(Boolean)
          .join(", "),
        short_description_it:
          suggestion.message && suggestion.message.length >= 20
            ? suggestion.message.slice(0, 180)
            : `Tool suggerito dalla community: ${suggestion.tool_name}.`,
        description_it: [
          `Tool suggerito dalla community TooolVibes: ${suggestion.tool_name}.`,
          suggestion.message,
          "Da rifinire prima della pubblicazione con valutazione editoriale, use case e dettagli principali.",
        ]
          .filter(Boolean)
          .join("\n\n"),
        website_url: suggestion.tool_url,
        source: "Suggerimento utente",
        is_published: false,
      }
    : undefined;
  const runtimeHighlights = [
    { label: "Admin read", value: runtime.adminReadSource },
    { label: "Public feed", value: runtime.publicSnapshot.source },
    { label: "Write target", value: runtime.writeTarget ?? "locked" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeading
            eyebrow="Nuovo tool"
            title={
              suggestion
                ? `Trasforma "${suggestion.tool_name}" in scheda editoriale`
                : "Crea una nuova scheda editoriale"
            }
            description={
              suggestion
                ? "I dati ricevuti dal suggerimento sono gia precompilati dove possibile. Completa copy, immagine, post TooolVibes e pubblicazione quando la scheda e pronta."
                : "Il form tools ora conserva lo stato locale anche quando qualcosa va storto. Qui lavoriamo sul modello dati pubblico senza lasciare il founder al buio su source e write path."
            }
          />
          <Link
            href="/admin"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-strong)]"
          >
            Torna alla dashboard
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

        <div className="mt-8">
          <ToolForm
            action={createToolFormAction}
            initialValues={suggestionInitialValues}
            sourceRequestId={suggestion?.id}
            submitLabel={suggestion ? "Crea tool da suggerimento" : "Crea tool"}
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
