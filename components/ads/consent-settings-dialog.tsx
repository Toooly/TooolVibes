"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";

/**
 * Consent settings panel. Modal dialog portalled to `document.body` (so it
 * ranks above the app's portalled bottom nav), with focus trap, ESC to close,
 * focus return to opener, and a switch for "Pubblicità e misurazione TinyAdz".
 *
 * The advertising switch is never preselected ON for an `unknown` state: it
 * reflects the actual current preference, which defaults to OFF.
 */
export function ConsentSettingsDialog() {
  const {
    settingsOpen,
    closeSettings,
    state,
    grantAll,
    denyNonNecessary,
    saveAdvertisingPreference,
    advertisingLabel,
  } = useAdvertisingConsent();

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  // Advertising switch state: reflects current choice; initial considered OFF if unknown.
  const [advertisingOn, setAdvertisingOn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset the switch each time the dialog opens, reflecting the real state.
  useEffect(() => {
    if (settingsOpen) {
      setAdvertisingOn(state === "granted");
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [settingsOpen, state]);

  // Restore focus when the dialog closes.
  useEffect(() => {
    if (!settingsOpen) {
      previouslyFocused.current?.focus?.();
    }
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], input, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (
        event.shiftKey &&
        (active === first || !dialogRef.current?.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, closeSettings]);

  const handleSave = useCallback(() => {
    saveAdvertisingPreference(advertisingOn);
  }, [advertisingOn, saveAdvertisingPreference]);

  if (!mounted || !settingsOpen) {
    return null;
  }

  return createPortal(
    <div
      className="tv-consent-dialog__scrim"
      onClick={() => closeSettings()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-settings-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="tv-consent-dialog outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="consent-settings-title" className="text-base font-semibold">
              Personalizza preferenze
            </h2>
            <p className="text-sm text-muted-foreground">
              Scegli quali finalità autorizzi. Puoi modificare le preferenze in
              qualsiasi momento dal footer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => closeSettings()}
            aria-label="Chiudi preferenze"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            ✕
          </button>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="pr-3">
              <label
                htmlFor="consent-advertising-switch"
                className="text-sm font-medium"
              >
                {advertisingLabel}
              </label>
              <p className="text-xs text-muted-foreground">
                Consente a TinyAdz di mostrare pubblicità e relativi componenti
                tecnici (per esempio rilevamento bot e misurazione). Attivo solo
                dopo il consenso.
              </p>
            </div>
            <span
              className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-2"
              style={{
                backgroundColor: advertisingOn
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                opacity: advertisingOn ? 1 : 0.5,
              }}
            >
              <input
                id="consent-advertising-switch"
                type="checkbox"
                role="switch"
                aria-checked={advertisingOn}
                checked={advertisingOn}
                onChange={(event) => setAdvertisingOn(event.target.checked)}
                className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-full opacity-0"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0.5 top-0.5 block size-5 rounded-full shadow transition-transform"
                style={{
                  backgroundColor: "var(--background)",
                  transform: advertisingOn ? "translateX(20px)" : "none",
                }}
              />
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => denyNonNecessary()}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Rifiuta non necessari
          </button>
          <button
            type="button"
            onClick={() => grantAll()}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Accetta tutto
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-transparent px-4 py-2 text-sm font-semibold text-foreground underline hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Salva preferenze
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
