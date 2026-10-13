"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useKeyboardAwareScroll } from "@/lib/hooks/use-keyboard-aware-scroll";

interface GateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GateModal({ open, onClose, onSuccess }: GateModalProps) {
  const titleId = "gate-modal-title";
  const descriptionId = "gate-modal-description";
  const passwordId = "gate-password";
  const errorId = "gate-password-error";
  const dialogRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* B39/MOB-703: scroll-to-input con tastiera aperta; il ref va composto
     con dialogRef (focus trap) perche' la policy vive sullo stesso nodo. */
  const keyboardScrollRef = useKeyboardAwareScroll<HTMLDivElement>();
  const setDialogRefs = useCallback(
    (node: HTMLDivElement | null) => {
      dialogRef.current = node;
      keyboardScrollRef(node);
    },
    [keyboardScrollRef],
  );

  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() => {
      passwordRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Inserisci la password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPassword("");
        onSuccess();
      } else {
        setError(data.error || "Accesso non valido. Controlla la password e riprova.");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="tv-kbd-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(6,6,14,0.72)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={setDialogRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="tv-kbd-sheet relative z-10 w-full max-w-sm rounded-2xl border border-[rgba(124,77,255,0.18)] bg-[rgba(10,10,24,0.88)] p-6 shadow-2xl"
      >
        <div className="mb-5 text-center">
          <h2 id={titleId} className="text-lg font-semibold text-[#F0EFFF]"><LocalizedText>{"Accesso riservato "}</LocalizedText></h2>
          <p id={descriptionId} className="mt-1 text-sm text-[#9E99B8]"><LocalizedText>{"Inserisci la chiave per accedere al sito completo. "}</LocalizedText></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={passwordId} className="sr-only"><LocalizedText>{"Password del varco interno "}</LocalizedText></label>
            <LocalizedAttributes><Input
              type="password"
              ref={passwordRef}
              id={passwordId}
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="tv-kbd-input h-11 w-full rounded-xl border-[rgba(124,77,255,0.2)] bg-[rgba(18,18,42,0.6)] px-4 text-[#F0EFFF] placeholder:text-[#6B6690] focus-visible:border-[rgba(124,77,255,0.5)] focus-visible:ring-[rgba(124,77,255,0.25)]"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : descriptionId}
            /></LocalizedAttributes>
          </div>

          {error && (
            <p
              id={errorId}
              role="alert"
              aria-live="assertive"
              className="text-sm text-[#FF5252]"
            >
              <LocalizedText>{error}</LocalizedText>
            </p>
          )}

          <div className="tv-kbd-sheet__footer flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border-[rgba(124,77,255,0.2)] bg-transparent text-[#9E99B8] hover:bg-[rgba(124,77,255,0.08)] hover:text-[#F0EFFF]"
            ><LocalizedText>{"Annulla "}</LocalizedText></Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#7C4DFF] text-white hover:bg-[#6935FF]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}<LocalizedText>{"Entra "}</LocalizedText></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
