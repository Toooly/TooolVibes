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
  maybeOpenDeepCompareAfterReplay,
  replayCompareDeepIntent,
} from "@/lib/auth/replay-compare-intent";
import {
  maybeOpenInsightLayerAfterReplay,
  replayInsightPersonalIntent,
} from "@/lib/auth/replay-insight-intent";
import {
  maybeOpenRadarPersonalAfterReplay,
  replayRadarPersonalIntent,
} from "@/lib/auth/replay-radar-intent";
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
  requestCompareDeep: (input?: {
    origin?: string;
    returnTo?: string;
  }) => RequestResult;
  requestInsightPersonal: (input: {
    toolSlug: string;
    origin?: string;
  }) => RequestResult;
  requestRadarPersonal: (input?: {
    origin?: string;
    returnTo?: string;
  }) => RequestResult;
};

const AuthContinuationContext = createContext<AuthContinuationContextValue>({
  enabled: false,
  requestStackCreate: () => "unavailable",
  requestNotePrivate: () => "unavailable",
  requestSearchPersonal: () => "unavailable",
  requestCompareDeep: () => "unavailable",
  requestInsightPersonal: () => "unavailable",
  requestRadarPersonal: () => "unavailable",
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

  const requestCompareDeep = useCallback(
    (input?: { origin?: string; returnTo?: string }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("compare.deep", viewer)) {
        return "allowed";
      }
      setDraft({
        capability: "compare.deep",
        returnTo: input?.returnTo ?? "/compare",
        origin: input?.origin ?? "compare.deep",
      });
      setOpen(true);
      return "gated";
    },
    [account.status],
  );

  const requestInsightPersonal = useCallback(
    (input: { toolSlug: string; origin?: string }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("insight.personal", viewer)) {
        return "allowed";
      }
      setDraft({
        capability: "insight.personal",
        toolSlug: input.toolSlug,
        returnTo: `/toools/${input.toolSlug}`,
        origin: input.origin ?? "insight.personal",
      });
      setOpen(true);
      return "gated";
    },
    [account.status],
  );

  const requestRadarPersonal = useCallback(
    (input?: { origin?: string; returnTo?: string }): RequestResult => {
      if (account.status === "loading") return "loading";
      if (account.status === "unavailable") return "unavailable";
      const viewer = account.status === "authenticated" ? "authenticated" : "guest";
      if (canUse("radar.personal", viewer)) {
        return "allowed";
      }
      setDraft({
        capability: "radar.personal",
        returnTo: input?.returnTo ?? "/radar",
        origin: input?.origin ?? "radar.personal",
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
    if (intent.capability === "insight.personal") {
      const result = replayInsightPersonalIntent(intent);
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
      const finishInsight = () => {
        maybeOpenInsightLayerAfterReplay(result.openLayer, payloadToolSlug(intent));
      };
      if (result.returnTo && result.returnTo !== pathname) {
        router.replace(result.returnTo);
        window.setTimeout(finishInsight, 50);
        return;
      }
      finishInsight();
      return;
    }
    if (intent.capability === "radar.personal") {
      const result = replayRadarPersonalIntent(intent);
      if (result.status === "skipped" && result.reason === "not-authenticated") {
        restorePendingAuthIntent(intent);
        replayedRef.current = false;
        return;
      }
      replayedRef.current = true;
      if (result.status !== "ok") return;
      trackAuthGateFromIntent({
        name: "auth_success_from_gate",
        capability: intent.capability,
        origin: intent.origin,
        returnTo: result.returnTo,
      });
      if (result.returnTo) {
        router.replace(result.returnTo);
      }
      window.setTimeout(() => {
        maybeOpenRadarPersonalAfterReplay(result.openPersonal);
      }, 50);
      return;
    }

    if (intent.capability === "compare.deep") {
      const result = replayCompareDeepIntent(intent);
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
      const finishCompare = () => {
        maybeOpenDeepCompareAfterReplay(result.openDeep);
      };
      if (result.returnTo && result.returnTo !== pathname) {
        router.replace(result.returnTo);
        window.setTimeout(finishCompare, 50);
        return;
      }
      finishCompare();
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
      requestCompareDeep,
      requestInsightPersonal,
      requestRadarPersonal,
    }),
    [requestStackCreate, requestNotePrivate, requestSearchPersonal, requestCompareDeep, requestInsightPersonal, requestRadarPersonal],
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
