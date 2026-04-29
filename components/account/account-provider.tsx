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
  applyDiscoveryWorkspaceState,
  getLocalDiscoveryWorkspaceState,
} from "@/lib/discovery/local-storage";
import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { siteConfig } from "@/lib/config/site";
import { getBrowserSupabaseClient, isSupabaseBrowserEnabled } from "@/lib/supabase/browser-client";

type AccountStatus = "loading" | "guest" | "authenticated" | "unavailable";

type AccountContextValue = {
  authEnabled: boolean;
  status: AccountStatus;
  user: User | null;
  session: Session | null;
  isSendingLink: boolean;
  isAttaching: boolean;
  authMessage?: string | null;
  sendMagicLink: (email: string) => Promise<{ ok: boolean; message: string }>;
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
  sendMagicLink: async () => ({ ok: false, message: "Auth non disponibile." }),
  signOut: async () => {},
});

function getRedirectUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  return `${siteConfig.url}/auth/callback`;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
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
      const localSnapshot = getLocalDiscoveryWorkspaceState();
      const response = await fetch("/api/discovery-account/attach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify(localSnapshot),
      });

      const payload = (await response.json()) as DiscoveryPersistencePayload;

      if (response.ok && payload.meta.remote_available && payload.data) {
        applyDiscoveryWorkspaceState(payload.data, { source: "remote" });
        lastAttachedUserIdRef.current = currentSession.user.id;
        setAuthMessage("Workspace collegata all'account senza perdere il contesto guest.");
        window.dispatchEvent(new CustomEvent("tooolvibes:account-updated"));
        return;
      }

      setAuthMessage(
        "Account collegato, ma la persistenza remota non ? disponibile: la workspace resta al sicuro in locale.",
      );
    } catch {
      setAuthMessage("Connessione account riuscita, ma la sync workspace ? in pausa.");
    } finally {
      setIsAttaching(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseBrowserEnabled()) {
      setStatus("unavailable");
      return;
    }

    const client = getBrowserSupabaseClient();
    let isActive = true;

    async function bootstrap() {
      const { data } = await client.auth.getSession();

      if (!isActive) {
        return;
      }

      const currentSession = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession?.user ? "authenticated" : "guest");

      if (currentSession?.user) {
        void attachWorkspaceToAccount(currentSession);
      }
    }

    void bootstrap();

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextSession?.user ? "authenticated" : "guest");

      if (!nextSession?.user) {
        lastAttachedUserIdRef.current = null;
        return;
      }

      void attachWorkspaceToAccount(nextSession);
    });

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, [attachWorkspaceToAccount]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!isSupabaseBrowserEnabled()) {
      return {
        ok: false,
        message: "Auth non disponibile in questo ambiente.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return {
        ok: false,
        message: "Inserisci una email valida.",
      };
    }

    setIsSendingLink(true);
    setAuthMessage(null);

    try {
      const client = getBrowserSupabaseClient();
      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        return {
          ok: false,
          message: "Non sono riuscito a inviare il magic link. Controlla la configurazione auth.",
        };
      }

      const message = `Magic link inviato a ${normalizedEmail}. Aprilo per collegare il workspace all'account.`;
      setAuthMessage(message);

      return {
        ok: true,
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

    setIsAttaching(true);

    try {
      const localSnapshot = getLocalDiscoveryWorkspaceState();
      const releaseResponse = await fetch("/api/discovery-account/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localSnapshot),
      });
      const payload = (await releaseResponse.json()) as DiscoveryPersistencePayload;

      if (releaseResponse.ok && payload.meta.remote_available && payload.data) {
        applyDiscoveryWorkspaceState(payload.data, { source: "remote" });
        setAuthMessage("Sei tornato in modalità guest senza perdere la workspace corrente.");
        window.dispatchEvent(new CustomEvent("tooolvibes:account-updated"));
      } else {
        setAuthMessage(
          "Sei tornato in modalità guest. La workspace resta disponibile in locale finché il remoto non torna attivo.",
        );
      }
    } catch {
      setAuthMessage("Disconnessione effettuata, ma il rilascio guest non è stato confermato dal remoto.");
    } finally {
      try {
        const client = getBrowserSupabaseClient();
        await client.auth.signOut();
      } finally {
        lastAttachedUserIdRef.current = null;
        setStatus("guest");
        setUser(null);
        setSession(null);
        setIsAttaching(false);
      }
    }
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      authEnabled: isSupabaseBrowserEnabled(),
      status,
      user,
      session,
      isSendingLink,
      isAttaching,
      authMessage,
      sendMagicLink,
      signOut,
    }),
    [authMessage, isAttaching, isSendingLink, sendMagicLink, session, signOut, status, user],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
