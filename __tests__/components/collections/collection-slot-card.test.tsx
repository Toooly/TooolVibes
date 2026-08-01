// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CollectionSlotCard } from "@/components/collections/collection-slot-card";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";

const slot: ResolvedCollectionToolSlot = {
  tool_slug: "test-tool",
  role: "Prima valutazione",
  note: "Serve per verificare il fit prima di allargare il confronto.",
  featured: true,
  order: 0,
  tool: {
    id: "test-tool",
    name: "Test Tool",
    slug: "test-tool",
    category: "Produttività",
    short_description_it: "Un profilo compatto con dati editoriali reali.",
    website_url: "https://example.com",
    affiliate_url: "https://example.com/?ref=tooolvibes",
    pricing: "Freemium",
  },
};

beforeEach(() => {
  window.localStorage.clear();
  activateToolWorkspaceOwner(
    { kind: "guest" },
    createEmptyWorkspaceState(),
  );
});

afterEach(() => {
  cleanup();
});

describe("CollectionSlotCard", () => {
  it("rende il record dello slot senza adapter e mantiene le azioni operative", () => {
    render(<CollectionSlotCard slot={slot} index={0} />);

    expect(screen.getByText("Passaggio 01")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Prima valutazione" })).toBeTruthy();
    expect(screen.getByText("Test Tool")).toBeTruthy();
    expect(screen.getByText("Freemium")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: "Test Tool" }).getAttribute("href"),
    ).toBe("/toools/test-tool");
    expect(
      screen.getByRole("link", { name: "Scheda" }).getAttribute("href"),
    ).toBe("/toools/test-tool");

    const externalLink = screen.getByRole("link", {
      name: "Apri il sito partner di Test Tool",
    });
    expect(externalLink.getAttribute("href")).toBe(
      "https://example.com/?ref=tooolvibes",
    );
    expect(externalLink.getAttribute("rel")).toContain("sponsored");

    const saveButton = screen.getByRole("button", { name: "Da salvare" });
    const compareButton = screen.getByRole("button", { name: /Confronta/ });
    fireEvent.click(saveButton);
    fireEvent.click(compareButton);

    expect(saveButton.getAttribute("aria-pressed")).toBe("true");
    expect(compareButton.getAttribute("aria-pressed")).toBe("true");
  });
});
