"use client";

import { LocalizedAttributes } from "@/components/i18n/localized-text";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CommandControlProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  tone?: "neutral" | "sound" | "music";
  label: string;
  tooltip?: string;
}

export const CommandControl = React.forwardRef<
  HTMLButtonElement,
  CommandControlProps
>(
  (
    {
      pressed,
      tone = "neutral",
      label,
      tooltip,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <LocalizedAttributes><button
        ref={ref}
        type="button"
        className={cn(
          "command-control",
          tone === "sound" && "command-control--sound",
          tone === "music" && "command-control--music",
          pressed && "is-active",
          className,
        )}
        aria-label={label}
        aria-pressed={pressed}
        data-command-control=""
        title={tooltip || label}
        {...props}
      >
        <span className="command-control__icon">{children}</span>
        <span className="command-control__state" aria-hidden="true" />
      </button></LocalizedAttributes>
    );
  },
);

CommandControl.displayName = "CommandControl";
