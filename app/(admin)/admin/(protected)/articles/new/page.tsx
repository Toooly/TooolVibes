import Link from "next/link";

import { createArticleFormAction } from "@/app/(admin)/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { SectionHeader } from "@/components/ui/section-header";
import { getArticleImportFormValues } from "@/lib/admin/article-form";
import { getAdminArticlesRuntime, getSeedPostForImport } from "@/lib/admin/article-queries";

type NewArticlePageProps = {
  searchParams: Promise<{ seed?: string }>;
};

function getReadSourceLabel(source: string) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "storage":
      return "Archivio alternativo";
    case "mixed":
      return "Archivio misto";
    case "seed":
      return "Articoli da importare";
    case "empty":
      return "Nessun articolo";
    default:
      return source;
  }
}

export default async function NewArticlePage({ searchParams }: NewArticlePageProps) {
  const params = await searchParams;
  const seedSlug = params.seed?.trim();
  const [runtime, seedPost] = await Promise.all([
    getAdminArticlesRuntime(),
    seedSlug ? getSeedPostForImport(seedSlug) : Promise.resolve(null),
  ]);
  const canWrite = runtime.canWrite;
  const initialValues = seedPost ? getArticleImportFormValues(seedPost) : undefined;
  const runtimeHighlights = [
    { label: "Lettura", value: getReadSourceLabel(runtime.adminReadSource) },
    { label: "Articoli", value: String(runtime.articles.length) },
    { label: "Salvataggio", value: canWrite ? "Attivo" : "Sola lettura" },
  ];

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="brand-panel rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader invert
            eyebrow={seedPost ? "Importa articolo" : "Nuovo articolo"}
            title={seedPost ? `Importa "${seedPost.title}" nel blog` : "Crea una nuova bozza blog"}
            description={
              seedPost
                ? "Ho precompilato il contenuto dell'articolo precedente nel nuovo editor. Salvalo per renderlo modificabile mantenendo stato e data originale."
                : "Scrivi il testo, inserisci media nel corpo articolo e decidi se salvarlo come bozza o pubblicarlo subito."
            }
          />
          <Link
            href="/admin/articles"
            className="button-shell button-secondary rounded-full px-4 py-2 text-sm font-semibold text-[#f4f1ff]"
          >
            Torna agli articoli
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {runtimeHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border px-4 py-4"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.06)" }}
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
            style={{ borderColor: "rgba(161,105,47,0.18)", background: "rgba(243,191,76,0.12)" }}
          >
            {runtime.writeMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <ArticleForm
            action={createArticleFormAction}
            initialValues={initialValues}
            submitLabel={seedPost ? "Importa nel blog" : "Crea articolo"}
            disabled={!canWrite}
          />
        </div>
      </div>
    </div>
  );
}
