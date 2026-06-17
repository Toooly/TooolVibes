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
  sendMagicLink: async () => ({ ok: false, message: "Auth non disponibile." }),
  signOut: async () => {},
});

const publicAuthRedirectOrigin = "https://tooolvibes.staff-ffa.workers.dev";

function normalizeOrigin(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin?: string | null) {
  if (!origin) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
  } catch {
    return true;
  }
}

function getRedirectUrl() {
  const configuredOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_AUTH_SITE_URL) ??
    normalizeOrigin(siteConfig.url);

  if (configuredOrigin && !isLocalOrigin(configuredOrigin)) {
    return `${configuredOrigin}/auth/callback`;
  }

  if (typeof window !== "undefined") {
    const currentOrigin = normalizeOrigin(window.location.origin);

    if (currentOrigin && !isLocalOrigin(currentOrigin)) {
      return `${currentOrigin}/auth/callback`;
    }
  }

  return `${publicAuthRedirectOrigin}/auth/callback`;
}

function getSupabaseAuthErrorDetail(error: unknown) {
  const candidate = error as {
    code?: string | number;
    error_code?: string | number;
    message?: string;
    status?: number;
  };
  const code = String(candidate?.code ?? candidate?.error_code ?? "").trim();
  const message = candidate?.message?.trim() ?? "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "Hai richiesto troppe mail in poco tempo: aspetta almeno 60 secondi e riprova.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "I nuovi account sono disattivati nelle impostazioni Auth. Attiva i signup dal provider Email.";
  }

  if (normalized.includes("not allowed") || normalized.includes("redirect")) {
    return "Il redirect non risulta ancora autorizzato. Salva Site URL e Redirect URL in Supabase.";
  }

  if (normalized.includes("email") && normalized.includes("disabled")) {
    return "Il provider Email non risulta attivo nelle impostazioni Auth.";
  }

  if (
    normalized.includes("smtp") ||
    normalized.includes("mail") ||
    normalized.includes("send") ||
    normalized.includes("sending")
  ) {
    return "Supabase non riesce a consegnare la mail: controlla Auth logs e configurazione SMTP/email.";
  }

  if (message) {
    return `Dettaglio auth: ${message}`;
  }

  if (code) {
    return `Dettaglio auth: ${code}`;
  }

  return "Controlla Email Auth, redirect URL e signup su Supabase.";
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(() => isSupabaseBrowserEnabled());
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
        "Account collegato, ma la persistenza remota non è disponibile: la workspace resta al sicuro in locale.",
      );
    } catch {
      setAuthMessage("Connessione account riuscita, ma la sync workspace ? in pausa.");
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
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession?.user ? "authenticated" : "guest");

      if (currentSession?.user) {
        void attachWorkspaceToAccount(currentSession);
      }

      const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setStatus(nextSession?.user ? "authenticated" : "guest");

        if (!nextSession?.user) {
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
      const message = "Auth Supabase non disponibile in questo ambiente.";
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
      const client = getBrowserSupabaseClient();
      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getRedirectUrl(),
          data: metadata,
        },
      });

      if (error) {
        console.warn("[account-auth] magic link failed", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
        const message = `Non sono riuscito a inviare la mail di conferma. ${getSupabaseAuthErrorDetail(error)}`;
        setAuthMessage(message);
        return {
          ok: false,
          message,
        };
      }

      const message =
        metadata?.source === "vibe-rush"
          ? `Email di conferma inviata a ${normalizedEmail}. Aprila per creare l'account e salvare anche il risultato Vibe Rush.`
          : `Email di conferma inviata a ${normalizedEmail}. Aprila per creare o collegare l'account alla workspace.`;
      setAuthMessage(message);

      return {
        ok: true,
        message,
      };
    } catch {
      const message =
        "Non sono riuscito a contattare Supabase Auth. Riprova tra poco o verifica la configurazione del progetto.";
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
