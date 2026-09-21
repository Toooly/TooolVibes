// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DecisionJourney } from "@/components/home/decision-journey";

describe("Decision Track", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows one explanation at a time and changes on node tap", () => {
    render(<DecisionJourney />);
    expect(screen.getByText(/Parti dal catalogo/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Apri il catalogo" })).toBeTruthy();
    expect(screen.queryByText(/Continua da/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ricorda" }));
    expect(screen.getByText(/Conserva il motivo/)).toBeTruthy();
    expect(screen.queryByText(/Parti dal catalogo/)).toBeNull();
    expect(screen.getByRole("link", { name: "Apri i salvati" })).toBeTruthy();
  });

  it("uses destination CTAs for Confronta and Decidi", () => {
    render(<DecisionJourney />);
    fireEvent.click(screen.getByRole("button", { name: "Confronta" }));
    expect(screen.getByRole("link", { name: "Apri il confronto" }).getAttribute("href")).toBe(
      "/compare",
    );
    fireEvent.click(screen.getByRole("button", { name: "Decidi" }));
    expect(screen.getByRole("link", { name: "Apri le decisioni" }).getAttribute("href")).toBe(
      "/compare",
    );
  });
});
