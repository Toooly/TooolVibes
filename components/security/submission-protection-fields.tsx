"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { PublicSubmissionAction } from "@/lib/public-submissions/contracts";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "interaction-only";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function SubmissionProtectionFields({
  action,
}: {
  action: PublicSubmissionAction;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptReady, setIsScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    if (!siteKey || !isScriptReady || !window.turnstile || !containerRef.current) {
      return;
    }

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      appearance: "interaction-only",
      callback: setCaptchaToken,
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });

    const form = containerRef.current.closest("form");
    const resetWidget = () => {
      setCaptchaToken("");
      window.turnstile?.reset(widgetId);
    };
    form?.addEventListener("reset", resetWidget);

    return () => {
      form?.removeEventListener("reset", resetWidget);
      window.turnstile?.remove(widgetId);
    };
  }, [action, isScriptReady, siteKey]);

  return (
    <>
      <label
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10000px] top-auto size-px overflow-hidden"
      ><LocalizedText>{"Company website "}</LocalizedText><input
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      <input name="captchaToken" type="hidden" value={captchaToken} readOnly />
      {siteKey ? (
        <>
          <Script
            id="tooolvibes-turnstile"
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={() => setIsScriptReady(true)}
          />
          <div ref={containerRef} />
        </>
      ) : null}
    </>
  );
}
