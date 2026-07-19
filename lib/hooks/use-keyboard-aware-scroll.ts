"use client";

import { useEffect, useState } from "react";

/**
 * B39 / MOB-703 — scroll-to-input policy.
 *
 * Quando un campo dentro il container riceve focus, dopo il tempo di
 * apertura della tastiera virtuale (~320ms) il campo viene riportato nel
 * centro del viewport visibile SOLO se risulta coperto (tipicamente dalla
 * tastiera). Se il campo e' gia' interamente visibile non si muove nulla:
 * nessuno scroll indesiderato su desktop o con tastiera chiusa.
 *
 * Copre iOS Safari (che ignora `interactive-widget` e non ridimensiona il
 * layout viewport) e funziona sia per overlay fixed sia per pagine con
 * scroll documento. Rispetta prefers-reduced-motion.
 *
 * Uso: `const ref = useKeyboardAwareScroll<HTMLDivElement>()` e
 * `ref={ref}` (o comporre con altri ref via callback) sul wrapper del form.
 */

export const KEYBOARD_SCROLL_DELAY_MS = 320;

const FOCUSABLE_FIELD_SELECTOR =
  "input, textarea, select, [contenteditable='true']";

function isFullyVisible(rect: DOMRect): boolean {
  const visualViewport = window.visualViewport;
  const visibleTop = visualViewport ? visualViewport.offsetTop : 0;
  const visibleBottom = visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : window.innerHeight;
  return rect.top >= visibleTop && rect.bottom <= visibleBottom;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useKeyboardAwareScroll<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node || typeof window === "undefined") {
      return;
    }

    let timeoutId: number | undefined;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.matches(FOCUSABLE_FIELD_SELECTOR)
      ) {
        return;
      }

      // La valutazione avviene dopo l'animazione di apertura della tastiera,
      // quando il visual viewport si e' stabilizzato.
      timeoutId = window.setTimeout(() => {
        if (isFullyVisible(target.getBoundingClientRect())) {
          return;
        }
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      }, KEYBOARD_SCROLL_DELAY_MS);
    };

    node.addEventListener("focusin", handleFocusIn);
    return () => {
      node.removeEventListener("focusin", handleFocusIn);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [node]);

  return setNode;
}
