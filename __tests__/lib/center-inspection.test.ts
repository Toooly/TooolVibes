// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { centerInspection } from "@/lib/motion/center-inspection";

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

it.each([
  { height: 200, expected: 198 },
  { height: 800, expected: 356 },
])("centers a $height px card within the sticky chrome without hiding a tall heading", ({ height, expected }) => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  const shell = document.createElement("div");
  shell.className = "marketing-shell";
  shell.style.scrollPaddingTop = "64px";
  shell.style.scrollPaddingBottom = "120px";
  shell.scrollTop = 100;
  shell.getBoundingClientRect = () => new DOMRect(0, 0, 390, 700);
  shell.scrollTo = vi.fn();
  const card = document.createElement("a");
  card.getBoundingClientRect = () => new DOMRect(0, 320, 240, height);
  shell.append(card);
  document.body.append(shell);
  centerInspection(card);
  expect(shell.scrollTo).toHaveBeenCalledWith({ top: expected, left: 0, behavior: "smooth" });
});
