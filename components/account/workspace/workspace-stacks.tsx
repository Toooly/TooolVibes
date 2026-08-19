"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  addToolToPersonalStack,
  adoptLegacyListaStack,
  archivePersonalStack,
  createPersonalStack,
  removeToolFromPersonalStack,
  renamePersonalStack,
  restorePersonalStack,
} from "@/lib/account/workspace-actions";
import { leftoverLegacyStackSlugs } from "@/lib/account/workspace-stack-target";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import {
  MAX_STACK_DESCRIPTION_LENGTH,
  MAX_STACK_NAME_LENGTH,
} from "@/lib/discovery/workspace-constants";
import type { PersonalStack, WorkspaceStateV1 } from "@/lib/discovery/types";

import { formatWorkspaceDate } from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const PREVIEW_LIMIT = 3;

function previewNames(
  catalog: readonly PublicToolCatalogItem[],
  slugs: readonly string[],
) {
  const names = slugs.slice(0, PREVIEW_LIMIT).map((slug) => toolName(catalog, slug));
  const extra = slugs.length - names.length;
  if (extra > 0) names.push(`+${extra}`);
  return names;
}

function countLabel(count: number) {
  return count === 1 ? "1 tool" : `${count} tool`;
}

export function WorkspaceStacks({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const stacks = activePersonalStacks(state);
  const archived = state.personalStacks.filter((stack) => Boolean(stack.archivedAt));
  const leftover = leftoverLegacyStackSlugs(state);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openId, setOpenId] = useState<string | null>(stacks[0]?.id ?? null);
  const open = stacks.find((stack) => stack.id === openId) ?? stacks[0] ?? null;

  return (
    <div className="tv-stacks">
      <form
        className="tv-stacks-create"
        onSubmit={(event) => {
          event.preventDefault();
          const nextName = name.trim();
          if (!nextName) return;
          const nextDescription = description.trim();
          const after = createPersonalStack(
            nextName,
            nextDescription ? nextDescription : null,
          );
          const created = after.personalStacks.find((stack) => stack.name === nextName);
          setOpenId(created?.id ?? openId);
          setName("");
          setDescription("");
        }}
      >
        <p className="account-label">Nuovo stack</p>
        <label>
          <span>Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Es. AI Coding"
            maxLength={MAX_STACK_NAME_LENGTH}
          />
        </label>
        <label>
          <span>Descrizione (opzionale)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A cosa serve questo gruppo"
            maxLength={MAX_STACK_DESCRIPTION_LENGTH}
            rows={2}
          />
        </label>
        <button type="submit" className="account-btn-primary">
          Crea
        </button>
      </form>

      {leftover.length > 0 ? (
        <section className="tv-stacks-empty">
          <h2 className="tv-stacks-empty__title">Lista precedente</h2>
          <p className="tv-stacks-empty__copy">
            Hai {leftover.length === 1 ? "1 tool" : `${leftover.length} tool`} nella vecchia lista.
            Portali nello stack personale.
          </p>
          <button type="button" className="account-btn-secondary" onClick={() => adoptLegacyListaStack()}>
            Porta nello stack
          </button>
        </section>
      ) : null}

      {archived.length > 0 ? (
        <section className="tv-stacks-empty" aria-labelledby="tv-stacks-archived">
          <h2 id="tv-stacks-archived" className="tv-stacks-empty__title">
            Stack archiviati
          </h2>
          <ul className="tv-stacks-tool-list">
            {archived.map((stack) => (
              <li key={stack.id} className="tv-stacks-tool">
                <span>{stack.name}</span>
                <button
                  type="button"
                  className="tv-stacks-textbtn"
                  onClick={() => restorePersonalStack(stack.id)}
                >
                  Ripristina
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stacks.length === 0 ? (
        <section className="tv-stacks-empty">
          <h2 className="tv-stacks-empty__title">
            {archived.length > 0 ? "Nessuno stack attivo" : "Nessuno stack ancora"}
          </h2>
          <p className="tv-stacks-empty__copy">
            Uno stack raggruppa i tool salvati per un lavoro reale. Non è una
            raccolta da mostrare: è un banco di lavoro.
          </p>
        </section>
      ) : (
        <div className="tv-stacks-split">
          <ul className="tv-stacks-overview">
            {stacks.map((stack) => {
              const previews = previewNames(catalog, stack.slugs);
              const updated = formatWorkspaceDate(stack.updatedAt);
              const selected = stack.id === open?.id;
              return (
                <li key={stack.id}>
                  <button
                    type="button"
                    className={selected ? "tv-stacks-item is-active" : "tv-stacks-item"}
                    onClick={() => setOpenId(stack.id)}
                    aria-current={selected ? "true" : undefined}
                  >
                    <span className="tv-stacks-item__name">{stack.name}</span>
                    {stack.description ? (
                      <span className="tv-stacks-item__desc">{stack.description}</span>
                    ) : null}
                    {previews.length > 0 ? (
                      <span className="tv-stacks-item__previews">{previews.join(" · ")}</span>
                    ) : (
                      <span className="tv-stacks-item__previews">Vuoto</span>
                    )}
                    <span className="tv-stacks-item__meta">
                      <span>{countLabel(stack.slugs.length)}</span>
                      {updated ? <span> · {updated}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {open ? (
            <StackDetail key={open.id} state={state} stack={open} catalog={catalog} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function StackDetail({
  state,
  stack,
  catalog,
}: {
  state: WorkspaceStateV1;
  stack: PersonalStack;
  catalog: readonly PublicToolCatalogItem[];
}) {
  const [draftName, setDraftName] = useState(stack.name);
  const [draftDescription, setDraftDescription] = useState(stack.description ?? "");
  const [pickerQuery, setPickerQuery] = useState("");

  const available = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return state.saved.slugs.filter((slug) => {
      if (stack.slugs.includes(slug)) return false;
      if (!query) return true;
      const name = toolName(catalog, slug).toLowerCase();
      return name.includes(query) || slug.toLowerCase().includes(query);
    });
  }, [catalog, pickerQuery, stack.slugs, state.saved.slugs]);

  const savedOutside = state.saved.slugs.filter((slug) => !stack.slugs.includes(slug));

  return (
    <section className="tv-stacks-detail" aria-labelledby={`stack-${stack.id}`}>
      <h2 id={`stack-${stack.id}`} className="tv-stacks-detail__title">
        {stack.name}
      </h2>
      <form
        className="tv-stacks-edit"
        onSubmit={(event) => {
          event.preventDefault();
          const nextName = draftName.trim();
          if (!nextName) return;
          const nextDescription = draftDescription.trim();
          renamePersonalStack(stack.id, nextName, nextDescription ? nextDescription : null);
        }}
      >
        <label>
          <span>Nome</span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={MAX_STACK_NAME_LENGTH}
          />
        </label>
        <label>
          <span>Descrizione</span>
          <textarea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            maxLength={MAX_STACK_DESCRIPTION_LENGTH}
            rows={2}
          />
        </label>
        <button type="submit" className="account-btn-secondary">
          Aggiorna
        </button>
      </form>

      <div className="tv-stacks-tools">
        <p className="tv-stacks-kicker">Tool nello stack</p>
        {stack.slugs.length === 0 ? (
          <p className="tv-stacks-detail__copy">Nessun tool in questo stack.</p>
        ) : (
          <ul className="tv-stacks-tool-list">
            {stack.slugs.map((slug) => (
              <li key={slug} className="tv-stacks-tool">
                <Link href={`/toools/${slug}`}>{toolName(catalog, slug)}</Link>
                <button
                  type="button"
                  className="tv-stacks-textbtn"
                  onClick={() => removeToolFromPersonalStack(stack.id, slug)}
                >
                  Togli
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tv-stacks-picker">
        <p className="tv-stacks-kicker">Aggiungi dalla biblioteca</p>
        {savedOutside.length === 0 ? (
          <p className="tv-stacks-detail__copy">
            {state.saved.slugs.length === 0
              ? "Salva un tool in biblioteca per poterlo mettere qui."
              : "Tutti i tool salvati sono già in questo stack."}
          </p>
        ) : (
          <>
            <label>
              <span className="sr-only">Filtra i tool salvati</span>
              <input
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder="Cerca tra i salvati"
              />
            </label>
            {available.length === 0 ? (
              <p className="tv-stacks-detail__copy">Nessun salvato corrisponde.</p>
            ) : (
              <ul className="tv-stacks-picker-list">
                {available.map((slug) => (
                  <li key={slug}>
                    <button
                      type="button"
                      className="tv-stacks-picker-item"
                      onClick={() => {
                        addToolToPersonalStack(stack.id, slug);
                        setPickerQuery("");
                      }}
                    >
                      {toolName(catalog, slug)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="account-btn-secondary"
        onClick={() => archivePersonalStack(stack.id)}
      >
        Archivia stack
      </button>
    </section>
  );
}
