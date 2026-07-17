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
  getWorkspaceAttachSnapshot,
  isolateWorkspaceAfterLogout,
  preserveAccountWorkspaceRecovery,
} from "@/lib/discovery/workspace-sync-client";
import type { WorkspacePersistencePayload } from "@/lib/discovery/types";
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
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const localSignOutRef = useRef(false);
  const lastAttachedUserIdRef = useRef<string | null>(null);

  const attachWorkspaceToAccount = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      return;
    }

    if (lastAttachedUserIdRef.current === currentSession.user.id) {
      return;
    }

    setIsAttaching(true);

    try {
      const localSnapshot = getWorkspaceAttachSnapshot(currentSession.user.id);
      const response = await fetch("/api/workspace-account/attach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          state: localSnapshot,
          base_revision: null,
          operation_id: crypto.randomUUID(),
        }),
      });

      const payload = (await response.json()) as WorkspacePersistencePayload;

      if (response.ok && payload.meta.remote_available && payload.data) {
        const applied = applyCanonicalRemotePayload(payload, {
          owner: { kind: "account", userId: currentSession.user.id },
          reason: "attach",
        });
        if (applied.recoveryRequired) return;
        clearAccountWorkspaceRecovery(currentSession.user.id);
        lastAttachedUserIdRef.current = currentSession.user.id;
        setAuthMessage("Selezione collegata all'account senza perdere ciò che avevi salvato.");
        window.dispatchEvent(new CustomEvent("tooolvibes:account-updated"));
        return;
      }

      setAuthMessage(
        "Account collegato, ma il salvataggio online non è disponibile: la selezione resta al sicuro su questo browser.",
      );
    } catch {
      setAuthMessage("Account collegato, ma il salvataggio della selezione è temporaneamente in pausa.");
    } finally {
      setIsAttaching(false);
    }
  }, []);

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
        setStatus("unavailable");
        return;
      }

      const client = getBrowserSupabaseClient();
      const { data } = await client.auth.getSession();

      if (!isActive) {
        return;
      }

      const currentSession = data.session;
      sessionRef.current = currentSession;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession?.user ? "authenticated" : "guest");

      if (currentSession?.user) {
        void attachWorkspaceToAccount(currentSession);
      }

      const { data: authListener } = client.auth.onAuthStateChange((event, nextSession) => {
        const previousSession = sessionRef.current;
        sessionRef.current = nextSession;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setStatus(nextSession?.user ? "authenticated" : "guest");

        if (!nextSession?.user) {
          if (event === "SIGNED_OUT" && previousSession?.user.id && !localSignOutRef.current) {
            isolateWorkspaceAfterLogout(previousSession.user.id);
          }
          lastAttachedUserIdRef.current = null;
          return;
        }

        void attachWorkspaceToAccount(nextSession);
      });

      unsubscribe = () => authListener.subscription.unsubscribe();
    }

    void bootstrap();

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [attachWorkspaceToAccount]);

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
    if (!isSupabaseBrowserEnabled()) {
      setStatus("guest");
      return;
    }

    localSignOutRef.current = true;
    const accountUserId = session?.user.id;
    if (!accountUserId) return;
    setIsAttaching(true);
    preserveAccountWorkspaceRecovery(accountUserId, "logout");
    let releasedRemotely = false;

    try {
      const localSnapshot = getWorkspaceAttachSnapshot(accountUserId);
      const releaseResponse = await fetch("/api/workspace-account/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          state: localSnapshot,
          base_revision: null,
          operation_id: crypto.randomUUID(),
        }),
      });
      const payload = (await releaseResponse.json()) as WorkspacePersistencePayload;

      if (releaseResponse.ok && payload.meta.remote_available && payload.data) {
        releasedRemotely = true;
        setAuthMessage("Sei uscito dall'account senza perdere la selezione corrente.");
        window.dispatchEvent(new CustomEvent("tooolvibes:account-updated"));
      } else {
        setAuthMessage(
          "Sei uscito dall'account. La selezione resta disponibile su questo browser.",
        );
      }
    } catch {
      setAuthMessage("Disconnessione effettuata. La selezione resta disponibile su questo browser.");
    } finally {
      const isolation = isolateWorkspaceAfterLogout(accountUserId);
      if (!isolation.applied) {
        setAuthMessage(
          "Disconnessione effettuata. La selezione resta disponibile su questo browser.",
        );
        localSignOutRef.current = false;
        setIsAttaching(false);
        return;
      }
      if (releasedRemotely) clearAccountWorkspaceRecovery(accountUserId);

      try {
        const client = getBrowserSupabaseClient();
        await client.auth.signOut();
      } finally {
        lastAttachedUserIdRef.current = null;
        setStatus("guest");
        setUser(null);
        setSession(null);
        localSignOutRef.current = false;
        setIsAttaching(false);
      }
    }
  }, [session?.access_token, session?.user.id]);

  const value = useMemo<AccountContextValue>(
    () => ({
      authEnabled,
      status,
      user,
      session,
      isSendingLink,
      isAttaching,
      authMessage,
      sendMagicLink,
      signOut,
    }),
    [authEnabled, authMessage, isAttaching, isSendingLink, sendMagicLink, session, signOut, status, user],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
