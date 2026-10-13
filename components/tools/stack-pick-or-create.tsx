"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * Shared Speed 2 stack membership panel.
 * Catalogo overflow and Salvati use the same create/add writers.
 * Guest create/add opens AuthSheet via onRequestAuthCreate.
 * Leftover guest stacks remain visible; new membership mutations require auth.
 */

import { useEffect, useId, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import {
  addToolToPersonalStack,
  createPersonalStack,
  createPersonalStackId,
  removeToolFromPersonalStack,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/workspace-events";
import {
  MAX_PERSONAL_STACKS,
  MAX_STACK_NAME_LENGTH,
} from "@/lib/discovery/workspace-constants";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";
import { openSaveOverflow } from "@/components/tools/save-overflow-state";

const STACK_TOAST_MS = 5000;
const MANY_STACKS_THRESHOLD = 5;

function useWorkspaceRevision() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    window.addEventListener(DISCOVERY_SYNC_EVENT, bump);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, bump);
  }, []);
}

function ensureSaved(slug: string) {
  if (!getCanonicalToolWorkspaceState().saved.slugs.includes(slug)) {
    toggleWorkspaceSaved(slug);
  }
}

function notifyFiled(stackId: string, stackName: string, slug: string) {
  const activeCount = getCanonicalToolWorkspaceState().personalStacks.filter(
    (stack) => !stack.archivedAt,
  ).length;
  if (activeCount < 2) return;
  toast(`Salvato in ${stackName}`, {
    duration: STACK_TOAST_MS,
    action: {
      label: "Annulla",
      onClick: () => {
        removeToolFromPersonalStack(stackId, slug);
      },
    },
    cancel: {
      label: "Cambia",
      onClick: () => {
        openSaveOverflow(slug);
      },
    },
  });
}

function fileToExistingStack(stackId: string, stackName: string, slug: string) {
  const workspace = getCanonicalToolWorkspaceState();
  if (
    workspace.personalStacks.some(
      (stack) => stack.id === stackId && stack.slugs.includes(slug),
    )
  ) {
    return;
  }
  ensureSaved(slug);
  addToolToPersonalStack(stackId, slug);
  notifyFiled(stackId, stackName, slug);
}

function createNamedStackAndAdd(name: string, slug: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getCanonicalToolWorkspaceState();
  const activeCount = current.personalStacks.filter((stack) => !stack.archivedAt).length;
  if (activeCount >= MAX_PERSONAL_STACKS) return;
  ensureSaved(slug);
  const ids = getCanonicalToolWorkspaceState().personalStacks.map((stack) => stack.id);
  const id = createPersonalStackId(trimmed, ids);
  createPersonalStack(trimmed);
  addToolToPersonalStack(id, slug);
  notifyFiled(id, trimmed, slug);
}

export function StackPickOrCreate({
  slug,
  onDone,
  allowCreate,
  onRequestAuthCreate,
  compact = false,
}: {
  slug: string;
  onDone?: () => void;
  allowCreate: boolean;
  onRequestAuthCreate?: (input: {
    desiredStackName?: string;
    targetStackId?: string;
    targetStackName?: string;
  }) => void;
  compact?: boolean;
}) {
  useWorkspaceRevision();
  const headingId = useId();
  const [draftName, setDraftName] = useState("");
  const [filter, setFilter] = useState("");
  const workspace = getCanonicalToolWorkspaceState();
  const activeStacks = workspace.personalStacks.filter((stack) => !stack.archivedAt);
  const canCreate = allowCreate && activeStacks.length < MAX_PERSONAL_STACKS;
  const showCreate =
    (canCreate || Boolean(onRequestAuthCreate)) &&
    activeStacks.length < MAX_PERSONAL_STACKS;
  const manyStacks = activeStacks.length > MANY_STACKS_THRESHOLD;

  const visibleStacks = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return activeStacks;
    return activeStacks.filter((stack) => stack.name.toLowerCase().includes(needle));
  }, [activeStacks, filter]);

  if (activeStacks.length === 0 && !showCreate) {
    return null;
  }

  const handleCreate = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    if (canCreate) {
      createNamedStackAndAdd(trimmed, slug);
      setDraftName("");
      onDone?.();
      return;
    }
    onRequestAuthCreate?.({ desiredStackName: trimmed });
    setDraftName("");
    onDone?.();
  };

  return (
    <section
      className={cn("tv-stack-pick flex flex-col gap-1.5", compact && "tv-stack-pick--compact gap-1")}
      data-stack-pick=""
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className="px-1 text-[length:var(--tv-text-xs)] font-medium text-[var(--tv-ink-secondary)]"
      ><LocalizedText>{"Aggiungi a uno stack "}</LocalizedText></h3>

      {manyStacks ? (
        <label className="px-1">
          <span className="sr-only"><LocalizedText>{"Filtra stack"}</LocalizedText></span>
          <LocalizedAttributes><input
            data-stack-pick-filter=""
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtra stack"
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-[var(--tv-border-subtle)] bg-transparent px-3 text-sm text-[var(--tv-ink-primary)]"
          /></LocalizedAttributes>
        </label>
      ) : null}

      {activeStacks.length > 0 ? (
        <div
          data-stack-pick-list=""
          className={cn(
            "flex flex-col gap-1",
            manyStacks && "max-h-48 overflow-y-auto overscroll-contain",
          )}
        >
          {visibleStacks.map((stack) => {
            const member = stack.slugs.includes(slug);
            return (
              <button
                key={stack.id}
                type="button"
                disabled={member}
                onClick={() => {
                  if (!allowCreate) {
                    onRequestAuthCreate?.({
                      targetStackId: stack.id,
                      targetStackName: stack.name,
                    });
                    onDone?.();
                    return;
                  }
                  fileToExistingStack(stack.id, stack.name, slug);
                  onDone?.();
                }}
                className="inline-flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-left text-sm text-[var(--tv-ink-primary)] hover:bg-[var(--tv-surface-elevated)] disabled:opacity-80"
              >
                <span>
                  <LocalizedText>{member ? `Nello stack · ${stack.name}` : `Aggiungi a ${stack.name}`}</LocalizedText>
                </span>
                {member ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {showCreate ? (
        <form
          data-stack-pick-create=""
          className="flex flex-col gap-1.5 px-1"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[length:var(--tv-text-xs)] text-[var(--tv-ink-secondary)]"><LocalizedText>{"Nuovo stack "}</LocalizedText></span>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setDraftName("");
                }
              }}
              maxLength={MAX_STACK_NAME_LENGTH}
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-[var(--tv-border-subtle)] bg-transparent px-3 text-sm text-[var(--tv-ink-primary)]"
            />
          </label>
          <button
            type="submit"
            disabled={draftName.trim() === ""}
            className="min-h-11 rounded-lg px-3 text-left text-sm font-medium text-[var(--tv-ink-primary)] hover:bg-[var(--tv-surface-elevated)] disabled:opacity-50"
          ><LocalizedText>{"Crea "}</LocalizedText></button>
        </form>
      ) : null}
    </section>
  );
}
