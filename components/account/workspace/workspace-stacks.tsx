"use client";

import Link from "next/link";
import { useState } from "react";

import {
  addToolToPersonalStack,
  archivePersonalStack,
  createPersonalStack,
  removeToolFromPersonalStack,
  renamePersonalStack,
} from "@/lib/account/workspace-actions";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { toolName } from "./workspace-tool-name";

export function WorkspaceStacks({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const stacks = activePersonalStacks(state);
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState<string | null>(stacks[0]?.id ?? null);
  const open = stacks.find((stack) => stack.id === openId) ?? stacks[0] ?? null;

  return (
    <div className="tv-space-stack">
      <section className="tv-space-card">
        <p className="account-label">Nuovo stack</p>
        <form
          className="tv-space-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const next = name.trim();
            if (!next) return;
            const after = createPersonalStack(next);
            const created = after.personalStacks.find((stack) => stack.name === next);
            setOpenId(created?.id ?? openId);
            setName("");
          }}
        >
          <label>
            <span className="sr-only">Nome stack</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Es. AI Coding"
              maxLength={80}
            />
          </label>
          <button type="submit" className="account-btn-primary">
            Crea
          </button>
        </form>
      </section>

      {stacks.length === 0 ? (
        <section className="tv-space-card">
          <h2 className="tv-space-card__title">Nessuno stack ancora</h2>
          <p className="tv-space-card__body">
            Uno stack è una lista privata per un lavoro reale. Non è una raccolta editoriale.
          </p>
        </section>
      ) : (
        <div className="tv-space-split">
          <ul className="tv-space-list">
            {stacks.map((stack) => (
              <li key={stack.id}>
                <button
                  type="button"
                  className={stack.id === open?.id ? "tv-space-row is-active" : "tv-space-row"}
                  onClick={() => setOpenId(stack.id)}
                >
                  <span>{stack.name}</span>
                  <span className="tv-space-row__meta">{stack.slugs.length}</span>
                </button>
              </li>
            ))}
          </ul>
          {open ? (
            <StackDetail key={open.id} state={state} stackId={open.id} catalog={catalog} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function StackDetail({
  state,
  stackId,
  catalog,
}: {
  state: WorkspaceStateV1;
  stackId: string;
  catalog: readonly PublicToolCatalogItem[];
}) {
  const stack = state.personalStacks.find((item) => item.id === stackId);
  const [draft, setDraft] = useState(stack?.name ?? "");
  if (!stack) return null;
  const available = state.saved.slugs.filter((slug) => !stack.slugs.includes(slug));

  return (
    <section className="tv-space-card">
      <form
        className="tv-space-inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim()) renamePersonalStack(stack.id, draft.trim());
        }}
      >
        <label>
          <span className="sr-only">Rinomina stack</span>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={80} />
        </label>
        <button type="submit" className="account-btn-secondary">
          Rinomina
        </button>
      </form>
      {stack.description ? <p className="tv-space-card__body">{stack.description}</p> : null}
      <ul className="tv-space-list">
        {stack.slugs.map((slug) => (
          <li key={slug} className="tv-space-row">
            <Link href={`/tools/${slug}`}>{toolName(catalog, slug)}</Link>
            <button
              type="button"
              className="account-btn-secondary"
              onClick={() => removeToolFromPersonalStack(stack.id, slug)}
            >
              Togli
            </button>
          </li>
        ))}
      </ul>
      {available.length > 0 ? (
        <label className="tv-space-search">
          <span>Aggiungi dalla biblioteca</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) addToolToPersonalStack(stack.id, event.target.value);
              event.target.value = "";
            }}
          >
            <option value="">Scegli un tool salvato</option>
            {available.map((slug) => (
              <option key={slug} value={slug}>
                {toolName(catalog, slug)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
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
