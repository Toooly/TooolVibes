"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  addToolToPersonalStack,
  adoptLegacyListaStack,
  archivePersonalStack,
  createPersonalStack,
  markWorkspaceToolUsing,
  removeToolFromPersonalStack,
  renamePersonalStack,
  restorePersonalStack,
  toggleWorkspaceCompare,
} from "@/lib/account/workspace-actions";
import { compactPersonalStatus } from "@/lib/account/workspace-lifecycle";
import { leftoverLegacyStackSlugs } from "@/lib/account/workspace-stack-target";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import {
  MAX_COMPARE_TOOLS,
  MAX_PERSONAL_STACKS,
  MAX_STACK_DESCRIPTION_LENGTH,
  MAX_STACK_NAME_LENGTH,
} from "@/lib/discovery/workspace-constants";
import type { PersonalStack, WorkspaceStateV1 } from "@/lib/discovery/types";

import { formatWorkspaceDate } from "./workspace-model";
import { WorkspaceCatalogMark, WorkspaceMarkStrip } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";
import {
  WorkspaceChip,
  WorkspaceCompositionBar,
  WorkspaceEmptyMotif,
  WorkspaceReplacement,
} from "./workspace-visual";

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

function stackById(state: WorkspaceStateV1, id: string | null | undefined) {
  if (!id) return null;
  return state.personalStacks.find((stack) => stack.id === id) ?? null;
}

/** Honest member buckets from toolStates — no scores, no percentages. */
function stackMemberCounts(
  state: WorkspaceStateV1,
  slugs: readonly string[],
) {
  let evaluating = 0;
  let selected = 0;
  let using = 0;
  for (const slug of slugs) {
    const tool = state.toolStates[slug];
    const outcome = tool?.decision?.outcome ?? null;
    const usage = tool?.usage ?? null;
    if (outcome == null) evaluating += 1;
    if (outcome === "selected" && usage !== "using" && usage !== "replaced") {
      selected += 1;
    }
    if (usage === "using") using += 1;
  }
  return { evaluating, selected, using };
}

function formatStackMemberCounts(counts: {
  evaluating: number;
  selected: number;
  using: number;
}) {
  const parts: string[] = [];
  if (counts.evaluating > 0) parts.push(`${counts.evaluating} in valutazione`);
  if (counts.selected > 0) {
    parts.push(counts.selected === 1 ? "1 scelto" : `${counts.selected} scelti`);
  }
  if (counts.using > 0) parts.push(`${counts.using} in uso`);
  return parts.join(" · ");
}

function queueStackCompare(
  memberSlugs: readonly string[],
  compareSlugs: readonly string[],
) {
  const room = Math.max(0, MAX_COMPARE_TOOLS - compareSlugs.length);
  if (room === 0) return;
  const toAdd: string[] = [];
  for (const slug of memberSlugs) {
    if (toAdd.length >= room) break;
    if (compareSlugs.includes(slug)) continue;
    toAdd.push(slug);
  }
  for (const slug of toAdd) toggleWorkspaceCompare(slug);
}

