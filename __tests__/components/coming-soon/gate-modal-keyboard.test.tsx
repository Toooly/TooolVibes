// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GateModal } from "@/components/coming-soon/gate-modal";
import { KEYBOARD_SCROLL_DELAY_MS } from "@/lib/hooks/use-keyboard-aware-scroll";

/**
 * B39 (MOB-703) — contract jsdom del Gate modal con tastiera virtuale.
 *
 * Acceptance: input, submit e close restano visibili/raggiungibili con
 * tastiera aperta. jsdom non calcola il layout: la geometria (dvh,
 * safe-area, cap altezza, footer sticky) è certificata dal contract
 * statico CSS in __tests__/styles/mobile-keyboard-policy-contract.test.ts;
 * qui si verifica che le classi della policy siano applicate ai nodi
 * giusti, che lo scroll-to-input scatti quando il campo è coperto e che
 * il DOM resti stabile a 320-430px in entrambi gli orientamenti.
 */

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

function renderGate() {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <GateModal open onClose={onClose} onSuccess={onSuccess} />,
  );
  return { onClose, onSuccess, ...utils };
}

function getDialog() {
  return screen.getByRole("dialog");
}

describe("B39 GateModal — keyboard/viewport policy (MOB-703)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("applica le classi della policy a overlay, sheet, footer e input", () => {
    renderGate();

    const dialog = getDialog();
    expect(dialog.className).toContain("tv-kbd-sheet");
    expect(dialog.parentElement?.className).toContain("tv-kbd-overlay");

    const password = screen.getByLabelText("Password del varco interno");
    expect(password.className).toContain("tv-kbd-input");

    const submit = screen.getByRole("button", { name: "Entra" });
    const close = screen.getByRole("button", { name: "Annulla" });
    const footer = submit.closest(".tv-kbd-sheet__footer");
    expect(footer).not.toBeNull();
    expect(footer).toBe(close.closest(".tv-kbd-sheet__footer"));
  });

  it("input, submit e close sono presenti e operabili con viewport rimpicciolito (tastiera aperta)", () => {
    const viewports = [
      { name: "portrait 320 + keyboard", width: 320, height: 340 },
      { name: "portrait 390 + keyboard", width: 390, height: 380 },
      { name: "portrait 430 + keyboard", width: 430, height: 400 },
      { name: "landscape 740x360", width: 740, height: 360 },
      { name: "landscape 844x390", width: 844, height: 390 },
    ];

    for (const viewport of viewports) {
      cleanup();
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: viewport.width,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        writable: true,
        value: viewport.height,
      });

      renderGate();

      const password = screen.getByLabelText("Password del varco interno");
      const submit = screen.getByRole("button", { name: "Entra" });
      const close = screen.getByRole("button", { name: "Annulla" });

      expect(password).toBeTruthy();
      expect((password as HTMLInputElement).disabled).toBe(false);
      expect(submit).toBeTruthy();
      expect(close).toBeTruthy();
      // Il footer sticky racchiude submit e close (visibili a tastiera aperta).
      expect(submit.closest(".tv-kbd-sheet__footer")).not.toBeNull();
      expect(close.closest(".tv-kbd-sheet__footer")).not.toBeNull();
    }
  });

  it("scroll-to-input: il campo password coperto viene riportato nel viewport", () => {
    renderGate();
    const password = screen.getByLabelText("Password del varco interno");
    vi.spyOn(password, "getBoundingClientRect").mockReturnValue({
      top: 900,
      bottom: 940,
      left: 0,
      right: 0,
      width: 0,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    vi.useFakeTimers();
    fireEvent.focusIn(password);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });

  it("Escape chiude anche con la policy attiva (recovery accessibile)", () => {
    const { onClose } = renderGate();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submit vuoto mostra errore senza rompere la policy (validation invariata)", () => {
    renderGate();

    fireEvent.submit(getDialog().querySelector("form") as HTMLFormElement);

    expect(screen.getByRole("alert").textContent).toContain(
      "Inserisci la password.",
    );
    expect(getDialog().className).toContain("tv-kbd-sheet");
  });

  it("axe-core: zero violazioni con la policy applicata", async () => {
    const { container } = renderGate();

    await expectNoAxeViolations(container);
  });
});
