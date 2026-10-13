"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { EditorHeader, EditorShell, EditorStickyBar, useEditorDirty } from "@/components/admin/editor-ux";
import {
  collectionAccessModes,
  collectionAudiences,
  collectionDifficulties,
  collectionEditorialStates,
  collectionFeaturedSlots,
  collectionSurfaces,
  collectionThemes,
  collectionTones,
  getCollectionFormValues,
  initialCollectionFormState,
  type CollectionFormState,
  type CollectionFormToolSlotValues,
  type CollectionFormValues,
} from "@/lib/admin/collection-form";
import {
  getCollectionEditorialStateMeta,
  getCollectionSurfaceMeta,
} from "@/lib/collections/editorial";
import { getCollectionAccessMeta } from "@/lib/collections/helpers";

type CollectionFormAction = (
  state: CollectionFormState,
  formData: FormData,
) => Promise<CollectionFormState>;

type CollectionFormProps = {
  action: CollectionFormAction;
  initialValues?: Partial<CollectionFormValues>;
  submitLabel: string;
  disabled?: boolean;
  backHref?: string;
  entityTitle?: string;
  entityStatus?: string;
  updatedAt?: string | null;
  availableTools: Array<{
    slug: string;
    name: string;
    category: string;
    is_published?: boolean;
  }>;
};

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="tv-cc-error"><LocalizedText>{error}</LocalizedText></p>;
}

function FieldLabel({ label }: { label: string }) {
  return <span className="tv-cc-label"><LocalizedText>{label}</LocalizedText></span>;
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
        <p className="tv-cc-panel__kicker"><LocalizedText>{eyebrow}</LocalizedText></p>
        <h2 className="tv-cc-panel__title"><LocalizedText>{title}</LocalizedText></h2>
        <p className="tv-cc-panel__desc">
          <LocalizedText>{description}</LocalizedText>
        </p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article
      className="tv-cc-panel"
      
    >
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        
      >
        <LocalizedText>{label}</LocalizedText>
      </p>
      <p className="mt-3 text-[1.8rem] leading-none">{value}</p>
      <p className="mt-2 text-sm leading-6" >
        <LocalizedText>{detail}</LocalizedText>
      </p>
    </article>
  );
}

function normalizeRenderableSlots(
  slots: CollectionFormToolSlotValues[],
  minimum = 6,
): CollectionFormToolSlotValues[] {
  const safeSlots = [...slots];
  const target = Math.max(minimum, safeSlots.length + 2);

  while (safeSlots.length < target) {
    safeSlots.push({
      tool_slug: "",
      role: "",
      note: "",
      featured: false,
      order: String(safeSlots.length + 1),
    });
  }

  return safeSlots;
}

