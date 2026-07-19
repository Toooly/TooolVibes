// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  KEYBOARD_SCROLL_DELAY_MS,
  useKeyboardAwareScroll,
} from "@/lib/hooks/use-keyboard-aware-scroll";

/**
 * B39 (MOB-703) — contract jsdom della scroll-to-input policy.
 *
 * Il campo viene riportato nel viewport SOLO se coperto (tastiera aperta):
 * nessuno scroll quando il campo è già interamente visibile (desktop /
 * tastiera chiusa). jsdom non ha visualViewport: il fallback è
 * window.innerHeight (768 di default), sufficiente per simulare un campo
 * coperto via getBoundingClientRect mockato.
 */

function Probe() {
  const containerRef = useKeyboardAwareScroll<HTMLDivElement>();
  return (
    <div ref={containerRef}>
      <button type="button">Chiudi</button>
      <input aria-label="Campo di test" />
      <textarea aria-label="Area di test" />
    </div>
  );
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
  return vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

/** Rettangolo coperto dalla tastiera: sotto il viewport visibile (768). */
const COVERED_RECT = { top: 900, bottom: 940, height: 40 };
/** Rettangolo interamente visibile. */
const VISIBLE_RECT = { top: 120, bottom: 160, height: 40 };

describe("useKeyboardAwareScroll (B39 / MOB-703)", () => {
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    // @ts-expect-error cleanup mock globale
    delete window.matchMedia;
  });

  it("porta nel viewport un input coperto dalla tastiera dopo il delay di apertura", () => {
    vi.useFakeTimers();
    render(<Probe />);
    const input = screen.getByLabelText("Campo di test");
    mockRect(input, COVERED_RECT);

    fireEvent.focusIn(input);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });

  it("non scrolla se il campo è già interamente visibile (tastiera chiusa)", () => {
    vi.useFakeTimers();
    render(<Probe />);
    const input = screen.getByLabelText("Campo di test");
    mockRect(input, VISIBLE_RECT);

    fireEvent.focusIn(input);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it("applica behavior auto con prefers-reduced-motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.useFakeTimers();
    render(<Probe />);
    const input = screen.getByLabelText("Campo di test");
    mockRect(input, COVERED_RECT);

    fireEvent.focusIn(input);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "auto",
    });
  });

  it("reagisce anche alle textarea (campi di input estesi)", () => {
    vi.useFakeTimers();
    render(<Probe />);
    const textarea = screen.getByLabelText("Area di test");
    mockRect(textarea, COVERED_RECT);

    fireEvent.focusIn(textarea);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("ignora il focus su elementi non campo (es. bottoni)", () => {
    vi.useFakeTimers();
    render(<Probe />);
    const button = screen.getByRole("button", { name: "Chiudi" });
    mockRect(button, COVERED_RECT);

    fireEvent.focusIn(button);
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it("cleanup: listener e timeout pendenti rimossi allo smontaggio", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Probe />);
    const input = screen.getByLabelText("Campo di test");
    mockRect(input, COVERED_RECT);

    fireEvent.focusIn(input);
    unmount();
    vi.advanceTimersByTime(KEYBOARD_SCROLL_DELAY_MS + 1);

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
