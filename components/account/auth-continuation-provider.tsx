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
};

const AuthContinuationContext = createContext<AuthContinuationContextValue>({
  enabled: false,
  requestStackCreate: () => "unavailable",
});

export function useAuthContinuation() {
  return useContext(AuthContinuationContext);
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
      maybeOpenOverflowAfterReplay(result.openOverflow, intent.payload.toolSlug);
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
    }),
    [requestStackCreate],
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
