// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileCatalogView } from "@/components/directory/mobile-catalog-view";
import { useCatalogController } from "@/components/directory/catalog/use-catalog-controller";
import { serializeCatalogUrl } from "@/components/directory/catalog/catalog-controller";
import { CATALOG_FILTER_GROUPS, makeCatalogTool } from "./catalog-test-fixtures";

/* next/navigation mock: searchParams are driven by a mutable hoisted
   value so tests can simulate back/forward (popstate) by changing the
   URL and re-rendering. A stable instance per search string mirrors
   Next.js referential stability. */
const { pushMock, replaceMock, urlState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  urlState: { current: "" },
}));
vi.mock("next/navigation", () => {
  let cachedSearch: string | null = null;
  let cachedParams: URLSearchParams | null = null;
  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    useSearchParams: () => {
      if (cachedSearch !== urlState.current) {
        cachedSearch = urlState.current;
        cachedParams = new URLSearchParams(urlState.current);
      }
      return cachedParams as URLSearchParams;
    },
  };
});

/* Motion mock: strip animation internals (see mobile-catalog-view.test). */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileTap",
  "whileHover",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "variants",
  "drag",
  "dragConstraints",
]);

type MotionProps = Record<string, unknown> & { children?: ReactNode };

function stripMotionProps(props: MotionProps): MotionProps {
  const clean: MotionProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) clean[key] = value;
  }
  return clean;
}

