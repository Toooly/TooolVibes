// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { SAVE_HOLD_MS } from "@/components/tools/save-hold";
import { closeSaveOverflow } from "@/components/tools/save-overflow-state";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import type { WorkspaceAction } from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "guest" }, apply(actions));
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

beforeEach(() => {
  window.localStorage.clear();
  seedWorkspace();
  closeSaveOverflow();
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.hasPointerCapture = () => false;
});

afterEach(() => {
  cleanup();
  closeSaveOverflow();
  vi.useRealTimers();
});

describe("ShortlistToggle primitive", () => {
  it("click saves and second click unsaves", () => {
    render(<ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" />);

    const button = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.click(button);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
    expect(button.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([]);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("acknowledges only the clicked save and cancels feedback on quick removal", () => {
    vi.useFakeTimers();
    render(<><ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" /><ShortlistToggle slug="blink" mode="icon" toolName="Blink" /></>);
    const cursor = screen.getByRole("button", { name: "Salva Cursor" });
    const blink = screen.getByRole("button", { name: "Salva Blink" });
    fireEvent.click(cursor);
    expect(cursor.getAttribute("data-save-feedback")).toBe("added");
    expect(blink.hasAttribute("data-save-feedback")).toBe(false);
    fireEvent.click(cursor);
    act(() => vi.advanceTimersByTime(2000));
    expect(cursor.hasAttribute("data-save-feedback")).toBe(false);
    expect(cursor.getAttribute("aria-pressed")).toBe("false");
  });

  it("restores saved state without replaying click feedback", () => {
    render(<ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" />);
    act(() => seedWorkspace([{ type: "saved/toggle", slug: "cursor", at: "2026-10-19T08:00:00Z" }]));
    const button = screen.getByRole("button", { name: "Rimuovi Cursor dai salvati" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.hasAttribute("data-save-feedback")).toBe(false);
  });

  it("exposes aria-pressed and a tool-specific aria-label", () => {
    render(<ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" />);
    const button = screen.getByRole("button", { name: "Salva Cursor" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("aria-label")).toContain("Cursor");

    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Rimuovi Cursor dai salvati");
  });

  it("click is Speed 1 and does not open Speed 2", () => {
    const onSpeed2Open = vi.fn();
    render(
      <ShortlistToggle
        slug="cursor"
        mode="icon"
        toolName="Cursor"
        onSpeed2Open={onSpeed2Open}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(onSpeed2Open).not.toHaveBeenCalled();
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("hold 400ms opens Speed 2 and click after hold does not unsave", () => {
    vi.useFakeTimers();
    const onSpeed2Open = vi.fn();
    render(
      <ShortlistToggle
        slug="cursor"
        mode="icon"
        toolName="Cursor"
        onSpeed2Open={onSpeed2Open}
      />,
    );

    const button = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(SAVE_HOLD_MS);
    });
    expect(onSpeed2Open).toHaveBeenCalledTimes(1);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);

    fireEvent.pointerUp(button, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.click(button);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
    expect(onSpeed2Open).toHaveBeenCalledTimes(1);
  });

  it("hold on a filled heart opens Speed 2 without unsaving", () => {
    vi.useFakeTimers();
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: "2026-07-17T10:00:00.000Z" },
    ]);
    const onSpeed2Open = vi.fn();
    render(
      <ShortlistToggle
        slug="cursor"
        mode="icon"
        toolName="Cursor"
        onSpeed2Open={onSpeed2Open}
      />,
    );

    const button = screen.getByRole("button", { name: "Rimuovi Cursor dai salvati" });
    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(SAVE_HOLD_MS);
    });
    expect(onSpeed2Open).toHaveBeenCalledTimes(1);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("cancels hold when the pointer moves more than 8px", () => {
    vi.useFakeTimers();
    const onSpeed2Open = vi.fn();
    render(
      <ShortlistToggle
        slug="cursor"
        mode="icon"
        toolName="Cursor"
        onSpeed2Open={onSpeed2Open}
      />,
    );

    const button = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
    const move = new Event("pointermove", { bubbles: true, cancelable: true });
    Object.defineProperties(move, {
      clientX: { value: 24 },
      clientY: { value: 10 },
      movementX: { value: 14 },
      movementY: { value: 0 },
      button: { value: 0 },
    });
    fireEvent(button, move);
    act(() => {
      vi.advanceTimersByTime(SAVE_HOLD_MS);
    });
    expect(onSpeed2Open).not.toHaveBeenCalled();
  });

  it("prevents the context menu on the heart", () => {
    render(<ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" />);
    const button = screen.getByRole("button", { name: "Salva Cursor" });
    const event = fireEvent.contextMenu(button);
    expect(event).toBe(false);
  });

  it("announces Salvato on the live region after a save", () => {
    render(<ShortlistToggle slug="cursor" mode="icon" toolName="Cursor" />);
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(screen.getByText("Salvato")).toBeTruthy();
    expect(screen.getByText("Salvato").getAttribute("aria-live")).toBe("polite");
  });
});
