/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from "vitest";
import { readingLine, scrollToSection } from "@/lib/shell/scroll-port";
const rect = (top: number, height: number) => ({ top, bottom: top + height, height } as DOMRect);
afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); });

it("uses the visible desktop header when the mobile header is hidden", () => {
  document.body.innerHTML = '<header class="mobile-top-bar"></header><header class="command-bar"></header><nav class="td-final-decision-nav" style="position:sticky"></nav>';
  vi.spyOn(document.querySelector('.mobile-top-bar')!, 'getBoundingClientRect').mockReturnValue(rect(0, 0));
  vi.spyOn(document.querySelector('.command-bar')!, 'getBoundingClientRect').mockReturnValue(rect(0, 84));
  vi.spyOn(document.querySelector('nav')!, 'getBoundingClientRect').mockReturnValue(rect(84, 56));
  expect(readingLine()).toBe(148);
});

it("scrolls the mobile shell instead of the window, with header clearance", () => {
  document.body.innerHTML = '<header class="mobile-top-bar"></header><div class="marketing-shell" style="overflow-y:auto"><section id="target"></section></div>';
  const shell = document.querySelector('.marketing-shell') as HTMLElement;
  const target = document.querySelector('section')!;
  vi.spyOn(document.querySelector('header')!, 'getBoundingClientRect').mockReturnValue(rect(0, 80));
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(400, 100));
  shell.scrollTop = 200;
  shell.scrollTo = vi.fn();
  scrollToSection(target, 'auto');
  expect(shell.scrollTo).toHaveBeenCalledWith({ top: 512, behavior: 'auto' });
});
