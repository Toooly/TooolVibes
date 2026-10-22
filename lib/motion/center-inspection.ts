/** Center a reading surface inside the space left by the site's sticky chrome.
 * Tall surfaces align at the top instead of hiding their heading. */
export function centerInspection(element: HTMLElement) {
  const shell = element.closest<HTMLElement>(".marketing-shell");
  const bounds = shell?.getBoundingClientRect();
  const style = getComputedStyle(shell ?? document.documentElement);
  const top = (bounds?.top ?? 0) + (parseFloat(style.scrollPaddingTop) || 0);
  const bottom = (bounds?.bottom ?? window.innerHeight) - (parseFloat(style.scrollPaddingBottom) || 0);
  const rect = element.getBoundingClientRect();
  const delta = rect.top - top - Math.max(0, (bottom - top - rect.height) / 2);
  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  if (Math.abs(delta) < 1) return;
  if (shell) shell.scrollTo({ top: shell.scrollTop + delta, left: 0, behavior });
  else window.scrollTo({ top: window.scrollY + delta, left: 0, behavior });
}
