/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CollectionDetailHeroV4 } from "@/components/collections/collection-detail-hero-v4";

import { makeCollection } from "./fixture";

afterEach(() => {
  cleanup();
});

describe("CollectionDetailHeroV4", () => {
  it("surfaces outcome, audience, cost/setup and a stack primary CTA", () => {
    const collection = makeCollection();
    render(<CollectionDetailHeroV4 collection={collection} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(collection.title);
    expect(screen.getByText("Dall'idea al primo prodotto vendibile")).toBeTruthy();
    expect(screen.getByText("Per founder indipendenti e builder snelli")).toBeTruthy();
    expect(screen.getByText("€0–30/mese")).toBeTruthy();
    expect(screen.getByText("< 1 ora")).toBeTruthy();

    const primary = screen.getByRole("link", { name: /Avvia questa raccolta/ });
    expect(primary.getAttribute("href")).toBe("#cx-detail-stack");
    expect(primary.className).toContain("cx-detail-hero-v4__cta--primary");

    const catalog = screen.getByRole("link", { name: "Catalogo" });
    expect(catalog.getAttribute("href")).toBe("/archivio");
    expect(catalog.className).toContain("cx-detail-hero-v4__catalog");
    expect(screen.queryByText("Tutti i tool del Catalogo")).toBeNull();
    expect(screen.queryByText(/strumenti CORE/)).toBeNull();
  });
});
