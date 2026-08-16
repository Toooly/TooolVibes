import { createArticleFormAction } from "@/app/(admin)/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { ControlCenterNotice } from "@/components/admin/control-center-header";
import { getArticleImportFormValues } from "@/lib/admin/article-form";
import { getAdminArticlesRuntime, getSeedPostForImport } from "@/lib/admin/article-queries";

type NewArticlePageProps = {
  searchParams: Promise<{ seed?: string }>;
};

export default async function NewArticlePage({ searchParams }: NewArticlePageProps) {
  const params = await searchParams;
  const seedSlug = params.seed?.trim();
  const [runtime, seedPost] = await Promise.all([
    getAdminArticlesRuntime(),
    seedSlug ? getSeedPostForImport(seedSlug) : Promise.resolve(null),
  ]);
  const canWrite = runtime.canWrite;
  const initialValues = seedPost ? getArticleImportFormValues(seedPost) : undefined;

  return (
    <div className="page-shell py-6">
      {!canWrite ? <ControlCenterNotice tone="warn">{runtime.writeMessage}</ControlCenterNotice> : null}
      <ArticleForm
        action={createArticleFormAction}
        initialValues={initialValues}
        submitLabel={seedPost ? "Importa nel blog" : "Crea articolo"}
        disabled={!canWrite}
        backHref="/admin/articles"
        entityTitle={seedPost ? seedPost.title : "Nuova guida"}
      />
    </div>
  );
}
