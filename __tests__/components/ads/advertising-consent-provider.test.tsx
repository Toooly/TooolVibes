// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  AdvertisingConsentProvider,
  useAdvertisingConsent,
} from "@/components/ads/advertising-consent-provider";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { ConsentSettingsDialog } from "@/components/ads/consent-settings-dialog";
import { readAdvertisingConsentRecord } from "@/lib/ads/advertising-consent";

function Harness() {
  const ctx = useAdvertisingConsent();
  return (
    <div>
      <output data-testid="state">{ctx.state}</output>
      <ConsentBanner />
      <ConsentSettingsDialog />
      <button type="button" onClick={ctx.openSettings}>
        open-settings
      </button>
    </div>
  );
}

function renderApp() {
  return render(
    <AdvertisingConsentProvider>
      <Harness />
    </AdvertisingConsentProvider>,
  );
}

describe("AdvertisingConsentProvider", () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("starts with unknown default and shows the banner", () => {
    renderApp();
    expect(document.querySelector('[data-testid="state"]')?.textContent).toBe("unknown");
    expect(
      screen.getByRole("button", { name: "Accetta tutto" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Rifiuta non necessari" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Personalizza" })).toBeTruthy();
  });

  it("accept persists to granted and hides the banner", async () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Accetta tutto" }));
    expect(document.querySelector('[data-testid="state"]')?.textContent).toBe("granted");
    expect(readAdvertisingConsentRecord(localStorage).state).toBe("granted");
    expect(screen.queryByRole("button", { name: "Personalizza" })).toBeNull();
  });

  it("reject persists to denied", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Rifiuta non necessari" }));
    expect(readAdvertisingConsentRecord(localStorage).state).toBe("denied");
  });

  it("restores a granted choice after a reload (fresh provider)", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Accetta tutto" }));
    cleanup();
    // Fresh mount re-reads from localStorage.
    renderApp();
    expect(document.querySelector('[data-testid="state"]')?.textContent).toBe("granted");
  });

  it("opens and reopens the settings panel from the footer trigger", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "open-settings" }));
    expect(
      screen.getByRole("button", { name: "Salva preferenze" }),
    ).toBeTruthy();
    const settingsDialog = screen.getByRole("dialog", { name: "Personalizza preferenze" });
    fireEvent.keyDown(settingsDialog, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Salva preferenze" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "open-settings" }));
    expect(
      screen.getByRole("button", { name: "Salva preferenze" }),
    ).toBeTruthy();
  });

  it("does not preselect the advertising toggle for an unknown state", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "open-settings" }));
    const toggle = screen.getByRole("switch", {
      name: /Pubblicità e misurazione TinyAdz/,
    });
    expect(toggle).toHaveProperty("checked", false);
  });

  it("persists a customized advertising preference via save", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "open-settings" }));
    const toggle = screen.getByRole("switch", {
      name: /Pubblicità e misurazione TinyAdz/,
    });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Salva preferenze" }));
    expect(readAdvertisingConsentRecord(localStorage).state).toBe("granted");
    expect(document.querySelector('[data-testid="state"]')?.textContent).toBe("granted");
  });
});
