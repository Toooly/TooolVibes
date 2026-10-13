"use client";

import NextLink from "next/link";
import { forwardRef, useCallback, useRef, type ComponentProps } from "react";
import { needsDocumentNavigation } from "@/lib/shell/document-navigation";

export type { LinkProps } from "next/link";

/** Keep Next's click/accessibility contract, but never reuse its router across pages. */
const AppLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function AppLink(props, ref) {
  const anchor = useRef<HTMLAnchorElement | null>(null);
  const setRef = useCallback((node: HTMLAnchorElement | null) => {
    anchor.current = node;
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }, [ref]);

  return <NextLink
    {...props}
    ref={setRef}
    prefetch={false}
    onNavigate={event => {
      let cancelled = false;
      props.onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
      const href = anchor.current?.href;
      if (cancelled || !href || !needsDocumentNavigation(href, window.location.href)) return;
      event.preventDefault();
      if (props.replace) window.location.replace(href);
      else window.location.assign(href);
    }}
  />;
});

export default AppLink;
