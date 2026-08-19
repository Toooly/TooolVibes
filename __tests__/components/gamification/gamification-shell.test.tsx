// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GamificationShell } from "@/components/gamification/gamification-shell";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/* Router mock minimo: la shell legge solo usePathname. */
const { pathnameState } = vi.hoisted(() => ({
  pathnameState: { current: "/" as string },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

/* Launcher mock: il contract sotto test è lo slot unico della shell, non la
   logica interna dei launcher (reward logic coperta dai propri test). */
vi.mock("@/components/gamification/game-mission-drawer", () => ({
  GameMissionDrawer: ({ className }: { className?: string }) =>
    createElement(
      "button",
      { type: "button", className: `game-mission-fab ${className ?? ""}` },
      "Missioni",
    ),
}));

vi.mock("@/components/gamification/vibe-tap-mini-game", () => ({
  VibeTapMiniGame: ({ className }: { className?: string }) =>
    createElement(
      "button",
      {
        type: "button",
        className: `vibe-mini-launcher ${className ?? ""}`,
      },
      "Vibe Rush",
    ),
}));

function getDock() {
  return screen.getByTestId("shell-floating-dock");
}

/**
 * axe runs on rendered fragments: jsdom cannot compute real color contrast
 * and the `region` landmark rule only applies to whole documents (pattern
 * condiviso con __tests__/components/ui/core-primitives.test.tsx).
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

describe("B37 GamificationShell — slot floating unico (MOB-701)", () => {
  beforeEach(() => {
    pathnameState.current = "/";
    useMobileUIStore.setState({ isOverlayOpen: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("un solo slot: entrambi i launcher sono figli dello stesso dock", () => {
    render(<GamificationShell missionsEnabled vibeRushEnabled />);

    const dock = getDock();
    expect(dock.className).toContain("shell-floating-dock");
    const launchers = dock.querySelectorAll(
      ".game-mission-fab, .vibe-mini-launcher",
    );
    expect(launchers).toHaveLength(2);
    for (const launcher of launchers) {
      expect(launcher.parentElement).toBe(dock);
    }
  });

  it("flaggabilità individuale: solo missioni attive", () => {
    render(<GamificationShell missionsEnabled vibeRushEnabled={false} />);

    const dock = getDock();
    expect(dock.querySelector(".game-mission-fab")).not.toBeNull();
    expect(dock.querySelector(".vibe-mini-launcher")).toBeNull();
  });

  it("flaggabilità individuale: solo Vibe Rush attivo", () => {
    render(<GamificationShell missionsEnabled={false} vibeRushEnabled />);

    const dock = getDock();
    expect(dock.querySelector(".vibe-mini-launcher")).not.toBeNull();
    expect(
      dock.querySelector(".vibe-mini-launcher")?.className,
    ).toContain("shell-floating-dock__vibe-rush");
    expect(dock.querySelector(".game-mission-fab")).toBeNull();
  });

  it("entrambe le surface OFF: il dock non renderizza nulla", () => {
    const { container } = render(
      <GamificationShell missionsEnabled={false} vibeRushEnabled={false} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("shell-floating-dock")).toBeNull();
  });

  it.each(["/admin", "/admin/login", "/admin-login", "/auth", "/auth/callback", "/account", "/account/settings"])(
    "route esclusa %s: il dock non renderizza nulla",
    (pathname) => {
      pathnameState.current = pathname;
      const { container } = render(
        <GamificationShell missionsEnabled vibeRushEnabled />,
      );
      expect(container.firstChild).toBeNull();
    },
  );

  it("overlay mobile aperto: il dock si nasconde via data-overlay-open", () => {
    const { rerender } = render(
      <GamificationShell missionsEnabled vibeRushEnabled />,
    );
    expect(getDock().getAttribute("data-overlay-open")).toBe("false");

    useMobileUIStore.setState({ isOverlayOpen: true });
    rerender(<GamificationShell missionsEnabled vibeRushEnabled />);
    expect(getDock().getAttribute("data-overlay-open")).toBe("true");

    useMobileUIStore.setState({ isOverlayOpen: false });
    rerender(<GamificationShell missionsEnabled vibeRushEnabled />);
    expect(getDock().getAttribute("data-overlay-open")).toBe("false");
  });

  it.each([320, 360, 390, 412, 430])(
    "viewport %ipx: lo slot resta unico con i launcher abilitati",
    (width) => {
      window.innerWidth = width;
      window.innerHeight = 844;
      window.dispatchEvent(new Event("resize"));

      render(<GamificationShell missionsEnabled vibeRushEnabled />);

      const dock = getDock();
      expect(
        dock.querySelectorAll(".game-mission-fab, .vibe-mini-launcher"),
      ).toHaveLength(2);
      cleanup();
    },
  );

  it.each([
    [390, 844],
    [844, 390],
    [430, 932],
    [932, 430],
  ])(
    "orientation %ix%i: nessuna variazione di struttura del dock",
    (width, height) => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event("resize"));

      render(<GamificationShell missionsEnabled vibeRushEnabled />);
      expect(getDock()).toBeTruthy();
      cleanup();
    },
  );

  it("nessuna violazione axe sul dock con entrambi i launcher", async () => {
    const { container } = render(
      <GamificationShell missionsEnabled vibeRushEnabled />,
    );
    await expectNoAxeViolations(container);
  });
});
