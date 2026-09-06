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

import type { Session, User } from "@supabase/supabase-js";

import {
  DISCOVERY_SYNC_EVENT,
  readWorkspaceChangeDetail,
} from "@/lib/discovery/workspace-events";
import {
  applyCanonicalRemotePayload,
  clearAccountWorkspaceRecovery,
  finalizeGuestWorkspaceClaim,
  getWorkspaceAttachSnapshot,
  getWorkspaceGuestContribution,
  hasQuarantinedWorkspaceRecovery,
  initializeWorkspaceOwnerProvenance,
  isolateWorkspaceAfterLogout,
  preserveAccountWorkspaceRecovery,
  requestWorkspaceMutation,
  restoreLatestQuarantinedWorkspace,
  stageWorkspaceForAccount,
  withWorkspaceGuestClaimLock,
} from "@/lib/discovery/workspace-sync-client";
import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
  loadBrowserSupabaseRuntimeConfig,
} from "@/lib/supabase/browser-client";
import { mapAuthProviderError } from "@/lib/auth/auth-messages";
import { oauthProviderLabel, oauthRedirectTo, type OAuthProviderId } from "@/lib/auth/oauth-providers";

type AccountStatus = "loading" | "guest" | "authenticated" | "unavailable";
type AccountMagicLinkMetadata = Record<string, string | number | boolean | null | undefined>;

export type AccountContextValue = {
  authEnabled: boolean;
  status: AccountStatus;
  user: User | null;
  session: Session | null;
  isSendingLink: boolean;
  isAttaching: boolean;
  workspaceAttachPending: boolean;
  hasQuarantinedWorkspace: boolean;
  isRestoringQuarantinedWorkspace: boolean;
  authMessage?: string | null;
  sendMagicLink: (
    email: string,
    metadata?: AccountMagicLinkMetadata,
  ) => Promise<{ ok: boolean; message: string }>;
  signInWithOAuth?: (
    provider: OAuthProviderId,
  ) => Promise<{ ok: boolean; message: string }>;
  linkIdentity?: (
    provider: OAuthProviderId,
  ) => Promise<{ ok: boolean; message: string }>;
  restoreQuarantinedWorkspace: () => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  workspaceReadyForIntentReplay: boolean;
};

const AccountContext = createContext<AccountContextValue>({
  authEnabled: false,
  status: "unavailable",
  user: null,
  session: null,
  isSendingLink: false,
  isAttaching: false,
  workspaceAttachPending: false,
  hasQuarantinedWorkspace: false,
  isRestoringQuarantinedWorkspace: false,
  authMessage: null,
  sendMagicLink: async () => ({ ok: false, message: "Accesso email non disponibile." }),
  signInWithOAuth: async () => ({ ok: false, message: "Accesso non disponibile." }),
  linkIdentity: async () => ({ ok: false, message: "Accesso non disponibile." }),
  restoreQuarantinedWorkspace: async () => ({
    ok: false,
    message: "Nessuna selezione locale da ripristinare.",
  }),
  signOut: async () => {},
  workspaceReadyForIntentReplay: false,
});

