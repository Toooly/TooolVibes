"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { EmailOtpType } from "@supabase/supabase-js";

import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
  loadBrowserSupabaseRuntimeConfig,
} from "@/lib/supabase/browser-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Sto collegando il workspace al tuo account...");

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
          setMessage("Verifico la configurazione auth...");
        }

        await loadBrowserSupabaseRuntimeConfig();
      }

      if (!isSupabaseBrowserEnabled()) {
        if (isActive) {
          setMessage("Auth non disponibile in questo ambiente.");
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
          setMessage(`Supabase non ha confermato il link: ${authError}`);
        }
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);

        if (error) {
          if (isActive) {
            setMessage(
              "Non sono riuscito a completare il collegamento account. Il link potrebbe essere scaduto o gia usato.",
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
            setMessage("Non sono riuscito a salvare la sessione. Il link potrebbe essere scaduto o gia usato.");
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
        setMessage("Link di conferma non valido o gia usato. Apri l'ultima email ricevuta oppure richiedine una nuova.");
      }
    }

    void handleCallback();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center py-16">
      <div className="brand-panel panel-lift max-w-[34rem] rounded-[32px] px-6 py-8 text-center sm:px-8">
        <div className="flex justify-center">
          <div
            className="relative flex items-center justify-center rounded-[24px] bg-white/80 p-3 shadow-[0_18px_48px_rgba(106,60,255,0.14)] ring-1 ring-[rgba(106,60,255,0.14)]"
            aria-label="TooolVibes logo"
          >
            <Image
              src="/brand/tooolvibes-logo.png"
              alt="TooolVibes"
              width={76}
              height={76}
              className="h-[76px] w-[76px] object-contain"
              priority
            />
          </div>
        </div>
        <p className="pill mx-auto">Auth callback</p>
        <h1 className="text-display-card mt-4 text-[2rem] sm:text-[2.3rem]">
          Collegamento in corso
        </h1>
        <p className="text-body-soft mt-4 text-[0.98rem]" style={{ color: "var(--muted-strong)" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
