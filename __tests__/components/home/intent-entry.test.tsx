// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntentEntry } from "@/components/home/intent-entry";

describe("IntentEntry motion affordances", () => {
  it("keeps extra intents collapsed until Altri obiettivi expands them", () => {
    const { container } = render(<IntentEntry />);
    const more = screen.getByRole("button", { name: "Altri obiettivi" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    expect(more.getAttribute("aria-controls")).toBe("home-intent-extra");

    const extras = container.querySelectorAll("[data-intent-extra]");
    expect(extras.length).toBeGreaterThan(0);
    extras.forEach((node) => {
      expect(node.hasAttribute("hidden")).toBe(true);
    });

    fireEvent.click(more);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    extras.forEach((node) => {
      expect(node.hasAttribute("hidden")).toBe(false);
    });
  });

  it("marks search as the home emphasis surface", () => {
    const { container } = render(<IntentEntry />);
    expect(container.querySelector(".def-intent__field.tv-emphasis--search")).toBeTruthy();
  });
});
