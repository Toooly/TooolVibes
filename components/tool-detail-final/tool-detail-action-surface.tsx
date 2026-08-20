"use client";

/**
 * TooolVibes — Tool Detail FINAL — Action Surface (A.2)
 *
 * 44×44 controls: external CTA, Save, Compare, rank chip, shortcut CTA.
 * Reads / writes the canonical tool workspace store.
 * Respects MIN_COMPARE_TOOLS=2 / MAX_COMPARE_TOOLS=5.
 *
 * Namespace: .td-final-*
 */

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Columns3, ExternalLink } from "lucide-react";

import {
  addToolToPersonalStack,
  markWorkspaceToolUsing,
} from "@/lib/account/workspace-actions";
import { usageActionLabel } from "@/lib/account/workspace-lifecycle";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";
import {
  WorkspacePersonalStatusBadge,
  usePersonalToolStatus,
} from "@/components/account/workspace/workspace-personal-status";

type ToolDetailActionSurfaceProps = {
  slug: string;
  name: string;
  externalUrl: string;
  primaryLabel: string;
  isAffiliateLink?: boolean;
};

export function ToolDetailActionSurface({
  slug,
  name,
  externalUrl,
  primaryLabel,
  isAffiliateLink = false,
}: ToolDetailActionSurfaceProps) {
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleSaved = useToolWorkspaceStore((s) => s.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const status = usePersonalToolStatus(slug);
  const [stackUiReady, setStackUiReady] = useState(false);
  useEffect(() => {
    setStackUiReady(true);
  }, []);
  const workspace = getCanonicalToolWorkspaceState();

  const isSaved = savedSlugs.includes(slug);
  const compareRank = useMemo(
    () => (compareSlugs.includes(slug) ? compareSlugs.indexOf(slug) + 1 : 0),
    [compareSlugs, slug],
  );
  const compareCount = compareSlugs.length;
  const isAtMax = compareCount >= MAX_COMPARE_TOOLS;
  const canMarkUsing = status?.key === "selected";
  const activeStacks = stackUiReady
    ? workspace.personalStacks.filter((stack) => !stack.archivedAt)
    : [];
  const containingStacks = activeStacks.filter((stack) => stack.slugs.includes(slug));
  const availableStacks = activeStacks.filter((stack) => !stack.slugs.includes(slug));
  const isAccountWorkspace =
    stackUiReady && getActiveWorkspaceOwner().kind === "account";
  const showStackSelect = availableStacks.length > 0;
  const showStackLink = activeStacks.length === 0 && isAccountWorkspace;

  return (
    <div className="td-final-actions" role="group" aria-label="Azioni scheda">
      <WorkspacePersonalStatusBadge slug={slug} />

      <button
        type="button"
        onClick={() => toggleCompare(slug)}
        className="td-final-cta--primary"
        aria-pressed={compareRank > 0}
        aria-label={
          compareRank > 0
            ? `Rimuovi dal confronto (posizione ${compareRank})`
            : isAtMax
              ? `Limite di ${MAX_COMPARE_TOOLS} tool raggiunto`
              : "Aggiungi al confronto"
        }
        title={
          compareRank > 0
            ? `Confronto #${String(compareRank).padStart(2, "0")}`
            : isAtMax
              ? "Limite raggiunto"
              : "Confronta"
        }
      >
        <Columns3 size={17} aria-hidden="true" />
        <span>{compareRank > 0 ? "Rimuovi dal confronto" : "Aggiungi al confronto"}</span>
      </button>

      <button
        type="button"
        onClick={() => toggleSaved(slug)}
        className={cn("td-final-cta--save", isSaved && "is-saved")}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Rimuovi dai salvati" : "Salva"}
        title={isSaved ? "Salvato" : "Salva"}
      >
        <Bookmark
          size={17}
          aria-hidden="true"
          fill={isSaved ? "currentColor" : "none"}
        />
        <span>{isSaved ? "Salvato" : "Salva"}</span>
      </button>

      {canMarkUsing ? (
        <button
          type="button"
          className="td-final-cta--secondary"
          onClick={() => markWorkspaceToolUsing(slug)}
        >
          {usageActionLabel("using")}
        </button>
      ) : null}

      {showStackSelect ? (
        <label className="inline-flex min-h-11 items-center gap-2 text-[length:var(--tv-text-xs)] text-[var(--tv-ink-secondary)]">
          <span>Aggiungi allo stack</span>
          <select
            aria-label="Aggiungi allo stack"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                addToolToPersonalStack(event.target.value, slug);
              }
              event.target.value = "";
            }}
          >
            <option value="">Scegli stack</option>
            {availableStacks.map((stack) => (
              <option key={stack.id} value={stack.id}>
                {stack.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showStackLink ? (
        <a
          href="/account?view=stack"
          className="text-[length:var(--tv-text-xs)] font-medium text-[var(--tv-ink-muted-aa)] underline-offset-2 hover:underline"
        >
          Aggiungi allo stack
        </a>
      ) : null}

      {containingStacks.length > 0 ? (
        <span className="text-[length:var(--tv-text-xs)] text-[var(--tv-ink-muted-aa)]">
          Nello stack: {containingStacks.map((stack) => stack.name).join(", ")}
        </span>
      ) : null}

      <a
        href={externalUrl}
        target="_blank"
        rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        className="td-final-cta--secondary"
        aria-label={`${primaryLabel} di ${name} in una nuova scheda`}
      >
        <span>Visita il sito ufficiale</span>
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      {isAffiliateLink ? (
        <span className="td-final-affiliate-note">
          Link affiliato: potremmo ricevere una commissione senza costi extra per te.
        </span>
      ) : null}

      {compareRank > 0 ? (
        <span
          className="td-final-compare-rank"
          aria-label={`Selezionato, posizione ${compareRank}`}
        >
          #{String(compareRank).padStart(2, "0")}
          <span className="td-final-compare-rank__suffix">
            di {compareCount}/{MAX_COMPARE_TOOLS}
          </span>
        </span>
      ) : null}

      {compareCount > 0 ? (
        <a
          href="/compare"
          className={cn(
            "td-final-cta--secondary",
            compareCount >= MIN_COMPARE_TOOLS && "is-ready",
          )}
          aria-label={
            compareCount >= MIN_COMPARE_TOOLS
              ? "Apri la pagina di confronto"
              : `Aggiungi ancora ${MIN_COMPARE_TOOLS - compareCount} tool per attivare il confronto`
          }
        >
          <span>
            {compareCount >= MIN_COMPARE_TOOLS
              ? "Apri confronto"
              : `Confronto · ${compareCount}/${MAX_COMPARE_TOOLS}`}
          </span>
        </a>
      ) : null}
    </div>
  );
}
