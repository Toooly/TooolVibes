import { Children, isValidElement } from "react";
import type { Components } from "react-markdown";

/** Preserve native task names and keyboard access to wide editorial tables. */
export const accessibleMarkdownElements: Components = {
  li: ({ node, children, ...props }) => {
    const classes = node?.properties.className;
    const isTask = Array.isArray(classes) && classes.includes("task-list-item");
    if (!isTask) return <li {...props}>{children}</li>;
    const parts = Children.toArray(children);
    const nested = parts.findIndex((child) => isValidElement(child) && (child.type === "ul" || child.type === "ol"));
    const boundary = nested < 0 ? parts.length : nested;
    return <li {...props}><label>{parts.slice(0, boundary)}</label>{parts.slice(boundary)}</li>;
  },
  table: ({ node, children, ...props }) => (
    <table {...props} tabIndex={node?.tagName === "table" ? 0 : props.tabIndex}>{children}</table>
  ),
};
