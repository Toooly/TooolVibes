// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DirectoryHeaderSearch } from "@/components/directory/directory-header-search";
import { KEYBOARD_SCROLL_DELAY_MS } from "@/lib/hooks/use-keyboard-aware-scroll";

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

describe("DirectoryHeaderSearch — keyboard/viewport policy (B39 / MOB-703)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("l'input applica lo zoom guard iOS e mantiene enterKeyHint search", () => {
    render(<DirectoryHeaderSearch />);

    const input = screen.getByLabelText("Cerca nel catalogo completo");
    expect(input.className).toContain("tv-kbd-input");
    expect(input.getAttribute("enterkeyhint")).toBe("search");
  });

  it("scroll-to-input: il campo coperto dalla tastiera viene riportato nel viewport", () => {
    render(<DirectoryHeaderSearch compact autoFocus />);

    const input = screen.getByLabelText("Cerca nel catalogo completo");
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      top: 900,
      bottom: 940,
      left: 0,
      right: 0,
      width: 0,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    vi.useFakeTimers();
    fireEvent.focusIn(input);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });

  it("non scrolla se il campo è già visibile (tastiera chiusa / desktop)", () => {
    render(<DirectoryHeaderSearch />);

    const input = screen.getByLabelText("Cerca nel catalogo completo");
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      top: 120,
      bottom: 160,
      left: 0,
      right: 0,
      width: 0,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    vi.useFakeTimers();
    fireEvent.focusIn(input);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("input e submit restano nel DOM a 320-430px e in landscape", () => {
    const viewports = [
      { width: 320, height: 340 },
      { width: 390, height: 380 },
      { width: 430, height: 400 },
      { width: 844, height: 390 },
    ];

    for (const viewport of viewports) {
      cleanup();
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: viewport.width,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        writable: true,
        value: viewport.height,
      });

      render(<DirectoryHeaderSearch compact />);

      const input = screen.getByLabelText(
        "Cerca nel catalogo completo",
      ) as HTMLInputElement;
      expect(input.disabled).toBe(false);
      expect(input.className).toContain("tv-kbd-input");
      expect(
        screen.getByRole("button", { name: /Cerca/ }),
      ).toBeTruthy();
    }
  });
});