export function AccountProvider({
  children,
  initialAuthEnabled = false,
}: {
  children: React.ReactNode;
  initialAuthEnabled?: boolean;
}) {
  /* Public values can exist only in Worker runtime bindings and be absent
     from the Workers Builds client bundle. The Server Component prop keeps
     SSR and the first client render identical; bootstrap then refreshes the
     full configuration from /api/auth/config. */
  const [authEnabled, setAuthEnabled] = useState(initialAuthEnabled);
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [workspaceAttachPending, setWorkspaceAttachPending] = useState(false);
  const [hasQuarantinedWorkspace, setHasQuarantinedWorkspace] = useState(false);
  const [isRestoringQuarantinedWorkspace, setIsRestoringQuarantinedWorkspace] =
    useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [workspaceReadyForIntentReplay, setWorkspaceReadyForIntentReplay] =
    useState(false);
  const sessionRef = useRef<Session | null>(null);
  const localSignOutRef = useRef(false);
  const signOutInProgressRef = useRef(false);
  const lastAttachedUserIdRef = useRef<string | null>(null);
  const attachInFlightUserIdRef = useRef<string | null>(null);
  const lifecycleVersionRef = useRef(0);
  const workspaceProvenanceReadyRef = useRef(false);
  const attachRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceChangeRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceChangeRetryQueuedRef = useRef(false);
  const attachRetryAttemptRef = useRef(0);
  const attachWorkspaceToAccountRef = useRef<
    (currentSession: Session | null) => Promise<void>
  >(async () => {});

  const clearAttachRetry = useCallback(() => {
    if (attachRetryTimerRef.current !== null) {
      clearTimeout(attachRetryTimerRef.current);
      attachRetryTimerRef.current = null;
    }
  }, []);

  const scheduleAttachRetry = useCallback((
    currentSession: Session,
    lifecycleVersion: number,
  ) => {
    clearAttachRetry();
    const attempt = attachRetryAttemptRef.current;
    if (attempt >= 3) return;
    const delay = [2_000, 8_000, 30_000][attempt];
    attachRetryAttemptRef.current += 1;
    attachRetryTimerRef.current = setTimeout(() => {
      attachRetryTimerRef.current = null;
      if (lifecycleVersionRef.current !== lifecycleVersion ||
          signOutInProgressRef.current ||
          sessionRef.current?.user.id !== currentSession.user.id) {
        return;
      }
      void attachWorkspaceToAccountRef.current(sessionRef.current);
    }, delay);
  }, [clearAttachRetry]);

  const attachWorkspaceToAccount = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token || signOutInProgressRef.current ||
        !workspaceProvenanceReadyRef.current) {
      return;
    }

    const accountUserId = currentSession.user.id;
    if (lastAttachedUserIdRef.current === accountUserId ||
        attachInFlightUserIdRef.current === accountUserId) {
      return;
    }

    const lifecycleVersion = lifecycleVersionRef.current;
    attachInFlightUserIdRef.current = accountUserId;
    setIsAttaching(true);
    setWorkspaceReadyForIntentReplay(false);

    try {
      const staged = await withWorkspaceGuestClaimLock(
        (lockHeld) => {
          const accountSnapshot = getWorkspaceAttachSnapshot(accountUserId);
          const guestContribution = getWorkspaceGuestContribution(accountUserId);
          return stageWorkspaceForAccount(
            accountUserId,
            accountSnapshot,
            guestContribution,
            { guestClaimLockHeld: lockHeld },
          );
        },
      );
      setWorkspaceAttachPending(staged.guestPending);
      if (!staged.ready) {
        setAuthMessage(
          "La selezione resta al sicuro in locale, ma il collegamento è in pausa finché lo storage del browser non torna disponibile.",
        );
        return;
      }
      const result = await requestWorkspaceMutation(
        "/api/workspace-account/attach",
        currentSession.access_token,
        staged.requestAccountState,
        { maxConflictRetries: 1, guestState: staged.requestGuestState },
      );

      if (lifecycleVersionRef.current !== lifecycleVersion ||
          signOutInProgressRef.current ||
          sessionRef.current?.user.id !== accountUserId) {
        return;
      }

      const { response, payload } = result;
      if (response.ok && payload?.meta.remote_available &&
          payload.meta.mode === "remote" &&
          payload.meta.viewer_kind === "account") {
        const applied = applyCanonicalRemotePayload(payload, {
          owner: { kind: "account", userId: accountUserId },
          reason: "attach",
          baseState: staged.state,
        });
        if (applied.recoveryRequired) {
          setAuthMessage(
            "Account collegato, ma serve spazio locale per completare il salvataggio in sicurezza.",
          );
          return;
        }
        const finalizedGuestClaim = await withWorkspaceGuestClaimLock(
          (lockHeld) => finalizeGuestWorkspaceClaim(accountUserId, {
            guestClaimLockHeld: lockHeld,
          }),
        );
        if (!finalizedGuestClaim) {
          setAuthMessage(
            "Account collegato; la pulizia della selezione guest sarà ritentata senza perdere dati.",
          );
          return;
        }
        clearAccountWorkspaceRecovery(accountUserId);
        clearAttachRetry();
        attachRetryAttemptRef.current = 0;
        lastAttachedUserIdRef.current = accountUserId;
        workspaceChangeRetryQueuedRef.current = false;
        setWorkspaceAttachPending(false);
        setAuthMessage(null);
        setWorkspaceReadyForIntentReplay(true);
        return;
      }

      if (response.status === 429 || response.status >= 500) {
        scheduleAttachRetry(currentSession, lifecycleVersion);
      }
      if (response.status === 422 &&
          payload?.meta.error === "workspace-capacity-exceeded") {
        setAuthMessage(
          "La selezione locale supera il limite di sincronizzazione. Riduci salvati, stack o note non più utili: il collegamento ripartirà automaticamente e nessun dato verrà cancellato.",
        );
        return;
      }
      setAuthMessage(
        "Il salvataggio online non è disponibile. Le modifiche restano su questo dispositivo.",
      );
    } catch {
      if (lifecycleVersionRef.current === lifecycleVersion &&
          !signOutInProgressRef.current) {
        scheduleAttachRetry(currentSession, lifecycleVersion);
        setAuthMessage(
          "Sei offline o il salvataggio è in pausa. Le modifiche restano su questo dispositivo e riprenderanno automaticamente.",
        );
      }
    } finally {
      if (attachInFlightUserIdRef.current === accountUserId) {
        attachInFlightUserIdRef.current = null;
      }
      if (lifecycleVersionRef.current === lifecycleVersion &&
          !signOutInProgressRef.current) {
        setIsAttaching(false);
      }
      if (workspaceChangeRetryQueuedRef.current &&
          lifecycleVersionRef.current === lifecycleVersion &&
          !signOutInProgressRef.current &&
          lastAttachedUserIdRef.current !== accountUserId &&
          sessionRef.current?.user.id === accountUserId) {
        workspaceChangeRetryQueuedRef.current = false;
        if (workspaceChangeRetryTimerRef.current !== null) {
          clearTimeout(workspaceChangeRetryTimerRef.current);
        }
        workspaceChangeRetryTimerRef.current = setTimeout(() => {
          workspaceChangeRetryTimerRef.current = null;
          void attachWorkspaceToAccountRef.current(sessionRef.current);
        }, 0);
      }
    }
  }, [clearAttachRetry, scheduleAttachRetry]);

  attachWorkspaceToAccountRef.current = attachWorkspaceToAccount;

  useEffect(() => {
    if (!workspaceAttachPending || typeof window === "undefined") return;

    const retryAfterWorkspaceChange = (event: Event) => {
      const detail = readWorkspaceChangeDetail(event);
      if (detail?.scope !== "workspace" ||
          (detail.source !== "local" && detail.source !== "cross-tab")) {
        return;
      }
      workspaceChangeRetryQueuedRef.current = true;
      if (workspaceChangeRetryTimerRef.current !== null) {
        clearTimeout(workspaceChangeRetryTimerRef.current);
      }
      workspaceChangeRetryTimerRef.current = setTimeout(() => {
        workspaceChangeRetryTimerRef.current = null;
        const currentSession = sessionRef.current;
        if (!currentSession || signOutInProgressRef.current) return;
        if (attachInFlightUserIdRef.current === currentSession.user.id) return;
        workspaceChangeRetryQueuedRef.current = false;
        void attachWorkspaceToAccountRef.current(currentSession);
      }, 300);
    };

    window.addEventListener(DISCOVERY_SYNC_EVENT, retryAfterWorkspaceChange);
    return () => {
      window.removeEventListener(DISCOVERY_SYNC_EVENT, retryAfterWorkspaceChange);
      if (workspaceChangeRetryTimerRef.current !== null) {
        clearTimeout(workspaceChangeRetryTimerRef.current);
        workspaceChangeRetryTimerRef.current = null;
      }
    };
  }, [workspaceAttachPending]);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      // Hard cap on the runtime-config fetch so a stuck /api/auth/config
      // cannot leave the user stuck on the "Stiamo preparando il tuo spazio"
      // loading screen. Without this, a slow/missing network keeps status
      // == "loading" indefinitely; with it, we degrade to "guest" after 5s.
      const configTimeoutMs = 5000;
      let configTimedOut = false;
      await Promise.race([
        loadBrowserSupabaseRuntimeConfig(),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            configTimedOut = true;
            resolve();
          }, configTimeoutMs);
        }),
      ]);
      if (!isActive) {
        return;
      }
      if (configTimedOut) {
        // Fall through; treat as if Supabase is not enabled so we degrade
        // to guest instead of staying on the loading screen.
      }

      const enabled = isSupabaseBrowserEnabled();

      if (!isActive) {
        return;
      }

      setAuthEnabled(enabled);

      if (!enabled) {
        setWorkspaceAttachPending(false);
        const provenance = initializeWorkspaceOwnerProvenance({ kind: "guest" });
        workspaceProvenanceReadyRef.current = provenance.ready;
        setHasQuarantinedWorkspace(hasQuarantinedWorkspaceRecovery());
        if (provenance.legacyQuarantined) {
          setAuthMessage(
            "Una selezione locale precedente è stata conservata separatamente per evitare di attribuirla all'utente sbagliato.",
          );
        }
        setStatus("unavailable");
        return;
      }

      const client = getBrowserSupabaseClient();
      const { data } = await client.auth.getSession();

      if (!isActive) {
        return;
      }

      const currentSession = data.session;
      const provenance = initializeWorkspaceOwnerProvenance(
        currentSession?.user
          ? { kind: "account", userId: currentSession.user.id }
          : { kind: "guest" },
      );
      workspaceProvenanceReadyRef.current = provenance.ready;
      setHasQuarantinedWorkspace(hasQuarantinedWorkspaceRecovery());
      if (provenance.legacyQuarantined) {
        setAuthMessage(
          "Una selezione locale precedente è stata conservata separatamente per evitare di attribuirla all'account sbagliato.",
        );
      }
      if ((sessionRef.current?.user.id ?? null) !== (currentSession?.user.id ?? null)) {
        lifecycleVersionRef.current += 1;
      }
      sessionRef.current = currentSession;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession?.user ? "authenticated" : "guest");

      if (currentSession?.user) {
        void attachWorkspaceToAccount(currentSession);
      }

      const { data: authListener } = client.auth.onAuthStateChange((event, nextSession) => {
        const previousSession = sessionRef.current;
        const previousUserId = previousSession?.user.id ?? null;
        const nextUserId = nextSession?.user.id ?? null;
        if (previousUserId !== nextUserId) {
          lifecycleVersionRef.current += 1;
        }
        sessionRef.current = nextSession;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setStatus(nextSession?.user ? "authenticated" : "guest");

        if (!nextSession?.user) {
          setWorkspaceReadyForIntentReplay(false);
          if (event === "SIGNED_OUT" && previousSession?.user.id) {
            const failClosedIsolation = isolateWorkspaceAfterLogout(
              previousSession.user.id,
            );
            if (!localSignOutRef.current) {
              void withWorkspaceGuestClaimLock((lockHeld) => lockHeld
                ? isolateWorkspaceAfterLogout(previousSession.user.id, {
                    guestClaimLockHeld: true,
                  })
                : failClosedIsolation);
            }
          }
          lastAttachedUserIdRef.current = null;
          attachInFlightUserIdRef.current = null;
          setIsAttaching(false);
          setWorkspaceAttachPending(false);
          workspaceChangeRetryQueuedRef.current = false;
          clearAttachRetry();
          attachRetryAttemptRef.current = 0;
          return;
        }

        if (previousUserId !== nextUserId) {
          setWorkspaceAttachPending(false);
          workspaceChangeRetryQueuedRef.current = false;
          clearAttachRetry();
          attachRetryAttemptRef.current = 0;
          const nextProvenance = initializeWorkspaceOwnerProvenance({
            kind: "account",
            userId: nextSession.user.id,
          });
          workspaceProvenanceReadyRef.current = nextProvenance.ready;
          setHasQuarantinedWorkspace(hasQuarantinedWorkspaceRecovery());
        }

        void attachWorkspaceToAccount(nextSession);
      });

      unsubscribe = () => authListener.subscription.unsubscribe();
    }

    void bootstrap();

    return () => {
      isActive = false;
      lifecycleVersionRef.current += 1;
      clearAttachRetry();
      unsubscribe?.();
    };
  }, [attachWorkspaceToAccount, clearAttachRetry]);

  const sendMagicLink = useCallback(async (email: string, metadata?: AccountMagicLinkMetadata) => {
    if (!isSupabaseBrowserEnabled()) {
      const message = "Accesso email non disponibile in questo momento.";
      setAuthMessage(message);
      return {
        ok: false,
        message,
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      const message = "Inserisci una email valida.";
      setAuthMessage(message);
      return {
        ok: false,
        message,
      };
    }

    setIsSendingLink(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          metadata,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        const message =
          payload.message ??
          "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco.";
        setAuthMessage(message);
        return {
          ok: false,
          message,
        };
      }

      const message =
        payload.message ??
        (metadata?.source === "vibe-rush"
          ? `Email di conferma inviata a ${normalizedEmail}. Aprila per creare l'account e salvare anche il risultato Vibe Rush.`
          : `Email di conferma inviata a ${normalizedEmail}. Aprila per creare o collegare l'account alla tua selezione.`);
      setAuthMessage(message);

      return {
        ok: true,
        message,
      };
    } catch {
      const message =
        "Non siamo riusciti a preparare il link di accesso. Riprova tra poco.";
      setAuthMessage(message);
      return {
        ok: false,
        message,
      };
    } finally {
      setIsSendingLink(false);
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProviderId) => {
    if (!isSupabaseBrowserEnabled()) {
      const message = "Accesso non disponibile in questo momento.";
      setAuthMessage(message);
      return { ok: false, message };
    }

    setIsSendingLink(true);
    setAuthMessage(null);

    try {
      const client = getBrowserSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: oauthRedirectTo(),
          skipBrowserRedirect: false,
          queryParams:
            provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (error) {
        const message = mapAuthProviderError(error);
        setAuthMessage(message);
        return { ok: false, message };
      }
      return { ok: true, message: "Ti stiamo portando al provider." };
    } catch (error) {
      const message = mapAuthProviderError(
        error instanceof Error ? error.message : null,
      );
      setAuthMessage(message);
      return { ok: false, message };
    } finally {
      setIsSendingLink(false);
    }
  }, []);

  const linkIdentity = useCallback(async (provider: OAuthProviderId) => {
    if (!isSupabaseBrowserEnabled()) {
      const message = "Accesso non disponibile in questo momento.";
      setAuthMessage(message);
      return { ok: false, message };
    }

    setIsSendingLink(true);
    setAuthMessage(null);

    try {
      const client = getBrowserSupabaseClient();
      const { error } = await client.auth.linkIdentity({
        provider,
        options: { redirectTo: oauthRedirectTo() },
      });
      if (error) {
        const message = mapAuthProviderError(error);
        setAuthMessage(message);
        return { ok: false, message };
      }
      return { ok: true, message: `Ti stiamo portando a ${oauthProviderLabel(provider)}.` };
    } catch (error) {
      const message = mapAuthProviderError(
        error instanceof Error ? error.message : null,
      );
      setAuthMessage(message);
      return { ok: false, message };
    } finally {
      setIsSendingLink(false);
    }
  }, []);

  const restoreQuarantinedWorkspace = useCallback(async () => {
    if (isAttaching) {
      const message = "Attendi la fine del collegamento prima di ripristinare la selezione locale.";
      setAuthMessage(message);
      return { ok: false, message };
    }

    setIsRestoringQuarantinedWorkspace(true);
    try {
      const currentSession = sessionRef.current;
      const owner = currentSession?.user.id
        ? { kind: "account" as const, userId: currentSession.user.id }
        : { kind: "guest" as const };
      const result = restoreLatestQuarantinedWorkspace(owner);
      const recoveryStillAvailable = hasQuarantinedWorkspaceRecovery();
      setHasQuarantinedWorkspace(recoveryStillAvailable);

      if (!result.restored) {
        const message = result.reason === "backup-unavailable"
          ? "Il backup locale non è più disponibile. Nessun dato è stato modificato."
          : "Il ripristino locale non è disponibile in questo browser. Nessun dato è stato modificato.";
        setAuthMessage(message);
        return { ok: false, message };
      }

      const message = result.recoveryRecorded
        ? "La selezione locale è stata ripristinata nello spazio corrente."
        : "La selezione è stata ripristinata; la copia di sicurezza resta disponibile su questo dispositivo.";
      setAuthMessage(message);
      return { ok: true, message };
    } finally {
      setIsRestoringQuarantinedWorkspace(false);
    }
  }, [isAttaching]);

  const signOut = useCallback(async () => {
    if (signOutInProgressRef.current) return;

    if (!isSupabaseBrowserEnabled()) {
      clearAttachRetry();
      attachRetryAttemptRef.current = 0;
      setWorkspaceAttachPending(false);
      sessionRef.current = null;
      setSession(null);
      setUser(null);
      setStatus("guest");
      return;
    }

    const currentSession = sessionRef.current ?? session;
    const accountUserId = currentSession?.user.id;
    const accessToken = currentSession?.access_token;
    localSignOutRef.current = true;
    signOutInProgressRef.current = true;
    lifecycleVersionRef.current += 1;
    attachInFlightUserIdRef.current = null;
    clearAttachRetry();
    attachRetryAttemptRef.current = 0;
    setIsAttaching(true);
    if (accountUserId) preserveAccountWorkspaceRecovery(accountUserId, "logout");
    let releasedRemotely = false;
    let signedOut = false;

    try {
      if (accountUserId && accessToken) {
        const localSnapshot = getWorkspaceAttachSnapshot(accountUserId);
        const result = await requestWorkspaceMutation(
          "/api/workspace-account/release",
          accessToken,
          localSnapshot,
          { maxConflictRetries: 1 },
        );
        if (result.response.ok && result.payload?.meta.remote_available &&
            result.payload.meta.mode === "remote" &&
            result.payload.meta.viewer_kind === "guest") {
          releasedRemotely = true;
          setAuthMessage("Sei uscito dall'account senza perdere la selezione corrente.");
        } else {
          setAuthMessage(
            "Sei uscito dall'account. La selezione resta disponibile su questo browser.",
          );
        }
      }
    } catch {
      setAuthMessage(
        "Disconnessione effettuata. La selezione resta disponibile su questo browser.",
      );
    } finally {
      try {
        const client = getBrowserSupabaseClient();
        const { error } = await client.auth.signOut();
        if (error) throw error;
        signedOut = true;
      } catch {
        setAuthMessage(
          "Non siamo riusciti a completare la disconnessione. Il tuo account è ancora attivo.",
        );
      } finally {
        if (signedOut) {
          if (accountUserId) {
            const isolation = await withWorkspaceGuestClaimLock(
              (lockHeld) => isolateWorkspaceAfterLogout(accountUserId, {
                guestClaimLockHeld: lockHeld,
              }),
            );
            if (!isolation.applied) {
              setAuthMessage(
                "Disconnessione effettuata. La selezione resta recuperabile su questo browser.",
              );
            } else if (releasedRemotely) {
              clearAccountWorkspaceRecovery(accountUserId);
            }
          }
          lastAttachedUserIdRef.current = null;
          sessionRef.current = null;
          setStatus("guest");
          setUser(null);
          setSession(null);
          setWorkspaceAttachPending(false);
          setWorkspaceReadyForIntentReplay(false);
          workspaceChangeRetryQueuedRef.current = false;
        } else if (currentSession?.user) {
          sessionRef.current = currentSession;
          setStatus("authenticated");
          setUser(currentSession.user);
          setSession(currentSession);
        }
        localSignOutRef.current = false;
        signOutInProgressRef.current = false;
        setIsAttaching(false);
      }
    }
  }, [clearAttachRetry, session]);

  const value = useMemo<AccountContextValue>(
    () => ({
      authEnabled,
      status,
      user,
      session,
      isSendingLink,
      isAttaching,
      workspaceAttachPending,
      hasQuarantinedWorkspace,
      isRestoringQuarantinedWorkspace,
      authMessage,
      sendMagicLink,
      signInWithOAuth,
      linkIdentity,
      restoreQuarantinedWorkspace,
      signOut,
      workspaceReadyForIntentReplay,
    }),
    [authEnabled, authMessage, hasQuarantinedWorkspace, isAttaching, isRestoringQuarantinedWorkspace, isSendingLink, linkIdentity, restoreQuarantinedWorkspace, sendMagicLink, session, signInWithOAuth, signOut, status, user, workspaceAttachPending, workspaceReadyForIntentReplay],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}


export function AccountPreviewProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AccountContextValue;
}) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
