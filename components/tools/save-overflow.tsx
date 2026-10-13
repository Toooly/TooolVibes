"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * Wave 6 two-speed Save overflow + Wave 9 create/add stack from Speed 2.
 * Speed 2 = hold 400ms or ⋯. Desktop ≥1024 popover; below that a bottom sheet.
 * Intent / use-case: deferred — do not call setWorkspaceUseCase / setWorkspaceSaveReason from Save.
 * Analytics: deferred — no save_completed / save_speed2_* events in this wave.
 */

import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { toggleWorkspaceSaved } from "@/lib/account/workspace-actions";
import { StackPickOrCreate } from "@/components/tools/stack-pick-or-create";
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
import { useSaveOverflowOpen } from "@/components/tools/save-overflow-state";

export { SAVE_HOLD_MS, SAVE_HOLD_MOVE_CANCEL_PX, useSaveHold } from "@/components/tools/save-hold";

const DESKTOP_OVERFLOW_QUERY = "(min-width: 1024px)";

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
  const account = useAccount();
  const continuation = useAuthContinuation();
  const isAccount =
    account.status === "authenticated" ||
    getActiveWorkspaceOwner().kind === "account";
  const requestGuestCreate =
    !isAccount && account.status === "guest" && continuation.enabled
      ? (input: {
          desiredStackName?: string;
          targetStackId?: string;
          targetStackName?: string;
        }) => {
          continuation.requestStackCreate({
            toolSlug: slug,
            desiredStackName: input.desiredStackName,
            targetStackId: input.targetStackId,
            targetStackName: input.targetStackName,
            origin: "save-overflow",
          });
        }
      : undefined;

  const handleConfronta = () => {
    if (inCompare || compareFull) return;
    if (!getCanonicalToolWorkspaceState().saved.slugs.includes(slug)) {
      toggleWorkspaceSaved(slug);
    }
    toggleCompare(slug);
    onClose();
  };

  return (
    <div className="flex flex-col gap-3" data-save-overflow="">
      <div className="flex flex-col gap-1">
        {isSaved ? (
          <p className="text-[length:var(--tv-text-xs)] text-[var(--tv-ink-muted-aa)]"><LocalizedText>{"Nei Salvati "}</LocalizedText></p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {inCompare ? (
          <p className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] px-3 text-sm text-[var(--tv-ink-primary)]"><Check className="size-4 text-[var(--tv-accent-brand-aa)]" aria-hidden="true" /><LocalizedText>{"Nel confronto "}</LocalizedText></p>
        ) : compareFull ? (
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="ghost"
              disabled
              className="min-h-11 w-full justify-start"
            ><LocalizedText>{"Pieno · apri confronto "}</LocalizedText></Button>
            <a
              href="/compare"
              className="min-h-11 px-3 text-sm font-medium text-[var(--tv-ink-secondary)] underline-offset-2 hover:underline"
            ><LocalizedText>{"Apri confronto "}</LocalizedText></a>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleConfronta}
            className="min-h-11 w-full justify-start"
          ><LocalizedText>{"Confronta "}</LocalizedText></Button>
        )}
      </div>

      <StackPickOrCreate
        slug={slug}
        onDone={onClose}
        allowCreate={isAccount}
        onRequestAuthCreate={requestGuestCreate}
      />
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
  const panelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useDesktopSaveOverflow();
  const compareCount = useToolWorkspaceStore((state) => state.compareSlugs.length);
  const compareLive = compareCount > 0;

  const triggerClass = cn(
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--tv-border-subtle)] text-[var(--tv-ink-secondary)]",
    triggerClassName,
  );
  const triggerLabel = `Altre azioni per ${toolName}`;
  const title = (
    <span data-save-overflow-title=""><LocalizedText>{toolName}</LocalizedText></span>
  );
  const description = `Azioni per ${toolName}`;

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <LocalizedAttributes><PopoverTrigger
          type="button"
          nativeButton
          data-save-overflow-trigger=""
          className={triggerClass}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </PopoverTrigger></LocalizedAttributes>
        <PopoverContent
          ref={panelRef}
          initialFocus={panelRef}
          align="end"
          side="bottom"
          className="tv-save-overflow-popover w-72"
          data-save-overflow=""
        >
          <PopoverHeader>
            <PopoverTitle>{title}</PopoverTitle>
            <PopoverDescription className="sr-only">
              <LocalizedText>{description}</LocalizedText>
            </PopoverDescription>
          </PopoverHeader>
          <SaveOverflowPanel
            slug={slug}
            toolName={toolName}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <LocalizedAttributes><SheetTrigger
        type="button"
        nativeButton
        data-save-overflow-trigger=""
        className={triggerClass}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </SheetTrigger></LocalizedAttributes>
      <SheetContent
        ref={panelRef}
        initialFocus={panelRef}
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
          <SheetDescription className="sr-only"><LocalizedText>{description}</LocalizedText></SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-2">
          <SaveOverflowPanel
            slug={slug}
            toolName={toolName}
            onClose={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
