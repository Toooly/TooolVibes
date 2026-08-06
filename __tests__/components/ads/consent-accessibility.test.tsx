// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

let consentMock: "unknown" | "granted" | "denied" = "unknown";
let settingsOpen = false;

vi.mock("@/components/ads/advertising-consent-provider", () => ({
  useAdvertisingConsent: () => ({
    state: consentMock,
    settingsOpen,
    openSettings: () => {
      settingsOpen = true;
    },
    closeSettings: () => {
      settingsOpen = false;
    },
    grantAll: () => {},
    denyNonNecessary: () => {},
    saveAdvertisingPreference: () => {},
    advertisingLabel: "Pubblicità e misurazione TinyAdz",
  }),
}));

import { ConsentBanner } from "@/components/ads/consent-banner";
import { ConsentSettingsDialog } from "@/components/ads/consent-settings-dialog";

async function runAxe(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  return results.violations.filter(
    (v) => !["region"].includes(v.id),
  );
}

describe("consent accessibility (axe + roles)", () => {
  afterEach(() => {
    cleanup();
  });

  it("banner is keyboard accessible with equal accept/reject buttons", async () => {
    consentMock = "unknown";
    render(<ConsentBanner />);
    const banner = screen.getByRole("dialog");

    expect(banner).toBeTruthy();
    const accept = screen.getByRole("button", { name: "Accetta tutto" });
    const reject = screen.getByRole("button", { name: "Rifiuta non necessari" });
    accept.focus();
    expect(document.activeElement).toBe(accept);
    accept.blur();
    reject.focus();
    expect(document.activeElement).toBe(reject);

    const violations = await runAxe(banner);
    expect(violations).toEqual([]);
  });

  it("settings dialog is a modal with accessible name and labeled switch", async () => {
    consentMock = "granted";
    settingsOpen = true;
    render(<ConsentSettingsDialog />);
    const dialog = screen.getByRole("dialog", { name: "Personalizza preferenze" });

    expect(dialog).toBeTruthy();
    const toggle = screen.getByRole("switch", {
      name: /Pubblicità e misurazione TinyAdz/,
    });
    expect(toggle).toBeTruthy();

    const violations = await runAxe(dialog);
    expect(violations).toEqual([]);
  });

});
