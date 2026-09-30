"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { completeAuthCallback } from "@/lib/auth/complete-auth-callback";
import { isSafeReturnTo } from "@/lib/auth/pending-auth-intent";
import { resolveSafeNextPath } from "@/lib/auth/oauth-providers";
import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
  loadBrowserSupabaseRuntimeConfig,
} from "@/lib/supabase/browser-client";
import { PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { RouteMarker } from "@/components/ui/route-marker";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Sto collegando il tuo accesso...");
  const failed =
    message !== "Sto collegando il tuo accesso..." &&
    message !== "Verifico l'accesso...";

  useEffect(() => {
    let isActive = true;

    async function handleCallback() {
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

      const result = await completeAuthCallback(getBrowserSupabaseClient(), {
        search: window.location.search,
        hash: window.location.hash,
      });

      if (!isActive) {
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        const destination =
          next && isSafeReturnTo(next) ? next : resolveSafeNextPath(null);
        // Strip OAuth code/token material from the address bar before leaving.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(destination);
      } catch {
        router.replace(resolveSafeNextPath(null));
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
        tone="dark"
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
              aria-live={failed ? "assertive" : "polite"}
              role={failed ? "alert" : "status"}
            >
              {message}
            </p>
          </div>
        </div>

        {failed ? (
          <div className="mt-7 border-t border-[var(--tv-border-subtle)] pt-6">
            <PremiumLink href="/account" className="w-full sm:w-auto">
              Torna all&apos;accesso
            </PremiumLink>
            <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[var(--tv-ink-secondary)]">
              Puoi riprovare con Google, Apple, Microsoft o GitHub, oppure inviarti un nuovo
              link email dalla pagina account.
            </p>
          </div>
        ) : null}
      </PremiumPanel>
    </div>
  );
}
