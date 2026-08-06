/**
 * Rendered lifecycle tests for SponsorImpressionTracker.
 *
 * The impression contract:
 *   - one impression per visible mount (IntersectionObserver-gated);
 *   - the same mount never re-emits, no matter how many visibility
 *     callbacks arrive or how many times the tree rerenders;
 *   - an unmount + remount (new page view / SPA round-trip) produces a
 *     NEW legitimate impression (no module-level key store);
 *   - an analytics failure is non-fatal and never blocks the UI.
 *
 * IntersectionObserver is not implemented by jsdom, so it is replaced with
 * a controllable fake stored in the hoisted `ioInstances` array.
 */

// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SponsorImpressionTracker } from "@/components/monetization/sponsor-analytics-tracker";

const ioInstances = vi.hoisted(() => [] as unknown[]);

const mockTrackSponsorImpression = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analytics/sponsor-events", () => ({
  trackSponsorImpression: mockTrackSponsorImpression,
  trackSponsorClick: vi.fn(),
  trackSponsorOpportunityClick: vi.fn(),
}));

type FakeObserver = {
  observe: (node: Element) => void;
  disconnect: () => void;
  disconnected: boolean;
  callback: (entries: Array<Record<string, unknown>>) => void;
  visible: (node: Element) => void;
  hidden: (node: Element) => void;
};

function installFakeIntersectionObserver() {
  class FakeIntersectionObserver {
    readonly callback: FakeObserver["callback"];
    readonly nodes = new Set<Element>();
    disconnected = false;

    constructor(
      callback: (entries: Array<Record<string, unknown>>) => void,
    ) {
      this.callback = callback;
      ioInstances.push(this);
    }

    observe(node: Element) {
      this.nodes.add(node);
    }

    unobserve(node: Element) {
      this.nodes.delete(node);
    }

    disconnect() {
      this.disconnected = true;
      this.nodes.clear();
    }

    visible(node: Element) {
      this.callback([
        {
          isIntersecting: true,
          intersectionRatio: 1,
          target: node,
        },
      ]);
    }

    hidden(node: Element) {
      this.callback([
        {
          isIntersecting: false,
          intersectionRatio: 0,
          target: node,
        },
      ]);
    }
  }

  (globalThis as Record<string, unknown>).IntersectionObserver =
    FakeIntersectionObserver;

  return ioInstances as unknown as FakeObserver[];
}

const defaultProps = {
  campaignId: "taylora-v1-2026",
  sponsorId: "taylora",
  placementId: "home-partner-spotlight",
  route: "/",
};

function MockChildren() {
  return <div>sponsor</div>;
}

describe("SponsorImpressionTracker lifecycle", () => {
  let observers: FakeObserver[];

  beforeEach(() => {
    ioInstances.length = 0;
    mockTrackSponsorImpression.mockReset();
    vi.stubEnv("NODE_ENV", "development");
    observers = installFakeIntersectionObserver();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fires exactly one impression after IntersectionObserver reports visibility", () => {
    const { container } = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    expect(mockTrackSponsorImpression).not.toHaveBeenCalled();

    const [observer] = observers;
    const node = container.querySelector("[data-sponsor-tracker=impression]");
    act(() => observer.visible(node as Element));

    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);
    expect(mockTrackSponsorImpression).toHaveBeenCalledWith({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });
  });

  it("does not fire while the element stays hidden", () => {
    const { container } = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    const [observer] = observers;
    const node = container.querySelector("[data-sponsor-tracker=impression]");
    act(() => observer.hidden(node as Element));
    act(() => observer.hidden(node as Element));

    expect(mockTrackSponsorImpression).not.toHaveBeenCalled();
  });

  it("fires one impression across repeated visibility callbacks on the same mount", () => {
    const { container, rerender } = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    const [observer] = observers;
    const node = container.querySelector("[data-sponsor-tracker=impression]");

    act(() => observer.visible(node as Element));
    act(() => observer.visible(node as Element));
    act(() => observer.visible(node as Element));

    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);

    // A rerender of the same mount must not emit again.
    rerender(
      <SponsorImpressionTracker {...defaultProps} toolSlug="taylora">
        <MockChildren />
      </SponsorImpressionTracker>,
    );
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);
  });

  it("does not re-observe after firing on the same mount", () => {
    const { container } = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    const [observer] = observers;
    const node = container.querySelector("[data-sponsor-tracker=impression]");
    act(() => observer.visible(node as Element));

    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);
    expect(observer.disconnected).toBe(true);
  });

  it("emits a NEW impression after unmount + remount (new page view)", () => {
    const first = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    let observer = observers[0];
    let node = first.container.querySelector(
      "[data-sponsor-tracker=impression]",
    );
    act(() => observer.visible(node as Element));
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);

    first.unmount();
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);

    // New mount on the next page view: a fresh observer is created.
    const second = render(
      <SponsorImpressionTracker {...defaultProps} route="/">
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    observer = observers[1];
    node = second.container.querySelector("[data-sponsor-tracker=impression]");
    act(() => observer.visible(node as Element));

    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(2);
  });

  it("emits a NEW impression after SPA navigation away and back to the route", () => {
    // Simulates Home -> Archivio -> Home: each navigation remounts the
    // tracker, so the second Home visit is a fresh mount.
    function mountOn(route: string) {
      return render(
        <SponsorImpressionTracker {...defaultProps} route={route}>
          <MockChildren />
        </SponsorImpressionTracker>,
      );
    }

    const home1 = mountOn("/");
    act(() => observers[0].visible(
      home1.container.querySelector(
        "[data-sponsor-tracker=impression]",
      ) as Element,
    ));
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(1);
    home1.unmount();

    const archivio = mountOn("/archivio");
    act(() => observers[1].visible(
      archivio.container.querySelector(
        "[data-sponsor-tracker=impression]",
      ) as Element,
    ));
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(2);
    archivio.unmount();

    const home2 = mountOn("/");
    act(() => observers[2].visible(
      home2.container.querySelector(
        "[data-sponsor-tracker=impression]",
      ) as Element,
    ));
    expect(mockTrackSponsorImpression).toHaveBeenCalledTimes(3);
  });

  it("does not fire when IntersectionObserver is unavailable", () => {
    (globalThis as Record<string, unknown>).IntersectionObserver = undefined;

    render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    expect(mockTrackSponsorImpression).not.toHaveBeenCalled();
  });

  it("keeps rendering children when the analytics callback throws", () => {
    mockTrackSponsorImpression.mockImplementation(() => {
      throw new Error("analytics backend down");
    });

    const { container } = render(
      <SponsorImpressionTracker {...defaultProps}>
        <MockChildren />
      </SponsorImpressionTracker>,
    );

    const [observer] = observers;
    const node = container.querySelector("[data-sponsor-tracker=impression]");

    expect(() => act(() => observer.visible(node as Element))).not.toThrow();
    expect(container.textContent).toContain("sponsor");
    expect(mockTrackSponsorImpression).toHaveBeenCalled();
  });
});
