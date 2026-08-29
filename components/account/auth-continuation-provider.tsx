"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAccount } from "@/components/account/account-provider";
import { AuthSheet, type AuthSheetDraft } from "@/components/account/auth-sheet";
import { canUse } from "@/lib/capabilities";
import { trackAuthGateFromIntent } from "@/lib/analytics/auth-gate-events";
import {
  consumePendingAuthIntent,
  restorePendingAuthIntent,
  type PendingAuthIntent,
} from "@/lib/auth/pending-auth-intent";
import {
  maybeOpenOverflowAfterReplay,
  replayStackCreateIntent,
} from "@/lib/auth/replay-stack-intent";
import {
  maybeOpenNoteEditorAfterReplay,
  replayNotePrivateIntent,
} from "@/lib/auth/replay-note-intent";
import {
  maybeResumePersonalSearchAfterReplay,
  replaySearchPersonalIntent,
} from "@/lib/auth/replay-search-intent";
import {
  subscribeSearchPersonalGate,
  takeSearchPersonalGate,
} from "@/lib/search/personal-search-gate";

type RequestResult = "allowed" | "gated" | "loading" | "unavailable";

type AuthContinuationContextValue = {
  enabled: boolean;
  requestStackCreate: (input: {
    toolSlug: string;
    desiredStackName?: string;
    targetStackId?: string;
    targetStackName?: string;
    origin?: string;
  }) => RequestResult;
  requestNotePrivate: (input: {
    toolSlug: string;
    origin?: string;
  }) => RequestResult;
  requestSearchPersonal: (input: {
    query: string;
    origin?: string;
    returnTo?: string;
  }) => RequestResult;
};

const AuthContinuationContext = createContext<AuthContinuationContextValue>({
  enabled: false,
  requestStackCreate: () => "unavailable",
  requestNotePrivate: () => "unavailable",
  requestSearchPersonal: () => "unavailable",
});

export function useAuthContinuation() {
  return useContext(AuthContinuationContext);
}

function payloadToolSlug(intent: PendingAuthIntent) {
  return "toolSlug" in intent.payload ? intent.payload.toolSlug : "";
}

export function AuthContinuationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AuthSheetDraft | null>(null);
  const replayedRef = useRef(false);

  const requestStackCreate = useCallback(
    (input: {
      toolSlug: string;
      desiredStackName?: string;
      targetStackId?: string;
      targetStackName?: string;
      origin?: string;
    }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("stack.create", viewer)) {
        return "allowed";
      }
      setDraft({
        toolSlug: input.toolSlug,
        desiredStackName: input.desiredStackName,
        targetStackId: input.targetStackId,
        targetStackName: input.targetStackName,
        returnTo: `/toools/${input.toolSlug}`,
        origin: input.origin ?? "stack.create",
      });
      setOpen(true);
      return "gated";
    },
    [account.status],
  );

  const requestNotePrivate = useCallback(
    (input: { toolSlug: string; origin?: string }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("note.private", viewer)) {
        return "allowed";
      }
      setDraft({
        capability: "note.private",
        toolSlug: input.toolSlug,
        returnTo: `/toools/${input.toolSlug}`,
        origin: input.origin ?? "note.private",
      });
      setOpen(true);
      return "gated";
    },
    [account.status],
  );

  const requestSearchPersonal = useCallback(
    (input: { query: string; origin?: string; returnTo?: string }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("search.personal", viewer)) {
        return "allowed";
      }
      setDraft({
        capability: "search.personal",
        query: input.query,
        returnTo: input.returnTo ?? "/",
        origin: input.origin ?? "search.personal",
      });
      setOpen(true);
      return "gated";
    },
    [account.status],
  );

  useEffect(() => {
    const pending = takeSearchPersonalGate();
    if (pending) requestSearchPersonal(pending);
    return subscribeSearchPersonalGate(() => {
      const next = takeSearchPersonalGate();
      if (!next) return;
      requestSearchPersonal(next);
    });
  }, [requestSearchPersonal]);

  useEffect(() => {
    if (account.status !== "authenticated") {
      replayedRef.current = false;
      return;
    }
    if (!account.workspaceReadyForIntentReplay) return;
    if (replayedRef.current) return;

    const consumed = consumePendingAuthIntent();
    if (consumed.status !== "ready") {
      replayedRef.current = true;
      return;
    }
    const intent: PendingAuthIntent = consumed.intent;
    if (intent.capability === "note.private") {
      const result = replayNotePrivateIntent(intent);
      if (result.status === "skipped" && result.reason === "not-authenticated") {
        restorePendingAuthIntent(intent);
        return;
      }
      replayedRef.current = true;
      if (result.status !== "ok") {
        return;
      }
      trackAuthGateFromIntent({
        name: "auth_success_from_gate",
        capability: intent.capability,
        origin: intent.origin,
        returnTo: intent.returnTo,
      });
      const finishNote = () => {
        maybeOpenNoteEditorAfterReplay(result.openEditor, payloadToolSlug(intent));
      };
      if (result.returnTo && result.returnTo !== pathname) {
        router.replace(result.returnTo);
        window.setTimeout(finishNote, 50);
        return;
      }
      finishNote();
      return;
    }
    if (intent.capability === "search.personal") {
      const result = replaySearchPersonalIntent(intent);
      if (result.status === "skipped" && result.reason === "not-authenticated") {
        restorePendingAuthIntent(intent);
        return;
      }
      replayedRef.current = true;
      if (result.status !== "ok") {
        return;
      }
      trackAuthGateFromIntent({
        name: "auth_success_from_gate",
        capability: intent.capability,
        origin: intent.origin,
        returnTo: intent.returnTo,
      });
      const finishSearch = () => {
        maybeResumePersonalSearchAfterReplay(result.query);
      };
      if (result.returnTo && result.returnTo !== pathname) {
        router.replace(result.returnTo);
        window.setTimeout(finishSearch, 50);
        return;
      }
      finishSearch();
      return;
    }
    const result = replayStackCreateIntent(intent);
    if (result.status === "skipped" && result.reason === "not-authenticated") {
      restorePendingAuthIntent(intent);
      return;
    }
    replayedRef.current = true;
    if (result.status !== "ok") {
      return;
    }
    trackAuthGateFromIntent({
      name: "auth_success_from_gate",
      capability: intent.capability,
      origin: intent.origin,
      returnTo: intent.returnTo,
    });
    const finishOverflow = () => {
      maybeOpenOverflowAfterReplay(result.openOverflow, payloadToolSlug(intent));
    };
    if (result.returnTo && result.returnTo !== pathname) {
      router.replace(result.returnTo);
      window.setTimeout(finishOverflow, 50);
      return;
    }
    finishOverflow();
  }, [
    account.status,
    account.workspaceReadyForIntentReplay,
    pathname,
    router,
  ]);

  const value = useMemo<AuthContinuationContextValue>(
    () => ({
      enabled: true,
      requestStackCreate,
      requestNotePrivate,
      requestSearchPersonal,
    }),
    [requestStackCreate, requestNotePrivate, requestSearchPersonal],
  );

  return (
    <AuthContinuationContext.Provider value={value}>
      {children}
      <AuthSheet
        open={open}
        draft={draft}
        onOpenChange={(next) => {
          if (!next) setOpen(false);
        }}
      />
    </AuthContinuationContext.Provider>
  );
}