vi.mock("motion/react", () => {
  const cache = new Map<string, (props: MotionProps) => ReactNode>();
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, (props: MotionProps) =>
            createElement(tag, stripMotionProps(props)),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

/* B31 fixture: includes the production false-positive trap (WeWeb's
   tracked source URL contains "blink"; URLs are not searchable). */
function makeUrlStateTools() {
  return [
    makeCatalogTool({
      slug: "vibecode",
      name: "VibeCode",
      categoryLabel: "Vibe coding",
      level: "expert",
      levelLabel: "Avanzato",
      segments: ["vibe-coding"],
      tags: ["vibe coding", "builder app AI"],
      shortDescription: "Builder AI per iterare una app mobile o web da prompt.",
    }),
    makeCatalogTool({
      slug: "blink",
      name: "Blink",
      categoryLabel: "Vibe coding",
      level: "beginner",
      levelLabel: "Base",
      segments: ["vibe-coding"],
      tags: ["vibe coding", "ai app builder", "prompt-to-app", "react"],
      shortDescription:
        "AI app builder che trasforma un'idea in un'app funzionante in pochi minuti.",
      originalSourceUrl: "https://www.tooolvibes.com/p/blink-new",
    }),
    makeCatalogTool({
      slug: "weweb",
      name: "WeWeb",
      categoryLabel: "No-code",
      level: "featured",
      levelLabel: "In evidenza",
      segments: ["no-code"],
      tags: ["no-code", "builder web app"],
      shortDescription: "Piattaforma visuale no-code/AI per creare web app.",
      originalSourceUrl: "https://www.tooolvibes.com/p/blink-61f26b689a7da189",
    }),
    makeCatalogTool({
      slug: "gamma",
      name: "Gamma",
      categoryLabel: "Marketing",
      level: "beginner",
      levelLabel: "Base",
      segments: ["marketing"],
      tags: ["automation"],
      shortDescription: "Tool gamma no-code",
    }),
  ];
}

beforeEach(() => {
  pushMock.mockClear();
  replaceMock.mockClear();
  urlState.current = "";
});

afterEach(() => {
  cleanup();
});

describe("catalog URL state — canonical serialization", () => {
  it("serializes group/q/tag/level with fixed order and URL encoding", () => {
    expect(serializeCatalogUrl({})).toBe("/archivio");
    expect(serializeCatalogUrl({ query: "blink" })).toBe("/archivio?q=blink");
    expect(
      serializeCatalogUrl({ query: "blink", group: "vibe-coding" }),
    ).toBe("/archivio?group=vibe-coding&q=blink");
    expect(
      serializeCatalogUrl({
        query: "caffè & co",
        group: "no-code",
        tag: "react",
        level: "beginner",
      }),
    ).toBe(
      `/archivio?group=no-code&${new URLSearchParams({ q: "caffè & co" }).toString()}&tag=react&level=beginner`,
    );
    // defaults collapse to the plain archive URL
    expect(
      serializeCatalogUrl({ query: " ", group: "all", level: "all" }),
    ).toBe("/archivio");
  });
});

describe("catalog controller — deep link (IA-504)", () => {
  it("restores the query from the URL and ranks Blink first without false positives", () => {
    urlState.current = "q=blink";
    render(
      <MobileCatalogView
        tools={makeUrlStateTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialQuery="blink"
      />,
    );

    expect(screen.getByRole("region", { name: "Tool in Tutti i tool" })).toBeTruthy();
    expect(screen.getAllByText("Blink").length).toBeGreaterThan(0);
    expect(screen.queryByText("WeWeb")).toBeNull();
    expect(screen.queryByText("Gamma")).toBeNull();

    const input = screen.getByLabelText(
      "Affina i tool visibili",
    ) as HTMLInputElement;
    expect(input.value).toBe("blink");
  });

  it("restores the level filter from the server-parsed deep link", () => {
    const { result } = renderHook(() =>
      useCatalogController({
        tools: makeUrlStateTools(),
        filterGroups: CATALOG_FILTER_GROUPS,
        initialLevel: "beginner",
      }),
    );

    expect(result.current.activeLevel).toBe("beginner");
    expect(result.current.filteredTools.map((tool) => tool.slug)).toEqual([
      "blink",
      "gamma",
    ]);
  });
});

describe("catalog controller — typing serializes into the URL", () => {
  it("replace-states the canonical q param while preserving group/tag/level", () => {
    const { result } = renderHook(() =>
      useCatalogController({
        tools: makeUrlStateTools(),
        filterGroups: CATALOG_FILTER_GROUPS,
        initialGroup: "vibe-coding",
        initialTag: "react",
        initialLevel: "beginner",
      }),
    );

    act(() => result.current.handleSearchChange("blink"));

    expect(replaceMock).toHaveBeenCalledWith(
      "/archivio?group=vibe-coding&q=blink&tag=react&level=beginner",
      { scroll: false },
    );
    expect(result.current.searchQuery).toBe("blink");
    expect(result.current.filteredTools.map((tool) => tool.slug)).toEqual([
      "blink",
    ]);
  });

  it("category selection pushes a URL that preserves the active query", () => {
    const { result } = renderHook(() =>
      useCatalogController({
        tools: makeUrlStateTools(),
        filterGroups: CATALOG_FILTER_GROUPS,
      }),
    );

    act(() => result.current.handleSearchChange("blink"));
    act(() => result.current.handleCategorySelect("vibe-coding"));

    expect(pushMock).toHaveBeenLastCalledWith(
      "/archivio?group=vibe-coding&q=blink",
      { scroll: false },
    );
  });

  it("level selection replace-states the level param", () => {
    const { result } = renderHook(() =>
      useCatalogController({
        tools: makeUrlStateTools(),
        filterGroups: CATALOG_FILTER_GROUPS,
      }),
    );

    act(() => result.current.setActiveLevel("beginner"));

    expect(replaceMock).toHaveBeenCalledWith("/archivio?level=beginner", {
      scroll: false,
    });
  });
});

describe("catalog controller — back/forward restores state (IA-504)", () => {
  it("restores query, group and results when the URL changes via popstate", () => {
    const tools = makeUrlStateTools();
    urlState.current = "q=blink";
    const { rerender } = render(
      <MobileCatalogView
        tools={tools}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialQuery="blink"
      />,
    );
    expect(screen.getAllByText("Blink").length).toBeGreaterThan(0);

    // user navigates to a group (push), then the URL reflects the group
    urlState.current = "group=vibe-coding";
    rerender(
      <MobileCatalogView
        tools={tools}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialQuery="blink"
      />,
    );
    expect(screen.getByRole("region", { name: "Tool in Vibe coding" })).toBeTruthy();
    expect(
      (screen.getByLabelText("Affina i tool visibili") as HTMLInputElement).value,
    ).toBe("");

    // browser Back: the previous URL restores query and results
    urlState.current = "q=blink";
    rerender(
      <MobileCatalogView
        tools={tools}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialQuery="blink"
      />,
    );
    expect(
      (screen.getByLabelText("Affina i tool visibili") as HTMLInputElement).value,
    ).toBe("blink");
    expect(screen.getAllByText("Blink").length).toBeGreaterThan(0);
    expect(screen.queryByText("WeWeb")).toBeNull();
  });

  it("restores the level filter on popstate", () => {
    const tools = makeUrlStateTools();
    const { result, rerender } = renderHook(() =>
      useCatalogController({ tools, filterGroups: CATALOG_FILTER_GROUPS }),
    );
    expect(result.current.activeLevel).toBe("all");

    urlState.current = "level=expert";
    rerender();
    expect(result.current.activeLevel).toBe("expert");
    expect(result.current.filteredTools.map((tool) => tool.slug)).toEqual([
      "vibecode",
    ]);

    urlState.current = "";
    rerender();
    expect(result.current.activeLevel).toBe("all");
  });
});

describe("catalog controller — keyboard operability", () => {
  it("typing via keyboard events filters results and updates the URL", () => {
    urlState.current = "";
    render(
      <MobileCatalogView
        tools={makeUrlStateTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialGroup="vibe-coding"
      />,
    );

    const input = screen.getByLabelText("Affina i tool visibili");
    fireEvent.change(input, { target: { value: "blink" } });

    expect(replaceMock).toHaveBeenLastCalledWith(
      "/archivio?group=vibe-coding&q=blink",
      { scroll: false },
    );
    expect(screen.getAllByText("Blink").length).toBeGreaterThan(0);
    expect(screen.queryByText("VibeCode")).toBeNull();

    // clearing via keyboard restores the unfiltered group view
    fireEvent.change(input, { target: { value: "" } });
    expect(replaceMock).toHaveBeenLastCalledWith("/archivio?group=vibe-coding", {
      scroll: false,
    });
    expect(screen.getAllByText("VibeCode").length).toBeGreaterThan(0);
  });
});

describe("catalog controller — legacy engine behind the flag", () => {
  it("unifiedSearchEnabled=false keeps legacy behavior without URL writes", () => {
    const { result } = renderHook(() =>
      useCatalogController({
        tools: makeUrlStateTools(),
        filterGroups: CATALOG_FILTER_GROUPS,
        unifiedSearchEnabled: false,
      }),
    );

    act(() => result.current.handleSearchChange("blink"));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(result.current.searchQuery).toBe("blink");
    expect(result.current.filteredTools.map((tool) => tool.slug)).toContain(
      "blink",
    );

    act(() => result.current.handleCategorySelect("vibe-coding"));
    expect(pushMock).toHaveBeenLastCalledWith("/archivio?group=vibe-coding", {
      scroll: false,
    });
  });
});
