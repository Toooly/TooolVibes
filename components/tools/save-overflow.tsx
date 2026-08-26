"use client";

/**
 * Wave 6 two-speed Save overflow.
 * Speed 2 = hold 400ms or ⋯. Desktop ≥1024 popover; below that a bottom sheet.
 * Intent / use-case: deferred — do not call setWorkspaceUseCase / setWorkspaceSaveReason from Save.
 * Analytics: deferred — no save_completed / save_speed2_* events in this wave.
 */

import { useEffect, useState } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  addToolToPersonalStack,
  removeToolFromPersonalStack,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/workspace-events";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  MAX_COMPARE_TOOLS,
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  openSaveOverflow,
  useSaveOverflowOpen,
} from "@/components/tools/save-overflow-state";

export { SAVE_HOLD_MS, SAVE_HOLD_MOVE_CANCEL_PX, useSaveHold } from "@/components/tools/save-hold";

const DESKTOP_OVERFLOW_QUERY = "(min-width: 1024px)";
const STACK_TOAST_MS = 5000;


function useDesktopSaveOverflow() {
  // Always start false so SSR and the first client paint match (sheet trigger).
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(DESKTOP_OVERFLOW_QUERY);
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function useWorkspaceRevision() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    window.addEventListener(DISCOVERY_SYNC_EVENT, bump);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, bump);
  }, []);
}

function SaveOverflowPanel({
  slug,
  onClose,
}: {
  slug: string;
  toolName?: string;
  onClose: () => void;
}) {
  useWorkspaceRevision();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const workspace = getCanonicalToolWorkspaceState();
  const isSaved = savedSlugs.includes(slug) || workspace.saved.slugs.includes(slug);
  const inCompare = compareSlugs.includes(slug);
  const compareCount = compareSlugs.length;
  const compareFull = !inCompare && compareCount >= MAX_COMPARE_TOOLS;
  const activeStacks = workspace.personalStacks.filter((stack) => !stack.archivedAt);
  const isAccount = getActiveWorkspaceOwner().kind === "account";

  const handleConfronta = () => {
    if (inCompare || compareFull) return;
    if (!getCanonicalToolWorkspaceState().saved.slugs.includes(slug)) {
      toggleWorkspaceSaved(slug);
    }
    toggleCompare(slug);
    onClose();
  };

  const handleAddToStack = (stackId: string, stackName: string) => {
    if (getCanonicalToolWorkspaceState().personalStacks.some(
      (stack) => stack.id === stackId && stack.slugs.includes(slug),
    )) {
      return;
    }
    if (!getCanonicalToolWorkspaceState().saved.slugs.includes(slug)) {
      toggleWorkspaceSaved(slug);
    }
    addToolToPersonalStack(stackId, slug);
    if (activeStacks.length >= 2) {
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
    onClose();
  };

  return (
    <div className="flex flex-col gap-3" data-save-overflow="">
      <div className="flex flex-col gap-1">
        {isSaved ? (
          <p className="text-[length:var(--tv-text-xs)] text-[var(--tv-ink-muted-aa)]">
            Nei Salvati
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {inCompare ? (
          <p className="min-h-11 px-1 text-sm text-[var(--tv-ink-secondary)]">
            Nel confronto
          </p>
        ) : compareFull ? (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled
              className="min-h-11 rounded-lg px-3 text-left text-sm text-[var(--tv-ink-muted-aa)] opacity-60"
            >
              Pieno · apri confronto
            </button>
            <a
              href="/compare"
              className="min-h-11 px-3 text-sm font-medium text-[var(--tv-ink-secondary)] underline-offset-2 hover:underline"
            >
              Apri confronto
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfronta}
            className="min-h-11 rounded-lg px-3 text-left text-sm font-medium text-[var(--tv-ink-primary)] hover:bg-[var(--tv-surface-elevated)]"
          >
            Confronta
          </button>
        )}
      </div>

      {activeStacks.length > 0 ? (
        <div className="flex flex-col gap-1">
          {activeStacks.map((stack) => {
            const member = stack.slugs.includes(slug);
            return (
              <button
                key={stack.id}
                type="button"
                disabled={member}
                onClick={() => handleAddToStack(stack.id, stack.name)}
                className="inline-flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-left text-sm text-[var(--tv-ink-primary)] hover:bg-[var(--tv-surface-elevated)] disabled:opacity-80"
              >
                <span>{member ? `Nello stack · ${stack.name}` : `Aggiungi a ${stack.name}`}</span>
                {member ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : isAccount ? (
        <a
          href="/account?view=stack"
          className="min-h-11 px-3 text-[length:var(--tv-text-xs)] text-[var(--tv-ink-muted-aa)] underline-offset-2 hover:underline"
        >
          I tuoi stack
        </a>
      ) : (
        /* Soft login (S22) is deferred: guests with 0 stacks omit the stack
           section instead of prompting Accedi. Named-stack create-from-save is Wave 9. */
        null
      )}
    </div>
  );
}

function overflowSheetPaddingClass(compareLive: boolean) {
  return compareLive
    ? "tv-save-overflow-sheet data-[side=bottom]:pb-[calc(var(--tv-bottom-nav-total,62px)+2.75rem+env(safe-area-inset-bottom))]"
    : "tv-save-overflow-sheet data-[side=bottom]:pb-[calc(var(--tv-bottom-nav-total,62px)+env(safe-area-inset-bottom))]";
}

type SaveOverflowProps = {
  slug: string;
  toolName: string;
  triggerClassName?: string;
};

export function SaveOverflow({
  slug,
  toolName,
  triggerClassName,
}: SaveOverflowProps) {
  const { open, setOpen } = useSaveOverflowOpen(slug);
  const isDesktop = useDesktopSaveOverflow();
  const compareCount = useToolWorkspaceStore((state) => state.compareSlugs.length);
  const compareLive = compareCount > 0;

  const triggerClass = cn(
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--tv-border-subtle)] text-[var(--tv-ink-secondary)]",
    triggerClassName,
  );
  const triggerLabel = `Altre azioni per ${toolName}`;
  const title = (
    <span data-save-overflow-title="">{toolName}</span>
  );
  const description = `Azioni per ${toolName}`;

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          nativeButton
          data-save-overflow-trigger=""
          className={triggerClass}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </PopoverTrigger>
        {open ? (
          <PopoverContent
            align="end"
            side="bottom"
            className="tv-save-overflow-popover w-72"
            data-save-overflow=""
          >
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription className="sr-only">
                {description}
              </PopoverDescription>
            </PopoverHeader>
            <SaveOverflowPanel
              slug={slug}
              toolName={toolName}
              onClose={() => setOpen(false)}
            />
          </PopoverContent>
        ) : null}
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        type="button"
        nativeButton
        data-save-overflow-trigger=""
        className={triggerClass}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </SheetTrigger>
      {open ? (
        <SheetContent
          side="bottom"
          data-save-overflow=""
          data-save-overflow-sheet=""
          data-compare-live={compareLive ? "true" : undefined}
          className={cn(
            "td-final-save-overflow-sheet ar4-save-overflow-sheet",
            overflowSheetPaddingClass(compareLive),
          )}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2">
            <SaveOverflowPanel
              slug={slug}
              toolName={toolName}
              onClose={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
