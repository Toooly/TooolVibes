"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { useLocale } from "./locale-provider";

/** Only presentation strings are translated; component props and stored values stay intact. */
function localizeNode(node: ReactNode, t: (source: string) => string): ReactNode {
  if (typeof node === "string") return t(node);
  if (Array.isArray(node)) return Children.map(node, (child) => localizeNode(child, t));
  if (isValidElement<{ children?: ReactNode }>(node) && typeof node.type === "string" && !["code", "pre", "script", "style", "textarea"].includes(node.type)) {
    return cloneElement(node, {}, localizeNode(node.props.children, t));
  }
  return node;
}

export function LocalizedText({ children, separator }: { children: ReactNode; separator?: string }) {
  const { t } = useLocale();
  if (separator !== undefined && Array.isArray(children) && children.every((child) => typeof child === "string")) return <>{children.map(t).join(separator)}</>;
  return <>{localizeNode(children, t)}</>;
}

export function LocalizedAttributes({ children, ...forwarded }: { children: ReactNode } & Record<string, unknown>) {
  const { t } = useLocale();
  // Server-rendered children can still be a promise or a collection here.
  // Let React resolve those instead of reading props on an opaque node.
  if (!isValidElement<Record<string, unknown>>(children)) return <>{children}</>;
  const element = children;
  const props: Record<string, unknown> = { ...forwarded };
  if (typeof forwarded.className === "string") props.className = [element.props.className, forwarded.className].filter(Boolean).join(" ");
  if (forwarded.style && typeof forwarded.style === "object") props.style = { ...forwarded.style, ...(typeof element.props.style === "object" ? element.props.style : {}) };
  for (const [key, parentHandler] of Object.entries(forwarded)) {
    const childHandler = element.props[key];
    if (/^on[A-Z]/.test(key) && typeof parentHandler === "function" && typeof childHandler === "function") {
      props[key] = (...args: unknown[]) => {
        childHandler(...args);
        const event = args[0] as { defaultPrevented?: boolean } | undefined;
        if (!event?.defaultPrevented) parentHandler(...args);
      };
    }
  }
  if (forwarded.ref && element.props.ref && forwarded.ref !== element.props.ref) {
    props.ref = (node: unknown) => {
      for (const ref of [element.props.ref, forwarded.ref]) {
        if (typeof ref === "function") ref(node);
        else if (ref && typeof ref === "object" && "current" in ref) ref.current = node;
      }
    };
  }
  for (const key of ["title", "aria-label", "placeholder", "alt", "aria-valuetext"]) {
    const value = props[key] ?? element.props[key];
    if (typeof value === "string") props[key] = t(value);
  }
  return cloneElement(element, props);
}