export function CollectionForm({
  action,
  initialValues,
  submitLabel,
  disabled = false,
  backHref = "/admin/collections",
  entityTitle,
  entityStatus,
  updatedAt,
  availableTools,
}: CollectionFormProps) {
  const [state, formAction] = useActionState(action, initialCollectionFormState);
  const { dirty, markDirty } = useEditorDirty(state.status);
  const values = {
    ...getCollectionFormValues(),
    ...initialValues,
    ...state.values,
  };
  const slots = normalizeRenderableSlots(values.included_tools ?? []);
  const toolsBySlug = new Map(availableTools.map((tool) => [tool.slug, tool] as const));
  const filledSlots = slots.filter((slot) => slot.tool_slug.trim().length > 0);
  const anchorCount = filledSlots.filter((slot) => slot.featured).length;
  const publishedFilledSlots = filledSlots.filter(
    (slot) => toolsBySlug.get(slot.tool_slug)?.is_published !== false,
  ).length;
  const draftFilledSlots = Math.max(filledSlots.length - publishedFilledSlots, 0);
  const accessMeta = getCollectionAccessMeta(values.access);
  const surfaceMeta = getCollectionSurfaceMeta(values.surface);
  const editorialStateMeta = getCollectionEditorialStateMeta(values.editorial_state);

  return (
    <EditorShell dirty={dirty} onDirty={markDirty}>
    <form action={formAction} className="space-y-8" onChange={markDirty}>
      <LocalizedAttributes><EditorHeader backHref={backHref} eyebrow="Raccolta" title={entityTitle || values.title || "Nuova raccolta"} status={entityStatus} updatedAt={updatedAt} /></LocalizedAttributes>
      {state.status === "error" && state.message ? (
        <div className="tv-cc-notice tv-cc-notice--warn">
          <LocalizedText>{state.message}</LocalizedText>
        </div>
      ) : null}

      <input type="hidden" name="slot_count" value={slots.length} />

      <fieldset disabled={disabled} className="space-y-8 disabled:opacity-60">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="tv-cc-panel">
            <p className="editorial-label"><LocalizedText>{"Postura della raccolta"}</LocalizedText></p>
            <h2 className="tv-cc-panel__title"><LocalizedText>{"Taglio, accesso e densità della selezione nello stesso colpo d'occhio "}</LocalizedText></h2>
            <p className="tv-cc-panel__desc"><LocalizedText>{"Questa sintesi ti aiuta a capire subito se la raccolta è leggera, densa, pubblica o ancora in costruzione prima di entrare nei dettagli del modulo. "}</LocalizedText></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"><LocalizedText>{"Accesso: "}</LocalizedText><LocalizedText>{accessMeta.label}</LocalizedText>
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"><LocalizedText>{"Stato: "}</LocalizedText><LocalizedText>{editorialStateMeta.label}</LocalizedText>
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"><LocalizedText>{"Formato: "}</LocalizedText><LocalizedText>{surfaceMeta.label}</LocalizedText>
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Tool selezionati"
                value={String(filledSlots.length)}
                detail={`${availableTools.length} tool disponibili nell'area interna.`}
              />
              <StatCard
                label="Tool guida"
                value={String(anchorCount)}
                detail={
                  anchorCount === 1
                    ? "Un solo tool guida, come previsto."
                    : "Conviene lasciare un solo tool guida."
                }
              />
              <StatCard
                label="Bozze nella sequenza"
                value={String(draftFilledSlots)}
                detail={`${publishedFilledSlots} tool già pubblicati nella selezione corrente.`}
              />
            </div>
          </article>

          <article className="tv-cc-panel">
            <p className="tv-cc-panel__kicker"><LocalizedText>{"Guida editoriale"}</LocalizedText></p>
            <h2 className="tv-cc-panel__title"><LocalizedText>{"Una raccolta forte deve restare leggibile anche quando la rivedi più tardi "}</LocalizedText></h2>
            <p className="tv-cc-panel__desc"><LocalizedText>{"Usa la tesi per spiegare la logica della selezione, non per ripetere i campi di base. Nei tool inclusi, ogni ruolo dovrebbe raccontare il perché del tool nel percorso. "}</LocalizedText></p>
            <div className="mt-4 grid gap-3">
              <div className="tv-cc-panel text-sm"><LocalizedText>{"Ordine editoriale corrente: "}</LocalizedText><strong><LocalizedText>{values.editorial_order || "999"}</LocalizedText></strong>.
                <LocalizedText>{values.featured_slot
                  ? ` Spazio in evidenza impostato su ${values.featured_slot}.`
                  : " Nessuno spazio in evidenza attivo."}</LocalizedText>
              </div>
              <div className="tv-cc-notice tv-cc-notice--ok"><LocalizedText>{"Accesso impostato su "}</LocalizedText><strong><LocalizedText>{accessMeta.label}</LocalizedText></strong>: <LocalizedText>{accessMeta.description}</LocalizedText>
              </div>
            </div>
          </article>
        </div>

        <LocalizedAttributes><FormSection
          eyebrow="Identità"
          title="Base curatoriale e copertina"
          description="Titolo, slug e copertina devono reggere sia nella pagina raccolta sia nei punti di promozione pubblica. Qui conviene essere netti e riconoscibili."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block">
              <FieldLabel label="Titolo" />
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
              <LocalizedAttributes><input
                name="slug"
                defaultValue={values.slug}
                placeholder="lascia vuoto per generarlo dal titolo"
                className="tv-cc-field"
              /></LocalizedAttributes>
              <FieldError error={state.fieldErrors?.slug} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Descrizione" />
              <textarea
                name="description"
                defaultValue={values.description}
                rows={3}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.description} />
            </label>

            <label className="block">
              <FieldLabel label="URL immagine di copertina" />
              <LocalizedAttributes><input
                type="url"
                defaultValue={values.cover_image_url}
                readOnly
                aria-label="URL copertina selezionato"
                className="tv-cc-field"
              /></LocalizedAttributes>
              <FieldError error={state.fieldErrors?.cover_image_url} />
              <div className="mt-4">
                <FieldLabel label="Scegli dalla media library" />
                <MediaLibraryPicker fieldName="cover_image_url" defaultValue={values.cover_image_url} />
              </div>
            </label>

            <label className="block">
              <FieldLabel label="Etichetta di copertina" />
              <input
                name="cover_kicker"
                defaultValue={values.cover_kicker}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.cover_kicker} />
            </label>
          </div>
        </FormSection></LocalizedAttributes>

        <LocalizedAttributes><FormSection
          eyebrow="Narrazione"
          title="Tesi, punti chiave e teaser premium"
          description="Questo blocco definisce perché la raccolta esiste, quali segnali mette in evidenza e quanto dell'approfondimento premium vuoi lasciare intravedere."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <FieldLabel label="Tesi editoriale" />
              <textarea
                name="rationale"
                defaultValue={values.rationale}
                rows={5}
                className="tv-cc-field"
                required
              />
              <FieldError error={state.fieldErrors?.rationale} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Punti chiave" />
              <textarea
                name="highlights"
                defaultValue={values.highlights}
                rows={4}
                placeholder="Un highlight per riga"
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.highlights} />
            </label>

            <label className="block lg:col-span-2">
              <FieldLabel label="Premium teaser opzionale" />
              <textarea
                name="premium_teaser"
                defaultValue={values.premium_teaser}
                rows={3}
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.premium_teaser} />
            </label>
          </div>
        </FormSection></LocalizedAttributes>

        <LocalizedAttributes><FormSection
          eyebrow="Postura"
          title="Tema, accesso e stato editoriale"
          description="Qui decidi dove vive la raccolta nel prodotto, per chi è pensata e se è pronta per stare nella parte pubblica o restare in lavorazione."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <label className="block">
              <FieldLabel label="Tema" />
              <select
                name="theme"
                defaultValue={values.theme}
                className="tv-cc-field"
              >
                {collectionThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    <LocalizedText>{theme}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.theme} />
            </label>

            <label className="block">
              <FieldLabel label="Audience" />
              <select
                name="audience"
                defaultValue={values.audience}
                className="tv-cc-field"
              >
                {collectionAudiences.map((audience) => (
                  <option key={audience} value={audience}>
                    <LocalizedText>{audience}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.audience} />
            </label>

            <label className="block">
              <FieldLabel label="Difficoltà" />
              <select
                name="difficulty"
                defaultValue={values.difficulty}
                className="tv-cc-field"
              >
                {collectionDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    <LocalizedText>{difficulty}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.difficulty} />
            </label>

            <label className="block">
              <FieldLabel label="Tono" />
              <select
                name="tone"
                defaultValue={values.tone}
                className="tv-cc-field"
              >
                {collectionTones.map((tone) => (
                  <option key={tone} value={tone}>
                    <LocalizedText>{tone}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.tone} />
            </label>

            <label className="block">
              <FieldLabel label="Accesso" />
              <select
                name="access"
                defaultValue={values.access}
                className="tv-cc-field"
              >
                {collectionAccessModes.map((access) => (
                  <option key={access} value={access}>
                    <LocalizedText>{getCollectionAccessMeta(access).label}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.access} />
            </label>

            <label className="block">
              <FieldLabel label="Formato" />
              <select
                name="surface"
                defaultValue={values.surface}
                className="tv-cc-field"
              >
                {collectionSurfaces.map((surface) => (
                  <option key={surface} value={surface}>
                    <LocalizedText>{getCollectionSurfaceMeta(surface).label}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.surface} />
            </label>

            <label className="block">
              <FieldLabel label="Stato editoriale" />
              <select
                name="editorial_state"
                defaultValue={values.editorial_state}
                className="tv-cc-field"
              >
                {collectionEditorialStates.map((editorialState) => (
                  <option key={editorialState} value={editorialState}>
                    <LocalizedText>{getCollectionEditorialStateMeta(editorialState).label}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.editorial_state} />
            </label>

            <label className="block">
              <FieldLabel label="Spazio in evidenza" />
              <select
                name="featured_slot"
                defaultValue={values.featured_slot}
                className="tv-cc-field"
              >
                {collectionFeaturedSlots.map((slot) => (
                  <option key={slot || "none"} value={slot}>
                    <LocalizedText>{slot || "nessuno"}</LocalizedText>
                  </option>
                ))}
              </select>
              <FieldError error={state.fieldErrors?.featured_slot} />
            </label>

            <label className="block">
              <FieldLabel label="Ordine" />
              <input
                name="editorial_order"
                type="number"
                defaultValue={values.editorial_order}
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.editorial_order} />
            </label>
          </div>
        </FormSection></LocalizedAttributes>

        <LocalizedAttributes><FormSection
          eyebrow="Timing"
          title="Programmazione e date pubbliche"
          description="Non servono sempre tutte, ma quando una raccolta esce o viene archiviata conviene lasciare un ritmo leggibile nell'archivio editoriale."
        >
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <FieldLabel label="Programmato per" />
              <input
                name="scheduled_for"
                type="datetime-local"
                defaultValue={values.scheduled_for}
                className="tv-cc-field"
              />
              <FieldError error={state.fieldErrors?.scheduled_for} />
            </label>

            <label className="block">
              <FieldLabel label="Prima pubblicazione" />
              <input
                name="first_published_at"
                type="datetime-local"
                defaultValue={values.first_published_at}
                className="tv-cc-field"
              />
            </label>

            <label className="block">
              <FieldLabel label="Pubblicata il" />
              <input
                name="published_at"
                type="datetime-local"
                defaultValue={values.published_at}
                className="tv-cc-field"
              />
            </label>

            <label className="block">
              <FieldLabel label="Archiviata il" />
              <input
                name="archived_at"
                type="datetime-local"
                defaultValue={values.archived_at}
                className="tv-cc-field"
              />
            </label>
          </div>
        </FormSection></LocalizedAttributes>

        <LocalizedAttributes><FormSection
          eyebrow="Sequenza tool"
          title="Sequenza, ruolo e tool guida"
          description="Questo è il cuore della raccolta. Ogni spazio deve dire chiaramente perché il tool entra nel percorso, non solo in che categoria vive."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {availableTools.length}<LocalizedText>{" tool disponibili "}</LocalizedText></span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {filledSlots.length}<LocalizedText>{" spazi compilati "}</LocalizedText></span>
              <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {publishedFilledSlots}<LocalizedText>{" pubblicati "}</LocalizedText></span>
            </div>
            <p className="text-sm leading-6" ><LocalizedText>{"Un solo tool guida rende la lettura più chiara anche nelle card e nei teaser. "}</LocalizedText></p>
          </div>

          <div className="mt-5 grid gap-4">
            {slots.map((slot, index) => {
              const selectedTool = slot.tool_slug ? toolsBySlug.get(slot.tool_slug) ?? null : null;

              return (
                <div
                  key={`slot-row-${index}`}
                  className="tv-cc-panel"
                  
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 soft-divider">
                    <div>
                      <p className="editorial-label"><LocalizedText>{"Slot "}</LocalizedText><LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText></p>
                      <p className="mt-1 text-sm font-semibold" >
                        <LocalizedText>{selectedTool ? selectedTool.name : "Nessun tool selezionato"}</LocalizedText>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTool ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          <LocalizedText>{selectedTool.category}</LocalizedText>
                        </span>
                      ) : null}
                      {selectedTool ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          <LocalizedText>{selectedTool.is_published === false ? "bozza" : "pubblicato"}</LocalizedText>
                        </span>
                      ) : null}
                      {slot.featured ? (
                        <span className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"><LocalizedText>{"tool guida "}</LocalizedText></span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.95fr_1.05fr_8rem_auto]">
                    <label className="block">
                      <FieldLabel label={`Tool ${String(index + 1).padStart(2, "0")}`} />
                      <select
                        name={`tool_slug_${index}`}
                        defaultValue={slot.tool_slug}
                        className="tv-cc-field"
                        
                      >
                        <option value=""><LocalizedText>{"Seleziona un tool"}</LocalizedText></option>
                        {availableTools.map((tool) => (
                          <option key={tool.slug} value={tool.slug}>
                            {tool.name} · <LocalizedText>{tool.category}</LocalizedText>
                            <LocalizedText>{tool.is_published === false ? " · bozza" : ""}</LocalizedText>
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <FieldLabel label="Ruolo" />
                      <input
                        name={`tool_role_${index}`}
                        defaultValue={slot.role}
                        className="tv-cc-field"
                        
                      />
                    </label>

                    <label className="block">
                      <FieldLabel label="Nota" />
                      <input
                        name={`tool_note_${index}`}
                        defaultValue={slot.note}
                        className="tv-cc-field"
                        
                      />
                    </label>

                    <label className="block xl:max-w-[8rem]">
                      <FieldLabel label="Ordine" />
                      <input
                        name={`tool_order_${index}`}
                        type="number"
                        defaultValue={slot.order}
                        className="tv-cc-field"
                        
                      />
                    </label>

                    <label
                      className="tv-cc-panel flex items-center justify-between xl:mt-7"
                      
                    >
                      <span className="text-sm font-semibold"><LocalizedText>{"Tool guida"}</LocalizedText></span>
                      <input
                        name={`tool_featured_${index}`}
                        type="checkbox"
                        defaultChecked={slot.featured}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <FieldError error={state.fieldErrors?.included_tools} />
        </FormSection></LocalizedAttributes>
      </fieldset>

      <EditorStickyBar dirty={dirty} label={submitLabel} disabled={disabled} error={state.status === "error" ? state.message : undefined} />
    </form>
    </EditorShell>
  );
}
