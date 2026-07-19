// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DirectoryHeaderSearch } from "@/components/directory/directory-header-search";

/* next/navigation mock: pathname/searchParams driven by hoisted mutable
   state so each test can simulate being on/off the archive route.
   useSearchParams returns a stable instance per search string, mirroring
   Next.js referential stability (the component effect depends on it). */
const { pushMock, navState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  navState: { pathname: "/", search: "" },
}));
vi.mock("next/navigation", () => {
  let cachedSearch: string | null = null;
  let cachedParams: URLSearchParams | null = null;
  return {
    useRouter: () => ({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => navState.pathname,
    useSearchParams: () => {
      if (cachedSearch !== navState.search) {
        cachedSearch = navState.search;
        cachedParams = new URLSearchParams(navState.search);
      }
      return cachedParams as URLSearchParams;
    },
  };
});

beforeEach(() => {
  pushMock.mockClear();
  navState.pathname = "/";
  navState.search = "";
});

afterEach(() => {
  cleanup();
});

describe("DirectoryHeaderSearch — canonical URL submit (B31)", () => {
  it("submits a plain query URL when outside the archive", () => {
    render(<DirectoryHeaderSearch />);

    fireEvent.change(screen.getByLabelText("Cerca nel catalogo completo"), {
      target: { value: "Blink" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/archivio?q=Blink");
  });

  it("URL-encodes the query", () => {
    render(<DirectoryHeaderSearch />);

    fireEvent.change(screen.getByLabelText("Cerca nel catalogo completo"), {
      target: { value: "caffè & co" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith(
      `/archivio?${new URLSearchParams({ q: "caffè & co" }).toString()}`,
    );
  });

  it("preserves group/tag/level when submitting from the archive", () => {
    navState.pathname = "/archivio";
    navState.search = "group=vibe-coding&tag=react&level=beginner";
    render(<DirectoryHeaderSearch />);

    fireEvent.change(screen.getByLabelText("Cerca nel catalogo completo"), {
      target: { value: "blink" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith(
      "/archivio?group=vibe-coding&q=blink&tag=react&level=beginner",
    );
  });

  it("keeps the active filters and drops an emptied query on the archive", () => {
    navState.pathname = "/archivio";
    navState.search = "group=vibe-coding&q=blink";
    render(<DirectoryHeaderSearch />);

    fireEvent.change(screen.getByLabelText("Cerca nel catalogo completo"), {
      target: { value: " " },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/archivio?group=vibe-coding");
  });

  it("submits the plain archive URL when nothing is active", () => {
    navState.pathname = "/archivio";
    navState.search = "";
    render(<DirectoryHeaderSearch />);

    fireEvent.change(screen.getByLabelText("Cerca nel catalogo completo"), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/archivio");
  });

  it("mirrors the q param from the URL into the input (shared state)", () => {
    navState.pathname = "/archivio";
    navState.search = "q=blink";
    render(<DirectoryHeaderSearch />);

    const input = screen.getByLabelText(
      "Cerca nel catalogo completo",
    ) as HTMLInputElement;
    expect(input.value).toBe("blink");
  });

  it("submits via Enter on the input (keyboard)", () => {
    render(<DirectoryHeaderSearch />);

    const input = screen.getByLabelText("Cerca nel catalogo completo");
    fireEvent.change(input, { target: { value: "blink" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(pushMock).toHaveBeenCalledWith("/archivio?q=blink");
  });
});
