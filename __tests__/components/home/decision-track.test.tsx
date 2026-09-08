// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionJourney } from "@/components/home/decision-journey";

describe("Decision Track", () => {
  it("shows one explanation at a time and changes on node tap", () => {
    render(<DecisionJourney />);
    expect(screen.getByText(/Esplora il catalogo/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ricorda" }));
    expect(screen.getByText(/Conserva il motivo/)).toBeTruthy();
    expect(screen.queryByText(/Esplora il catalogo/)).toBeNull();
  });
});
