"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";

import { ArticleMarkdownEditor } from "@/components/admin/article-markdown-editor";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { EditorHeader, EditorShell, EditorStickyBar, useEditorDirty } from "@/components/admin/editor-ux";
import {
  articleKinds,
  articleStatuses,
  getArticleFormValues,
  initialArticleFormState,
  type ArticleFormState,
  type ArticleFormValues,
} from "@/lib/admin/article-form";

type ArticleFormProps = {
  action: (state: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  initialValues?: Partial<ArticleFormValues>;
  submitLabel: string;
  disabled?: boolean;
  backHref?: string;
  entityTitle?: string;
  entityStatus?: string;
  updatedAt?: string | null;
};

const kindLabels: Record<(typeof articleKinds)[number], string> = {
  editorial: "Blog",
  guide: "Guida",
  "tool-writeup": "Scheda tool",
};

const statusLabels: Record<(typeof articleStatuses)[number], string> = {
  draft: "Bozza",
  published: "Pubblicato",
};

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="tv-cc-error">{error}</p>;
}

function FieldLabel({ label }: { label: string }) {
  return <span className="tv-cc-label">{label}</span>;
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="tv-cc-panel">
      <div className="border-b pb-4 soft-divider">
        <p className="tv-cc-panel__kicker">{eyebrow}</p>
        <h2 className="tv-cc-panel__title">{title}</h2>
        <p className="tv-cc-panel__desc">
          {description}
        </p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ToggleCard({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="tv-cc-panel flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="tv-cc-panel__desc">
          {description}
        </p>
      </div>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5" />
    </label>
  );
}

export function ArticleForm({
  action,
  initialValues,
  submitLabel,
  disabled = false,
  backHref = "/admin/articles",
  entityTitle,
  entityStatus,
  updatedAt,
}: ArticleFormProps) {
  const [state, formAction] = useActionState(action, initialArticleFormState);
  const { dirty, markDirty } = useEditorDirty(state.status);
  const values = {
    ...getArticleFormValues(),
    ...initialValues,
    ...state.values,
  };

  return (
    <EditorShell dirty={dirty} onDirty={markDirty}>
    <form action={formAction} className="space-y-8" onChange={markDirty}>
      <EditorHeader backHref={backHref} eyebrow="Guida" title={entityTitle || values.title || "Nuova guida"} status={entityStatus} updatedAt={updatedAt} />
      {state.status === "error" && state.message ? (
        <div className="tv-cc-notice tv-cc-notice--warn">
          {state.message}
        </div>
      ) : null}

      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <FormSection
          eyebrow="Gestione blog"
          title="Titolo, slug e promessa editoriale"
          description="Questi campi alimentano lista blog, SEO, anteprime e pagina pubblica."
        >
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <label className="block xl:col-span-2">
              <FieldLabel label="Titolo articolo" />
              <input
                name="title"
                defaultValue={values.title}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.title} />
            </label>

            <label className="block">
              <FieldLabel label="Slug" />
              <input
                name="slug"
                defaultValue={values.slug}
                placeholder="lascia vuoto per generarlo dal titolo"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.slug} />
            </label>

            <label className="block lg:col-span-2 xl:col-span-3">
              <FieldLabel label="Sottotitolo" />
              <textarea
                name="dek"
                defaultValue={values.dek}
                rows={3}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.dek} />
            </label>

            <label className="block lg:col-span-2 xl:col-span-3">
              <FieldLabel label="Riassunto SEO / card" />
              <textarea
                name="summary"
                defaultValue={values.summary}
                rows={3}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.summary} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Editor"
          title="Corpo articolo in Markdown con media"
          description="Qui puoi scrivere il testo lungo, caricare foto, gif e video, usare tabelle, callout, HTML controllato, dimensioni e allineamenti."
        >
          <ArticleMarkdownEditor
            name="content_markdown"
            initialValue={values.content_markdown}
            disabled={disabled}
            error={state.fieldErrors?.content_markdown}
          />
        </FormSection>

        <FormSection
          eyebrow="Media e informazioni"
          title="Copertina, autore, tag e stato"
          description="L'immagine di copertina resta separata dal corpo articolo; i media interni vengono invece inseriti direttamente nel testo."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="URL immagine di copertina" />
              <input
                type="url"
                defaultValue={values.cover_image_url}
                readOnly
                aria-label="URL copertina selezionato"
                placeholder="https://..."
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.cover_image_url} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Testo alternativo immagine" />
              <input
                name="cover_image_alt"
                defaultValue={values.cover_image_alt}
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.cover_image_alt} />
              <div className="mt-4">
                <FieldLabel label="Scegli dalla media library" />
                <MediaLibraryPicker fieldName="cover_image_url" defaultValue={values.cover_image_url} />
              </div>
            </label>

            <label className="block">
              <FieldLabel label="Autore" />
              <input
                name="author_name"
                defaultValue={values.author_name}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.author_name} />
            </label>

            <label className="block">
              <FieldLabel label="Tag" />
              <input
                name="tags"
                defaultValue={values.tags}
                placeholder="ai, seo, automazione"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.tags} />
            </label>

            <label className="block">
              <FieldLabel label="Tipologia" />
              <select
                name="kind"
                defaultValue={values.kind}
                className="tv-cc-field"
              >
                {articleKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabels[kind]}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.kind} />
            </label>

            <label className="block">
              <FieldLabel label="Stato" />
              <select
                name="status"
                defaultValue={values.status}
                className="tv-cc-field"
              >
                {articleStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.status} />
            </label>

            <label className="block">
              <FieldLabel label="Data pubblicazione" />
              <input
                name="published_at"
                type="date"
                defaultValue={values.published_at}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.published_at} />
            </label>

            <ToggleCard
              name="is_featured"
              title="In primo piano"
              description="Porta l'articolo nei blocchi in evidenza del blog pubblico."
              defaultChecked={values.is_featured}
            />
          </div>
        </FormSection>
      </fieldset>

      <EditorStickyBar dirty={dirty} label={submitLabel} disabled={disabled} error={state.status === "error" ? state.message : undefined} />
    </form>
    </EditorShell>
  );
}
