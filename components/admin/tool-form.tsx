"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";

import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { EditorHeader, EditorShell, EditorStickyBar, useEditorDirty } from "@/components/admin/editor-ux";
import { toolCategories } from "@/lib/config/tool-taxonomy";
import {
  getToolFormValues,
  initialToolFormState,
  type ToolFormState,
  type ToolFormValues,
} from "@/lib/admin/tool-form";

type ToolFormProps = {
  action: (state: ToolFormState, formData: FormData) => Promise<ToolFormState>;
  initialValues?: Partial<ToolFormValues>;
  sourceRequestId?: string;
  submitLabel: string;
  disabled?: boolean;
  backHref?: string;
  entityTitle?: string;
  entityStatus?: string;
  updatedAt?: string | null;
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

export function ToolForm({
  action,
  initialValues,
  sourceRequestId,
  submitLabel,
  disabled = false,
  backHref = "/admin/tools",
  entityTitle,
  entityStatus,
  updatedAt,
}: ToolFormProps) {
  const [state, formAction] = useActionState(action, initialToolFormState);
  const { dirty, markDirty } = useEditorDirty(state.status);
  const values = {
    ...getToolFormValues(),
    ...initialValues,
    ...state.values,
  };

  return (
    <EditorShell dirty={dirty} onDirty={markDirty}>
    <form action={formAction} className="space-y-8" onChange={markDirty}>
      <EditorHeader backHref={backHref} eyebrow="Tool" title={entityTitle || values.name || "Nuovo tool"} status={entityStatus} updatedAt={updatedAt} />
      {sourceRequestId ? (
        <input type="hidden" name="source_request_id" value={sourceRequestId} />
      ) : null}

      {state.status === "error" && state.message ? (
        <div className="tv-cc-notice tv-cc-notice--warn">
          {state.message}
        </div>
      ) : null}

      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <FormSection
          eyebrow="Identità"
          title="Nome, categoria e informazioni essenziali"
          description="Qui definisci nome, slug, categoria e provenienza del tool. Se questi campi sono chiari, il sito pubblico resta più coerente e l'archivio è più semplice da gestire."
        >
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <label className="block xl:col-span-2">
              <FieldLabel label="Nome" />
              <input
                name="name"
                defaultValue={values.name}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.name} />
            </label>

            <label className="block">
              <FieldLabel label="Slug" />
              <input
                name="slug"
                defaultValue={values.slug}
                placeholder="lascia vuoto per generarlo dal nome"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.slug} />
            </label>

            <label className="block">
              <FieldLabel label="Categoria" />
              <select
                name="category"
                defaultValue={values.category}
                className="tv-cc-field"
              >
                {toolCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.category} />
            </label>

            <label className="block">
              <FieldLabel label="Tag" />
              <input
                name="tags"
                defaultValue={values.tags}
                placeholder="ai, automazione, scrittura"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.tags} />
            </label>

            <label className="block">
              <FieldLabel label="Fonte" />
              <input
                name="source"
                defaultValue={values.source}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.source} />
            </label>

            <label className="block">
              <FieldLabel label="Data scoperta" />
              <input
                name="date_discovered"
                type="date"
                defaultValue={values.date_discovered}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.date_discovered} />
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Testi"
          title="Come il tool si presenta nel prodotto"
          description="Questa parte alimenta catalogo, scheda tool e contenuti editoriali. Scrivi testi chiari, già pronti per chi scopre il tool dal sito."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione breve" />
              <textarea
                name="short_description_it"
                defaultValue={values.short_description_it}
                rows={3}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.short_description_it} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione editoriale" />
              <textarea
                name="description_it"
                defaultValue={values.description_it}
                rows={7}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.description_it} />
            </label>

            <label className="block">
              <FieldLabel label="URL del sito" />
              <input
                name="website_url"
                type="url"
                defaultValue={values.website_url}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.website_url} />
            </label>

            <label className="block">
              <FieldLabel label="URL articolo TooolVibes" />
              <input
                name="tooolvibes_post_url"
                type="url"
                defaultValue={values.tooolvibes_post_url}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.tooolvibes_post_url} />
            </label>

            <label className="block">
              <FieldLabel label="URL affiliato (opzionale)" />
              <input
                name="affiliate_url"
                type="url"
                defaultValue={values.affiliate_url ?? undefined}
                placeholder="Se presente, viene usato come link principale nel sito pubblico"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.affiliate_url} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="URL immagine di copertina" />
              <input
                type="url"
                defaultValue={values.cover_image_url}
                readOnly
                aria-label="URL copertina selezionato"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.cover_image_url} />
              <div className="mt-4">
                <FieldLabel label="Scegli dalla media library" />
                <MediaLibraryPicker fieldName="cover_image_url" defaultValue={values.cover_image_url} />
              </div>
            </label>
          </div>
        </FormSection>

        <FormSection
          eyebrow="Visibilità"
          title="Pubblicazione e posizionamento"
          description="L'ultima decisione è sempre editoriale: quando il tool è pronto, puoi pubblicarlo nel catalogo o promuoverlo nei punti più forti della selezione."
        >
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="tv-cc-panel">
              <p className="text-sm font-semibold">Nota operativa</p>
              <p className="tv-cc-panel__desc">
                Il salvataggio avviene in modo protetto e il form mantiene i dati inseriti anche
                se manca un campo o il servizio non risponde.
              </p>
            </div>

            <div className="grid gap-4">
              <ToggleCard
                name="is_featured"
                title="Tool in evidenza"
                description="Mostralo nella selezione della redazione e nei punti più curati del prodotto."
                defaultChecked={values.is_featured}
              />
              <ToggleCard
                name="is_published"
                title="Pubblicato"
                description="Rende il tool visibile nel sito pubblico e nelle aree di scoperta."
                defaultChecked={values.is_published}
              />
            </div>
          </div>
        </FormSection>
      </fieldset>

      <EditorStickyBar dirty={dirty} label={submitLabel} disabled={disabled} error={state.status === "error" ? state.message : undefined} />
    </form>
    </EditorShell>
  );
}
