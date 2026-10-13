/** Page changes get a fresh document. In-page controls keep their router state. */
export function needsDocumentNavigation(href: string, currentHref: string): boolean {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    return target.origin === current.origin && target.pathname !== current.pathname;
  } catch {
    return false;
  }
}

export function navigateSite(
  href: string,
  router: { push: (href: string) => void; replace: (href: string) => void },
  replace = false,
): void {
  if (needsDocumentNavigation(href, window.location.href)) {
    const target = new URL(href, window.location.href).href;
    if (replace) window.location.replace(target);
    else window.location.assign(target);
  } else if (replace) router.replace(href);
  else router.push(href);
}
