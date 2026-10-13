"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
/**
 * TooolVibes — Install Experience ("Porta TooolVibes sulla Home")
 *
 * ONE abstraction, platform-specific content:
 * - iOS Safari: manual 3-step education (Share -> Aggiungi alla Home -> Aggiungi).
 * - Android + beforeinstallprompt: native browser install path.
 * - Standalone / native / recently dismissed: never shown.
 *
 * Engagement gating lives with the caller (session/engagement counts);
 * this component owns rendering, dismissal cooldown, and suppression.
 * NEVER claims installation enables haptic feedback.
 */

import { useCallback, useEffect, useState } from "react";

import { getPlatformCapabilities } from "@/lib/platform/capabilities";

const DISMISS_KEY = "tooolvibes:install:dismissed:v1";
const COOLDOWN_DAYS = 21;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function InstallExperience({ engaged = true }: { engaged?: boolean }) {
  // Preview hook for QA evidence (e.g. ?install_preview=ios on desktop).
  // Real gating still uses capability detection; this only forces the surface.

  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!engaged) return;
    const caps = getPlatformCapabilities();
    if (caps.isStandalone || caps.isNative) return;
    if (dismissedRecently()) return;
    if (
      new URLSearchParams(window.location.search).get("install_preview") === "ios"
    ) {
      setIsIOS(true);
      setVisible(true);
      return;
    }
    setIsIOS(caps.isIOS);
    if (caps.isIOS) {
      setVisible(true);
      return;
    }
    const onPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferred(event);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [engaged]);

  // Standalone entered after mount (installed while open): hide immediately.
  useEffect(() => {
    if (!visible) return;
    const onChange = () => {
      if (getPlatformCapabilities().isStandalone) setVisible(false);
    };
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // private mode: dismissal lasts for the session
    }
    setVisible(false);
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  }, [deferred, dismiss]);

  if (!visible) return null;

  return (
    <section
      className="tv-install-sheet"
      role="dialog"
      aria-modal="false"
      aria-labelledby="tv-install-title"
      data-install-surface={isIOS ? "ios-manual" : "android-prompt"}
    >
      <div className="tv-install-sheet__inner">
        <p className="tv-install-sheet__kicker"><LocalizedText>{"App-like, in un tocco"}</LocalizedText></p>
        <h2 id="tv-install-title" className="tv-install-sheet__title"><LocalizedText>{"Porta TooolVibes sulla Home "}</LocalizedText></h2>
        {isIOS ? (
          <ol className="tv-install-sheet__steps">
            <li>
              <strong><LocalizedText>{"Tocca Condividi"}</LocalizedText></strong>
              <span><LocalizedText>{"l'icona in basso su Safari"}</LocalizedText></span>
            </li>
            <li>
              <strong><LocalizedText>{"Scegli “Aggiungi alla schermata Home”"}</LocalizedText></strong>
              <span><LocalizedText>{"scorri le azioni se non la vedi"}</LocalizedText></span>
            </li>
            <li>
              <strong><LocalizedText>{"Conferma “Aggiungi”"}</LocalizedText></strong>
              <span><LocalizedText>{"si apre come app, a tutto schermo"}</LocalizedText></span>
            </li>
          </ol>
        ) : (
          <p className="tv-install-sheet__lede"><LocalizedText>{"Installa TooolVibes dal browser: apertura come app, accesso piu rapido, esperienza a tutto schermo. "}</LocalizedText></p>
        )}
        <ul className="tv-install-sheet__benefits">
          <li><LocalizedText>{"apertura come app"}</LocalizedText></li>
          <li><LocalizedText>{"accesso piu rapido"}</LocalizedText></li>
          <li><LocalizedText>{"esperienza full-screen"}</LocalizedText></li>
        </ul>
        <div className="tv-install-sheet__actions">
          {!isIOS && deferred ? (
            <button
              type="button"
              className="tv-install-sheet__cta"
              onClick={installAndroid}
            ><LocalizedText>{"Installa TooolVibes "}</LocalizedText></button>
          ) : null}
          <button
            type="button"
            className="tv-install-sheet__dismiss"
            onClick={dismiss}
          ><LocalizedText>{"Non ora "}</LocalizedText></button>
        </div>
      </div>
    </section>
  );
}
