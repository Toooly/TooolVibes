// @vitest-environment jsdom

import { Profiler, createElement, Fragment, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileCatalogView } from "@/components/directory/mobile-catalog-view";
import { useCatalogController } from "@/components/directory/catalog/use-catalog-controller";
import { CATALOG_FILTER_GROUPS, makeCatalogTools } from "./catalog-test-fixtures";

/* Router mock: the facade serializes group state via router.push. */
const { pushMock, replaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(""),
}));

/* Motion mock: strip animation internals so assertions and the render
   counter are deterministic under jsdom (behavior under test is state,
   not animation frames). Component identity is cached per tag. */
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
    MotionConfig: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
});

beforeEach(() => {
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("MobileCatalogView facade — URL state", () => {
  it("parses initial group/query props and mounts the tools view directly", () => {
    render(
      <MobileCatalogView
        tools={makeCatalogTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialGroup="vibe-coding"
      />,
    );

    expect(screen.getByRole("region", { name: "Tool in Vibe coding" })).toBeTruthy();
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gamma")).toBeNull();
    expect(screen.queryByText("Delta")).toBeNull();
  });

  it("serializes a category selection into the archive query URL", () => {
    render(
      <MobileCatalogView tools={makeCatalogTools()} filterGroups={CATALOG_FILTER_GROUPS} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vibe coding. 2 tool" }));

    expect(pushMock).toHaveBeenCalledWith("/archivio?group=vibe-coding", {
      scroll: false,
    });
    expect(screen.getByRole("region", { name: "Tool in Vibe coding" })).toBeTruthy();
    expect(screen.queryByText("Gamma")).toBeNull();
  });

  it("serializes the back navigation to the plain archive URL", () => {
    render(
      <MobileCatalogView
        tools={makeCatalogTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialGroup="vibe-coding"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Torna alle categorie" }));

    expect(pushMock).toHaveBeenCalledWith("/archivio", { scroll: false });
    expect(screen.getByText("Scegli una categoria per iniziare")).toBeTruthy();
  });
});

describe("MobileCatalogView facade — filter combinations and zero results", () => {
  it("combines group and level filters", () => {
    render(
      <MobileCatalogView tools={makeCatalogTools()} filterGroups={CATALOG_FILTER_GROUPS} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vibe coding. 2 tool" }));
    fireEvent.click(screen.getByRole("button", { name: "Base" }));

    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.queryByText("Beta")).toBeNull();
    expect(screen.queryByText("Gamma")).toBeNull();
    expect(screen.queryByText("Delta")).toBeNull();
  });

  it("renders the empty state when no tool matches", () => {
    const { container } = render(
      <MobileCatalogView
        tools={makeCatalogTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
        initialGroup="vibe-coding"
        initialQuery="zzzz-niente"
      />,
    );

    expect(screen.getByText("Nessun tool in questa vista")).toBeTruthy();
    expect(screen.getByText("0 risultati")).toBeTruthy();
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");

    const emptyCta = container.querySelector<HTMLButtonElement>(
      ".mobile-catalog-view__empty-cta",
    );
    expect(emptyCta).not.toBeNull();
    fireEvent.click(emptyCta as HTMLButtonElement);
    expect(pushMock).toHaveBeenCalledWith("/archivio", { scroll: false });
  });
});

describe("MobileCatalogView facade — deterministic rerender count", () => {
  it("commits exactly one render per in-branch filter update", () => {
    let commits = 0;
    render(
      <Profiler
        id="mobile-catalog-view"
        onRender={() => {
          commits += 1;
        }}
      >
        <MobileCatalogView
          tools={makeCatalogTools()}
          filterGroups={CATALOG_FILTER_GROUPS}
          initialGroup="vibe-coding"
        />
      </Profiler>,
    );

    const afterMount = commits;
    fireEvent.change(screen.getByLabelText("Affina i tool visibili"), {
      target: { value: "prototipi" },
    });
    expect(commits - afterMount).toBe(1);

    const afterSearch = commits;
    fireEvent.click(screen.getByRole("button", { name: "Base" }));
    expect(commits - afterSearch).toBe(1);
  });

  it("batches controller state updates into a single consumer render", () => {
    const tools = makeCatalogTools();
    let hookRenders = 0;
    const { result } = renderHook(() => {
      hookRenders += 1;
      return useCatalogController({ tools, filterGroups: CATALOG_FILTER_GROUPS });
    });

    expect(hookRenders).toBe(1);
    expect(result.current.view).toBe("categories");

    act(() => result.current.handleCategorySelect("vibe-coding"));
    expect(hookRenders).toBe(2);
    expect(result.current.view).toBe("tools");
    expect(pushMock).toHaveBeenLastCalledWith("/archivio?group=vibe-coding", {
      scroll: false,
    });

    act(() => result.current.handleSearchChange("prototipi"));
    expect(hookRenders).toBe(3);
    expect(result.current.filteredTools.map((tool) => tool.slug)).toEqual(["alpha"]);

    act(() => result.current.handleBack());
    expect(hookRenders).toBe(4);
    expect(result.current.view).toBe("categories");
    expect(result.current.searchQuery).toBe("");
    expect(pushMock).toHaveBeenLastCalledWith("/archivio", { scroll: false });
  });
});
