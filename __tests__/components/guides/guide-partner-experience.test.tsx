// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuidePartnerExperience } from "@/components/guides/guide-partner-experience";
import { GUIDE_PARTNER_RAIL_QUERY } from "@/lib/hooks/use-guide-partner-mode";

const analytics = vi.hoisted(() => ({
  impression: vi.fn(),
  click: vi.fn(),
  opportunity: vi.fn(),
}));

vi.mock("@/lib/analytics/sponsor-events", () => ({
  trackSponsorImpression: analytics.impression,
  trackSponsorClick: analytics.click,
  trackSponsorOpportunityClick: analytics.opportunity,
}));

type ChangeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<ChangeListener>();
  const media = {
    get matches() {
      return matches;
    },
    media: GUIDE_PARTNER_RAIL_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
    addListener: (listener: ChangeListener) => listeners.add(listener),
    removeListener: (listener: ChangeListener) => listeners.delete(listener),
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn(() => media));

  return (next: boolean) => {
    matches = next;
    const event = { matches: next, media: GUIDE_PARTNER_RAIL_QUERY } as MediaQueryListEvent;
    listeners.forEach((listener) => listener(event));
  };
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0, 0.1, 0.5, 1];

  visible(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const props = {
  railHostId: "guide-partner-rail-test",
  trackerRoute: "/posts/weweb-guide",
  context: {
    toolSlug: "weweb",
    tags: ["website-builder", "no-code"],
    text: "Costruire un sito con WeWeb",
  },
};

beforeEach(() => {
  analytics.impression.mockReset();
  analytics.click.mockReset();
  analytics.opportunity.mockReset();
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GuidePartnerExperience responsive XOR", () => {
  it("mounts exactly one accessible, focusable and tracked paid placement while resizing", () => {
    const setWide = installMatchMedia(false);
    const { container } = render(
      <>
        <div id={props.railHostId} />
        <GuidePartnerExperience {...props} />
      </>,
    );

    expect(container.querySelectorAll('aside[data-sponsored="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-sponsor-tracker="impression"]')).toHaveLength(1);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector('[data-format-variant="inline"]')).not.toBeNull();

    act(() => setWide(true));

    const host = container.querySelector(`#${props.railHostId}`);
    expect(host?.querySelector('[data-format-variant="rail"]')).not.toBeNull();
    expect(container.querySelectorAll('aside[data-sponsored="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-sponsor-tracker="impression"]')).toHaveLength(1);
    expect(container.querySelectorAll("a")).toHaveLength(1);

    act(() => setWide(false));

    expect(host?.children).toHaveLength(0);
    expect(container.querySelector('[data-format-variant="inline"]')).not.toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("does not emit a second impression from media-query format changes", () => {
    const setWide = installMatchMedia(false);
    const { container } = render(
      <>
        <div id={props.railHostId} />
        <GuidePartnerExperience {...props} />
      </>,
    );

    const tracker = container.querySelector('[data-sponsor-tracker="impression"]');
    act(() => FakeIntersectionObserver.instances[0]?.visible(tracker as Element));

    expect(analytics.impression).toHaveBeenCalledTimes(1);
    expect(analytics.impression).toHaveBeenCalledWith(
      expect.objectContaining({ formatVariant: "inline" }),
    );

    act(() => setWide(true));
    act(() => setWide(false));

    expect(analytics.impression).toHaveBeenCalledTimes(1);
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
  });

  it("starts a fresh impression session after a genuine page remount", () => {
    installMatchMedia(false);
    const first = render(
      <>
        <div id={props.railHostId} />
        <GuidePartnerExperience {...props} />
      </>,
    );
    act(() => FakeIntersectionObserver.instances[0]?.visible(
      first.container.querySelector('[data-sponsor-tracker="impression"]') as Element,
    ));
    first.unmount();

    const second = render(
      <>
        <div id={props.railHostId} />
        <GuidePartnerExperience {...props} />
      </>,
    );
    act(() => FakeIntersectionObserver.instances[1]?.visible(
      second.container.querySelector('[data-sponsor-tracker="impression"]') as Element,
    ));

    expect(analytics.impression).toHaveBeenCalledTimes(2);
  });
});