export function WorkspaceStacks({
  state,
  stackId = null,
}: {
  state: WorkspaceStateV1;
  stackId?: string | null;
}) {
  const catalog = usePublicToolCatalog();
  const stacks = activePersonalStacks(state);
  const archived = state.personalStacks.filter((stack) => Boolean(stack.archivedAt));
  const leftover = leftoverLegacyStackSlugs(state);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(() => stacks.length === 0);
  const [openId, setOpenId] = useState<string | null>(() => {
    if (stackId && stackById(state, stackId)) return stackId;
    return stacks[0]?.id ?? null;
  });
  const [seenStackId, setSeenStackId] = useState(stackId);
  if (stackId !== seenStackId) {
    setSeenStackId(stackId);
    if (stackId && stackById(state, stackId)) setOpenId(stackId);
  }

  const selected = stackById(state, openId);
  const open =
    selected && (!selected.archivedAt || selected.id === stackId)
      ? selected
      : stacks[0] ?? (stackId ? stackById(state, stackId) : null);

  return (
    <div className="tv-stacks">
      {stacks.length > 0 ? (
        <p className="tv-stacks-kicker">
          {stacks.length} di {MAX_PERSONAL_STACKS} stack
        </p>
      ) : null}
      <div className={stacks.length === 0 ? "tv-stacks-birth" : undefined}>
      {stacks.length > 0 && !creating ? (
        <button
          type="button"
          className="account-btn-secondary"
          onClick={() => setCreating(true)}
        >
          Nuovo stack
        </button>
      ) : (
        <form
          className="tv-compose-stack"
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
            setCreating(false);
          }}
        >
          <div className="tv-compose-stack__preview" aria-hidden="true">
            <span className="tv-compose-stack__mark">
              {(name.trim().slice(0, 2) || "+").toUpperCase()}
            </span>
            <span>
              <p className="tv-compose-stack__name">{name.trim() || "Nuovo stack"}</p>
              <p className="tv-compose-stack__desc">
                {description.trim() || "Un banco di lavoro per i tool che usi insieme."}
              </p>
            </span>
          </div>
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
          <div className="tv-home-actions">
            <button type="submit" className="account-btn-primary">
              Crea
            </button>
            {stacks.length > 0 ? (
              <button
                type="button"
                className="tv-home-textbtn"
                onClick={() => setCreating(false)}
              >
                Annulla
              </button>
            ) : null}
          </div>
        </form>
      )}

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

      {stacks.length === 0 && !open ? (
        <section className="tv-stacks-empty">
          <WorkspaceEmptyMotif variant="stacks" />
          <h2 className="tv-stacks-empty__title">
            {archived.length > 0 ? "Nessuno stack attivo" : "Nessuno stack ancora"}
          </h2>
          <p className="tv-stacks-empty__copy">
            Uno stack raggruppa i tool salvati per un lavoro reale. Non è una
            raccolta da mostrare: è un banco di lavoro.
          </p>
        </section>
      ) : null}
      </div>
      {stacks.length === 0 && open ? (
        <StackDetail key={open.id} state={state} stack={open} catalog={catalog} />
      ) : stacks.length > 0 ? (
        <div className="tv-stacks-split">
          <ul className="tv-stacks-overview">
            {stacks.map((stack) => {
              const previews = previewNames(catalog, stack.slugs);
              const updated = formatWorkspaceDate(stack.updatedAt);
              const isOpen = stack.id === open?.id;
              const composition = stackMemberCounts(state, stack.slugs);
              const memberCounts = formatStackMemberCounts(composition);
              return (
                <li key={stack.id}>
                  <button
                    type="button"
                    className={isOpen ? "tv-stacks-item is-active" : "tv-stacks-item"}
                    onClick={() => setOpenId(stack.id)}
                    aria-current={isOpen ? "true" : undefined}
                  >
                    <span className="tv-stacks-item__name">{stack.name}</span>
                    {stack.description ? (
                      <span className="tv-stacks-item__desc">{stack.description}</span>
                    ) : null}
                    <WorkspaceMarkStrip catalog={catalog} slugs={stack.slugs} />
                    {previews.length > 0 ? (
                      <span className="tv-stacks-item__previews">{previews.join(" · ")}</span>
                    ) : (
                      <span className="tv-stacks-item__previews">Vuoto</span>
                    )}
                    <span className="tv-stacks-item__meta">
                      <span>{countLabel(stack.slugs.length)}</span>
                      {updated ? <span> · {updated}</span> : null}
                    </span>
                    {memberCounts ? (
                      <span className="tv-stacks-item__meta">{memberCounts}</span>
                    ) : null}
                    <WorkspaceCompositionBar
                      evaluating={composition.evaluating}
                      selected={composition.selected}
                      using={composition.using}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          {open ? (
            <StackDetail key={open.id} state={state} stack={open} catalog={catalog} />
          ) : null}
        </div>
      ) : null}
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
  const archived = Boolean(stack.archivedAt);

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
      <div className="tv-stacks-detail__hero">
        <WorkspaceMarkStrip catalog={catalog} slugs={stack.slugs} size="md" />
      </div>
      <details className="tv-lib-menu">
        <summary>Modifica stack</summary>
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
      </details>

      <div className="tv-stacks-tools">
        <p className="tv-stacks-kicker">Tool nello stack</p>
        {stack.slugs.length === 0 ? (
          <p className="tv-stacks-detail__copy">Nessun tool in questo stack.</p>
        ) : (
          <ul className="tv-stacks-tool-list">
            {(["using", "evaluating", "selected", "deferred", "other"] as const).map((group) => {
              const grouped = stack.slugs.filter((slug) => {
                const tool = state.toolStates[slug];
                const usage = tool?.usage ?? null;
                const outcome = tool?.decision?.outcome ?? null;
                if (group === "using") return usage === "using";
                if (group === "evaluating") return !outcome && usage !== "using";
                if (group === "selected")
                  return outcome === "selected" && usage !== "using" && usage !== "replaced";
                if (group === "deferred") return outcome === "deferred";
                return (
                  usage === "replaced" ||
                  usage === "stopped" ||
                  outcome === "rejected"
                );
              });
              if (grouped.length === 0) return null;
              const titles = {
                using: "In uso",
                evaluating: "In valutazione",
                selected: "Scelti",
                deferred: "Rimandati",
                other: "Altri",
              };
              return (
                <li key={group} className="tv-stacks-group">
                  <p className="tv-stacks-group__title">{titles[group]}</p>
                  <ul className="tv-stacks-tool-list">
                    {grouped.map((slug) => {
                      const tool = state.toolStates[slug];
                      const usage = tool?.usage ?? null;
                      const outcome = tool?.decision?.outcome ?? null;
                      const stage = tool?.stage ?? "saved";
                      const status = compactPersonalStatus({ usage, outcome, stage });
                      const replacedName =
                        usage === "replaced" && tool?.replacedBy
                          ? toolName(catalog, tool.replacedBy)
                          : null;
                      const canMarkUsing = outcome === "selected" && !usage;
                      return (
                        <li key={slug} className="tv-stacks-tool">
                          <span className="tv-stacks-tool__id">
                            <WorkspaceCatalogMark catalog={catalog} slug={slug} size="sm" />
                            <span>
                              <Link href={`/toools/${slug}`}>{toolName(catalog, slug)}</Link>
                              <WorkspaceChip tone={(usage ?? outcome ?? "saved") as "saved"}>
                                {" "}
                                {status.label}
                              </WorkspaceChip>
                              {replacedName && tool?.replacedBy ? (
                                <WorkspaceReplacement
                                  catalog={catalog}
                                  fromSlug={slug}
                                  toSlug={tool.replacedBy}
                                />
                              ) : null}
                            </span>
                          </span>
                          <span>
                            {canMarkUsing ? (
                              <button
                                type="button"
                                className="tv-stacks-textbtn"
                                onClick={() => markWorkspaceToolUsing(slug)}
                              >
                                Lo sto usando
                              </button>
                            ) : null}
                            {canMarkUsing ? " " : null}
                            <button
                              type="button"
                              className="tv-stacks-textbtn"
                              onClick={() => removeToolFromPersonalStack(stack.id, slug)}
                            >
                              Togli
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
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
                      <WorkspaceCatalogMark catalog={catalog} slug={slug} size="xs" />
                      {toolName(catalog, slug)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {stack.slugs.length >= 2 ? (
        <Link
          href="/compare"
          className="account-btn-secondary"
          onClick={() => queueStackCompare(stack.slugs, state.compare.slugs)}
        >
          Confronta questi tool
        </Link>
      ) : null}

      {archived ? (
        <button
          type="button"
          className="account-btn-secondary"
          onClick={() => restorePersonalStack(stack.id)}
        >
          Ripristina
        </button>
      ) : (
        <button
          type="button"
          className="account-btn-secondary"
          onClick={() => archivePersonalStack(stack.id)}
        >
          Archivia stack
        </button>
      )}
    </section>
  );
}
