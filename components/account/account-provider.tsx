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
  applyCanonicalRemotePayload,
  clearAccountWorkspaceRecovery,
  finalizeGuestWorkspaceClaim,
  getWorkspaceAttachSnapshot,
  getWorkspaceGuestContribution,
  initializeWorkspaceOwnerProvenance,
  isolateWorkspaceAfterLogout,
  preserveAccountWorkspaceRecovery,
  requestWorkspaceMutation,
  stageWorkspaceForAccount,
} from "@/lib/discovery/workspace-sync-client";
import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
  loadBrowserSupabaseRuntimeConfig,
} from "@/lib/supabase/browser-client";

type AccountStatus = "loading" | "guest" | "authenticated" | "unavailable";
type AccountMagicLinkMetadata = Record<string, string | number | boolean | null | undefined>;

type AccountContextValue = {
  authEnabled: boolean;
  status: AccountStatus;
  user: User | null;
  session: Session | null;
  isSendingLink: boolean;
  isAttaching: boolean;
  workspaceAttachPending: boolean;
  authMessage?: string | null;
  sendMagicLink: (
    email: string,
    metadata?: AccountMagicLinkMetadata,
  ) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue>({
  authEnabled: false,
  status: "unavailable",
  user: null,
  session: null,
  isSendingLink: false,
  isAttaching: false,
  workspaceAttachPending: false,
  authMessage: null,
  sendMagicLink: async () => ({ ok: false, message: "Accesso email non disponibile." }),
  signOut: async () => {},
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(() => isSupabaseBrowserEnabled());
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [workspaceAttachPending, setWorkspaceAttachPending] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const localSignOutRef = useRef(false);
  const signOutInProgressRef = useRef(false);
  const lastAttachedUserIdRef = useRef<string | null>(null);
  const attachInFlightUserIdRef = useRef<string | null>(null);
  const lifecycleVersionRef = useRef(0);
  const workspaceProvenanceReadyRef = useRef(false);
  const attachRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    try {
      const accountSnapshot = getWorkspaceAttachSnapshot(accountUserId);
      const guestContribution = getWorkspaceGuestContribution(accountUserId);
      const staged = stageWorkspaceForAccount(
        accountUserId,
        accountSnapshot,
        guestContribution,
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
        accountSnapshot,
        { maxConflictRetries: 1, guestState: guestContribution },
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
        if (!finalizeGuestWorkspaceClaim(accountUserId)) {
          setAuthMessage(
            "Account collegato; la pulizia della selezione guest sarà ritentata senza perdere dati.",
          );
          return;
        }
        clearAccountWorkspaceRecovery(accountUserId);
        clearAttachRetry();
        attachRetryAttemptRef.current = 0;
        lastAttachedUserIdRef.current = accountUserId;
        setWorkspaceAttachPending(false);
        setAuthMessage("Selezione collegata all'account senza perdere ciò che avevi salvato.");
        return;
      }

      if (response.status === 429 || response.status >= 500) {
        scheduleAttachRetry(currentSession, lifecycleVersion);
      }
      setAuthMessage(
        "Account collegato, ma il salvataggio online non è disponibile: la selezione resta al sicuro su questo browser.",
      );
    } catch {
      if (lifecycleVersionRef.current === lifecycleVersion &&
          !signOutInProgressRef.current) {
        scheduleAttachRetry(currentSession, lifecycleVersion);
        setAuthMessage(
          "Account collegato, ma il salvataggio della selezione è temporaneamente in pausa.",
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
    }
  }, [clearAttachRetry, scheduleAttachRetry]);

  attachWorkspaceToAccountRef.current = attachWorkspaceToAccount;

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      if (!isSupabaseBrowserEnabled()) {
        await loadBrowserSupabaseRuntimeConfig();
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
          if (event === "SIGNED_OUT" && previousSession?.user.id && !localSignOutRef.current) {
            isolateWorkspaceAfterLogout(previousSession.user.id);
          }
          lastAttachedUserIdRef.current = null;
          attachInFlightUserIdRef.current = null;
          setIsAttaching(false);
          setWorkspaceAttachPending(false);
          clearAttachRetry();
          attachRetryAttemptRef.current = 0;
          return;
        }

        if (previousUserId !== nextUserId) {
          setWorkspaceAttachPending(false);
          clearAttachRetry();
          attachRetryAttemptRef.current = 0;
          const nextProvenance = initializeWorkspaceOwnerProvenance({
            kind: "account",
            userId: nextSession.user.id,
          });
          workspaceProvenanceReadyRef.current = nextProvenance.ready;
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
            const isolation = isolateWorkspaceAfterLogout(accountUserId);
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
      authMessage,
      sendMagicLink,
      signOut,
    }),
    [authEnabled, authMessage, isAttaching, isSendingLink, sendMagicLink, session, signOut, status, user, workspaceAttachPending],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
