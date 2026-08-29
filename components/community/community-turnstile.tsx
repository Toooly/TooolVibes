"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const ACTION = "community_experience";

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

export function CommunityTurnstile({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );

  useEffect(() => {
    if (!siteKey) {
      onToken("dev");
      return;
    }
    if (!ready || !window.turnstile || !containerRef.current) return;
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: ACTION,
      appearance: "interaction-only",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
    return () => {
      window.turnstile?.remove(widgetId);
    };
  }, [onToken, ready, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} className="td-final-experience-form__turnstile" />
    </>
  );
}
