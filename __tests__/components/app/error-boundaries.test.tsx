// @vitest-environment jsdom

import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import SegmentError from "@/app/error";
import GlobalError from "@/app/global-error";
import { ErrorRecoveryView } from "@/components/app/error-recovery-view";

/**
 * axe runs on rendered fragments, not on full pages: `region` and
 * `color-contrast` follow the same release-wide exceptions used by the
 * primitives contract tests.
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

afterEach(() => {
  cleanup();
});

describe("B53 app/error.tsx — segment boundary", () => {
  it("SSR: nessun html/body annidato, recovery completa", () => {
    const html = renderToString(
      <SegmentError
        error={Object.assign(new Error("boom"), { digest: "abc123" })}
        reset={() => {}}
      />,
    );

    expect(html).not.toContain("<html");
    expect(html).not.toContain("<body");
    expect(html).toContain("Qualcosa");
    expect(html).toContain("Codice errore:");
    expect(html).toContain("abc123");
    expect(html).toContain("Riprova");
    expect(html).toContain('href="/"');
  });

  it("client: render senza console error/warning e reset funzionante", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const reset = vi.fn();

    render(
      <SegmentError
        error={Object.assign(new Error("boom"), { digest: "abc123" })}
        reset={reset}
      />,
    );

    // Nessun html/body nel documento jsdom oltre a quelli dell'ambiente:
    // il segment boundary non deve creare un secondo document shell.
    expect(document.querySelectorAll("html")).toHaveLength(1);
    expect(document.querySelectorAll("body")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(reset).toHaveBeenCalledTimes(1);

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("navigation recovery: link home presente e focusabile", () => {
    render(<SegmentError error={new Error("boom")} reset={() => {}} />);

    const home = screen.getByRole("link", { name: "Torna alla home" });
    expect(home.getAttribute("href")).toBe("/");
  });
});

describe("B53 app/global-error.tsx — document boundary", () => {
  it("SSR: possiede html/body e la stessa recovery del segment", () => {
    const html = renderToString(
      <GlobalError
        error={Object.assign(new Error("boom"), { digest: "root42" })}
        reset={() => {}}
      />,
    );

    expect(html).toContain('<html lang="it">');
    expect(html).toContain("<body");
    expect(html).toContain("Qualcosa");
    expect(html).toContain("Codice errore:");
    expect(html).toContain("root42");
    expect(html).toContain("Riprova");
  });
});

describe("B53 ErrorRecoveryView — contratto presentazionale", () => {
  it("omette digest e link home quando non forniti", () => {
    const { container } = render(
      <ErrorRecoveryView error={new Error("boom")} reset={() => {}} />,
    );

    expect(container.textContent).not.toContain("Codice errore");
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Riprova" })).toBeTruthy();
  });

  it("accessibilità: nessuna violazione axe sul frammento", async () => {
    const { container } = render(
      <ErrorRecoveryView
        error={Object.assign(new Error("boom"), { digest: "abc123" })}
        reset={() => {}}
        homeHref="/"
      />,
    );

    await expectNoAxeViolations(container);
  });
});
