"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { BrandLogo } from "@/components/layout/brand-logo";
import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
  loadBrowserSupabaseRuntimeConfig,
} from "@/lib/supabase/browser-client";
import { isAccountStateMatrixEnabled } from "@/components/account/panel/account-state-flags";
import { PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { RouteMarker } from "@/components/ui/route-marker";

export default function AuthCallbackPage() {
  const router = useRouter();
  /* B59: i messaggi "di lavoro" noti restano stati transienti; ogni altro
     esito è un fallimento (link scaduto/usato o servizio non disponibile)
     e mostra una recovery esplicita invece di un dead end. */
  const [message, setMessage] = useState("Sto collegando il tuo accesso...");
  const failed =
    message !== "Sto collegando il tuo accesso..." &&
    message !== "Verifico l'accesso...";

  useEffect(() => {
    let isActive = true;

    async function handleCallback() {
      const finish = () => {
        if (isActive) {
          router.replace("/account?connected=1");
        }
      };

      if (!isSupabaseBrowserEnabled()) {
        if (isActive) {
          setMessage("Verifico l'accesso...");
        }

        await loadBrowserSupabaseRuntimeConfig();
      }

      if (!isSupabaseBrowserEnabled()) {
        if (isActive) {
          setMessage("Accesso non disponibile in questo momento.");
        }
        return;
      }

      const client = getBrowserSupabaseClient();
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authError =
        searchParams.get("error_description") ??
        searchParams.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");

      if (authError) {
        if (isActive) {
          setMessage(`Non siamo riusciti a confermare il link: ${authError}`);
        }
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);

        if (error) {
          if (isActive) {
            setMessage(
              "Non siamo riusciti a completare il collegamento. Il link potrebbe essere scaduto o già usato.",
            );
          }
          return;
        }

        finish();
        return;
      }

      const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
      const type = searchParams.get("type") as EmailOtpType | null;

      if (tokenHash && type) {
        const { error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error) {
          if (isActive) {
            setMessage("Non sono riuscito a verificare il link. Apri l'ultima email ricevuta o richiedine una nuova.");
          }
          return;
        }

        finish();
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (isActive) {
            setMessage("Non siamo riusciti a salvare l'accesso. Il link potrebbe essere scaduto o già usato.");
          }
          return;
        }

        finish();
        return;
      }

      const { data } = await client.auth.getSession();

      if (data.session?.user) {
        finish();
        return;
      }

      if (isActive) {
        setMessage("Link di conferma non valido o già usato. Apri l'ultima email ricevuta oppure richiedine una nuova.");
      }
    }

    void handleCallback();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <div className="page-shell flex min-h-dvh items-center justify-center py-10 sm:py-16">
      <PremiumPanel
        tone="light"
        className="w-full max-w-[42rem] p-5 before:!hidden after:!hidden sm:p-8"
      >
        <RouteMarker
          index="A-01"
          label="Accesso sicuro"
          status={failed ? "Recupero disponibile" : "Verifica in corso"}
          density="minimal"
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <BrandLogo fallback="png" size={76} priority />
          <div>
            <p className="editorial-label">Workspace personale</p>
            <h1 className="text-display-card mt-3 text-[2rem] sm:text-[2.5rem]">
              {failed ? "Collegamento non riuscito" : "Collegamento in corso"}
            </h1>
            <p
              className="mt-4 text-[0.98rem] leading-7 text-[var(--tv-ink-secondary)]"
              aria-live="polite"
            >
              {message}
            </p>
          </div>
        </div>

        {failed && isAccountStateMatrixEnabled() ? (
          <div className="mt-7 border-t border-[var(--tv-border-subtle)] pt-6">
            <PremiumLink href="/account" className="w-full sm:w-auto">
              Richiedi un nuovo link
            </PremiumLink>
            <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[var(--tv-ink-secondary)]">
              Il link può essere scaduto o già usato: dalla pagina account puoi inviarti una nuova mail di conferma.
            </p>
          </div>
        ) : null}
      </PremiumPanel>
    </div>
  );
}
