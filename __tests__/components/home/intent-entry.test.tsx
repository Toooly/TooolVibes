// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntentEntry } from "@/components/home/intent-entry";

describe("IntentEntry motion affordances", () => {
  it("renders one search field with the catalog placeholder and CTA", () => {
    const { container } = render(<IntentEntry />);
    expect(screen.getByRole("searchbox")).toBeTruthy();
    expect(screen.getByPlaceholderText("Cerca tool, categorie, use case...")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerca" })).toBeTruthy();
    expect(container.querySelector(".def-intent__chips")).toBeNull();
    expect(container.querySelector(".def-intent__label")).toBeNull();
  });

  it("marks search as the home emphasis surface", () => {
    const { container } = render(<IntentEntry />);
    expect(container.querySelector(".def-intent__field.tv-emphasis--search")).toBeTruthy();
    expect(container.querySelector(".tv-signal-search__orbit")).toBeNull();
  });
});
