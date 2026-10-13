export const DOCUMENT_RECOVERY_PREFIX = "__tvChunkRecovery:";
export const DOCUMENT_RECOVERY_QUERY = "__tv_document_retry";

/** Serialized into the head: it must have no dependencies outside its arguments. */
function installStartupRecovery(release: string, prefix: string, retryQuery: string) {
  let recovering = false;
  window.addEventListener("error", event => {
    if (recovering || document.documentElement.dataset.tvDocumentReady === "true") return;
    const resource = event.target as HTMLScriptElement & HTMLLinkElement | null;
    const source = resource?.tagName === "SCRIPT" ? resource.src :
      resource?.tagName === "LINK" && resource.rel === "stylesheet" ? resource.href : null;
    if (!source) return;
    try {
      const asset = new URL(source, window.location.href);
      if (asset.origin !== window.location.origin || !asset.pathname.startsWith("/_next/static/") || !/\.(js|css)$/.test(asset.pathname)) return;
      const page = new URL(window.location.href);
      const key = `${prefix}${release}:${page.pathname}:attempted`;
      if (page.searchParams.get(retryQuery) === release) return;
      try {
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        // A URL marker bounds recovery even when private-mode storage is blocked.
        page.searchParams.set(retryQuery, release);
        recovering = true;
        window.location.replace(page.href);
        return;
      }
      recovering = true;
      window.location.reload();
    } catch {
      // Unrelated resources and invalid URLs do not cause navigation.
    }
  }, true);
}

export function documentStartupRecoveryScript(release: string): string {
  const args = [release, DOCUMENT_RECOVERY_PREFIX, DOCUMENT_RECOVERY_QUERY]
    .map(value => JSON.stringify(value).replace(/</g, "\\u003c")).join(",");
  return `(${installStartupRecovery.toString()})(${args});`;
}

export function markDocumentReady(): void {
  document.documentElement.dataset.tvDocumentReady = "true";
  const page = new URL(window.location.href);
  if (page.searchParams.has(DOCUMENT_RECOVERY_QUERY)) {
    page.searchParams.delete(DOCUMENT_RECOVERY_QUERY);
    window.history.replaceState(window.history.state, "", page.href);
  }
}
