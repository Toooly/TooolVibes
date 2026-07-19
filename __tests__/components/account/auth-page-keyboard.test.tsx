// @vitest-environment jsdom

import { createElement, forwardRef, Fragment, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthPage } from "@/components/account/auth-page";
import { KEYBOARD_SCROLL_DELAY_MS } from "@/lib/hooks/use-keyboard-aware-scroll";

/**
 * B39 (MOB-703) — contract jsdom dell'Auth page con tastiera virtuale.
 *
 * Acceptance: input, submit e close/recovery restano visibili/raggiungibili
 * con tastiera aperta. La geometria (dvh, safe-area, sticky footer, zoom
 * guard 16px) è certificata dal contract statico in
 * __tests__/styles/mobile-keyboard-policy-contract.test.ts; qui si verifica
 * l'applicazione della policy ai nodi, lo scroll-to-input e la stabilità
 * del DOM a 320-430px in entrambi gli orientamenti.
 */

/* Account context mock: il contract sotto test è la policy keyboard, non la
   logica di autenticazione (coperta dai test dell'account provider). */
const { accountStub } = vi.hoisted(() => ({
  accountStub: {
    sendMagicLink: vi.fn(),
    isSendingLink: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    isAttaching: false,
    restoreQuarantinedWorkspace: vi.fn(),
    authMessage: null as string | null,
  },
}));
vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => accountStub,
}));

/* motion mock: props di animazione non inoltrate al DOM (markup pulito,
   nessuna dipendenza dall'animazione nei test di policy). */
vi.mock("motion/react", () => {
  const MOTION_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "layoutId",
    "whileHover",
    "whileTap",
  ]);
  const create = (tag: string) => {
    type StubProps = Record<string, unknown> & { children?: ReactNode };
    const MotionStub = forwardRef<HTMLElement, StubProps>((props, ref) => {
      const { children, ...rest } = props;
      const domProps = Object.fromEntries(
        Object.entries(rest).filter(([key]) => !MOTION_PROPS.has(key)),
      );
      return createElement(tag, { ref, ...domProps }, children as ReactNode);
    });
    MotionStub.displayName = `MotionStub(${tag})`;
    return MotionStub;
  };
  return {
    motion: { div: create("div"), span: create("span") },
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("B39 AuthPage — keyboard/viewport policy (MOB-703)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("la root applica la policy di pagina keyboard-aware", () => {
    const { container } = render(<AuthPage />);

    const page = container.querySelector(".v-auth-page");
    expect(page).not.toBeNull();
    expect(page!.className).toContain("tv-kbd-page");
  });

  it("login: email con zoom guard, submit sticky, scroll-to-input attivo", () => {
    render(<AuthPage />);

    const email = screen.getByLabelText("Email");
    expect(email.className).toContain("tv-kbd-input");

    const submit = screen.getByRole("button", { name: /Accedi con email/ });
    expect(submit.className).toContain("tv-kbd-sheet__footer");

    vi.spyOn(email, "getBoundingClientRect").mockReturnValue({
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
    fireEvent.focusIn(email);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });

  it("register: tutti i campi hanno lo zoom guard e il submit resta sticky", () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrati" }));

    for (const label of ["Nome", "Cognome", "Email"]) {
      const field = screen.getByLabelText(label);
      expect(field.className).toContain("tv-kbd-input");
    }

    const submit = screen.getByRole("button", { name: "Registrati" });
    expect(submit.className).toContain("tv-kbd-sheet__footer");
  });

  it("input e submit restano presenti e operabili a 320-430px e in landscape", () => {
    const viewports = [
      { width: 320, height: 340 },
      { width: 360, height: 360 },
      { width: 390, height: 380 },
      { width: 430, height: 400 },
      { width: 844, height: 390 },
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

      render(<AuthPage />);

      const email = screen.getByLabelText("Email") as HTMLInputElement;
      expect(email.disabled).toBe(false);
      const submit = screen.getByRole("button", { name: /Accedi con email/ });
      expect(submit.className).toContain("tv-kbd-sheet__footer");
      // Recovery: tab switch e link footer restano nel DOM.
      expect(screen.getByRole("tab", { name: "Registrati" })).toBeTruthy();
    }
  });

  it("autofill: gli hint di compilazione restano deterministici sui campi", () => {
    render(<AuthPage />);

    const email = screen.getByLabelText("Email") as HTMLInputElement;
    expect(email.getAttribute("autocomplete")).toBe("email");
    expect(email.getAttribute("type")).toBe("email");

    fireEvent.click(screen.getByRole("tab", { name: "Registrati" }));

    expect(screen.getByLabelText("Nome").getAttribute("autocomplete")).toBe(
      "given-name",
    );
    expect(screen.getByLabelText("Cognome").getAttribute("autocomplete")).toBe(
      "family-name",
    );
  });

  it("axe-core: zero violazioni con la policy applicata", async () => {
    const { container } = render(<AuthPage />);

    await expectNoAxeViolations(container);
  });
});
