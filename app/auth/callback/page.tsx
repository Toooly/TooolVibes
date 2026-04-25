"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { getBrowserSupabaseClient, isSupabaseBrowserEnabled } from "@/lib/supabase/browser-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Sto collegando il workspace al tuo account...");

  useEffect(() => {
    let isActive = true;

    async function handleCallback() {
      if (!isSupabaseBrowserEnabled()) {
        if (isActive) {
          setMessage("Auth non disponibile in questo ambiente.");
        }
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        if (isActive) {
          setMessage("Magic link non valido o gia` usato.");
        }
        return;
      }

      const client = getBrowserSupabaseClient();
      const { error } = await client.auth.exchangeCodeForSession(code);

      if (error) {
        if (isActive) {
          setMessage("Non sono riuscito a completare il collegamento account.");
        }
        return;
      }

      if (isActive) {
        router.replace("/account?connected=1");
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
          <BrandLogo size={86} priority />
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
