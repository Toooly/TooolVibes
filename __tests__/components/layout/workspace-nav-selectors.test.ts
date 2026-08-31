import { describe, expect, it } from "vitest";

import {
  isHeaderAccountAwareEnabled,
  resolveHeaderAccountCta,
  type HeaderAccountStatus,
} from "@/components/layout/workspace-nav-selectors";
import {
  HEADER_ACCOUNT_AWARE_ENV_KEY,
  HeaderChromeReleaseConfigError,
  resolveHeaderChromeRelease,
} from "@/components/layout/header-chrome-release";

const ALL_STATUSES: readonly HeaderAccountStatus[] = [
  "loading",
  "guest",
  "authenticated",
  "unavailable",
];

describe("B30 resolveHeaderAccountCta — selector canonico (IA-502)", () => {
  it("flag OFF: adapter legacy statico per ogni stato account (reversibilità)", () => {
    for (const status of ALL_STATUSES) {
      const cta = resolveHeaderAccountCta(
        { authEnabled: true, status, syncInProgress: false },
        { accountAware: false },
      );

      expect(cta).toMatchObject({
        state: "legacy",
        visible: true,
        href: "/account#account-upgrade",
        label: "Accedi",
        ariaBusy: false,
      });
    }
  });

  it("guest: unica CTA Accedi verso /account#account-upgrade", () => {
    const cta = resolveHeaderAccountCta(
      { authEnabled: true, status: "guest", syncInProgress: false },
      { accountAware: true },
    );

    expect(cta).toMatchObject({
      state: "guest",
      visible: true,
      href: "/account#account-upgrade",
      label: "Accedi",
      ariaBusy: false,
    });
  });

  it("authenticated: CTA Il tuo spazio verso /account, niente copy guest", () => {
    const cta = resolveHeaderAccountCta(
      { authEnabled: true, status: "authenticated", syncInProgress: false },
      { accountAware: true },
    );

    expect(cta.state).toBe("authenticated");
    expect(cta.visible).toBe(true);
    expect(cta.href).toBe("/account");
    expect(cta.label).toBe("Il tuo spazio");
    expect(cta.label).not.toContain("Accedi");
    expect(cta.ariaBusy).toBe(false);
  });

  it("syncing: authenticated + attach/sync in corso → stato syncing, stessa CTA unica", () => {
    const cta = resolveHeaderAccountCta(
      { authEnabled: true, status: "authenticated", syncInProgress: true },
      { accountAware: true },
    );

    expect(cta.state).toBe("syncing");
    expect(cta.visible).toBe(true);
    expect(cta.href).toBe("/account");
    expect(cta.label).toBe("Il tuo spazio");
    expect(cta.ariaBusy).toBe(true);
  });

  it("loading: copy neutra Account con aria-busy, NON lampeggia guest", () => {
    const cta = resolveHeaderAccountCta(
      { authEnabled: true, status: "loading", syncInProgress: false },
      { accountAware: true },
    );

    expect(cta.state).toBe("loading");
    expect(cta.visible).toBe(true);
    expect(cta.label).toBe("Account");
    expect(cta.label).not.toContain("Accedi");
    expect(cta.label).not.toContain("Registrati");
    expect(cta.ariaBusy).toBe(true);
  });

  it("unavailable o auth disabilitato: CTA nascosta (niente copy promozionale falso)", () => {
    const unavailable = resolveHeaderAccountCta(
      { authEnabled: true, status: "unavailable", syncInProgress: false },
      { accountAware: true },
    );
    const disabled = resolveHeaderAccountCta(
      { authEnabled: false, status: "guest", syncInProgress: false },
      { accountAware: true },
    );

    for (const cta of [unavailable, disabled]) {
      expect(cta.state).toBe("unavailable");
      expect(cta.visible).toBe(false);
      expect(cta.ariaBusy).toBe(false);
    }
  });

  it("default accountAware: senza options vale il comportamento B30", () => {
    const cta = resolveHeaderAccountCta({
      authEnabled: true,
      status: "authenticated",
      syncInProgress: false,
    });

    expect(cta.state).toBe("authenticated");
  });
});

describe("B30 isHeaderAccountAwareEnabled — release flag (pattern B04)", () => {
  it("default true: comportamento account-aware live, hatch via env", () => {
    expect(isHeaderAccountAwareEnabled()).toBe(true);
  });
});

describe("B30 resolveHeaderChromeRelease — parsing flag (semantics B04/B29)", () => {
  it("default true senza env; true/false espliciti su valori booleani", () => {
    expect(resolveHeaderChromeRelease().headerAccountAware).toBe(true);
    expect(
      resolveHeaderChromeRelease({
        [HEADER_ACCOUNT_AWARE_ENV_KEY]: "1",
      }).headerAccountAware,
    ).toBe(true);
    expect(
      resolveHeaderChromeRelease({
        [HEADER_ACCOUNT_AWARE_ENV_KEY]: "off",
      }).headerAccountAware,
    ).toBe(false);
    expect(
      resolveHeaderChromeRelease({
        [HEADER_ACCOUNT_AWARE_ENV_KEY]: "false",
      }).headerAccountAware,
    ).toBe(false);
  });

  it("rifiuta valori non booleani", () => {
    expect(() =>
      resolveHeaderChromeRelease({
        [HEADER_ACCOUNT_AWARE_ENV_KEY]: "sometimes",
      }),
    ).toThrow(HeaderChromeReleaseConfigError);
  });
});
