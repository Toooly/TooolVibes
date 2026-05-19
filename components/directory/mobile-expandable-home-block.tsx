"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

type MobileExpandableHomeBlockProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function MobileExpandableHomeBlock({
  eyebrow,
  title,
  description,
  children,
}: MobileExpandableHomeBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="page-shell sm:hidden">
      <div className={`mobile-home-expander ${open ? "is-open" : ""}`}>
        <button
          type="button"
          className="mobile-home-expander__trigger"
          aria-expanded={open}
          data-sonic-action={open ? "collapse" : "expand"}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="mobile-home-expander__icon" aria-hidden="true">
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="mobile-home-expander__eyebrow">{eyebrow}</span>
            <span className="mobile-home-expander__title">{title}</span>
            <span className="mobile-home-expander__description">{description}</span>
          </span>
          <ChevronDown className="mobile-home-expander__chevron size-4" aria-hidden="true" />
        </button>

        {open ? <div className="mobile-home-expander__content">{children}</div> : null}
      </div>
    </section>
  );
}
