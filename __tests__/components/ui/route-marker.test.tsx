// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarkdownContent } from "@/components/editorial/markdown-content";
import { ResponsiveDisclosureCard } from "@/components/ui/responsive-disclosure-card";
import { RouteMarker } from "@/components/ui/route-marker";
import { SectionHeader } from "@/components/ui/section-header";

afterEach(cleanup);

describe("shared editorial identity primitives", () => {
  it("renders a semantic route label and optional status", () => {
    const { container } = render(
      <RouteMarker
        index="08"
        label="Archivio editoriale"
        status="12 letture"
        density="hero"
      />,
    );

    expect(screen.getByText("Archivio editoriale")).toBeTruthy();
    expect(screen.getByText("12 letture")).toBeTruthy();
    expect(container.firstElementChild?.getAttribute("data-density")).toBe("hero");
  });

  it("lets a route promote its canonical section heading to h1", () => {
    render(
      <SectionHeader
        as="h1"
        eyebrow="Approfondimenti"
        title="Guide e articoli"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Guide e articoli" }),
    ).toBeTruthy();
  });

  it("demotes markdown document titles beneath the page-level h1", () => {
    render(<MarkdownContent content={"# Titolo importato\n\nTesto editoriale."} />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Titolo importato" }),
    ).toBeTruthy();
  });

  it("keeps one disclosure tree and exposes its mobile details on demand", () => {
    render(
      <ResponsiveDisclosureCard icon={<span aria-hidden="true" />} title="Kit curati">
        <p>Dettaglio operativo</p>
      </ResponsiveDisclosureCard>,
    );

    const toggle = screen.getByRole("button", { name: "Kit curati" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Dettaglio operativo").parentElement?.className).toContain("block");
  });
});
