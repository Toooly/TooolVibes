// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { PageTransition } from "@/components/app/page-transition";

describe("PageTransition", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? true : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it("renders children without structural forks under reduced motion", () => {
    render(
      <PageTransition>
        <div>Contenuto rotta</div>
      </PageTransition>,
    );
    expect(screen.getByText("Contenuto rotta")).toBeTruthy();
  });
});
