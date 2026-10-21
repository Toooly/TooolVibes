"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "@/components/ui/app-link";
import { LocalizedAttributes, LocalizedText } from "@/components/i18n/localized-text";

type InstrumentStep = {
  id: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  tone: "violet" | "cyan" | "gold";
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Hero-family navigation. Motion never changes the layout or the hit target. */
export function InstrumentJourney({ label, steps, className = "" }: {
  label: string;
  steps: readonly InstrumentStep[];
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav || typeof IntersectionObserver === "undefined") return;
    const stage = nav.closest<HTMLElement>("[data-instrument-stage]");
    let stageVisible = false;
    let navVisible = false;
    const sync = () => {
      nav.dataset.motionActive = String(navVisible && !document.hidden);
      if (stage) stage.dataset.motionActive = String(stageVisible && !document.hidden);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === nav) {
          navVisible = entry.isIntersecting;
          nav.dataset.revealed = String(navVisible);
        } else stageVisible = entry.isIntersecting;
      }
      sync();
    }, { threshold: 0.12 });
    nav.dataset.motionEnhanced = "true";
    observer.observe(nav);
    if (stage) observer.observe(stage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      delete nav.dataset.motionEnhanced;
      if (stage) delete stage.dataset.motionActive;
    };
  }, []);

  return <LocalizedAttributes><nav ref={ref} className={`tv-instrument-journey ${className}`} aria-label={label}>
    <ol>
      {steps.map((step, index) => {
        const content = <span className="tv-instrument-journey__surface">
          <span className="tv-instrument-journey__icon" aria-hidden="true">{step.icon}</span>
          <span className="tv-instrument-journey__number" aria-hidden="true">0{index + 1}</span>
          <span className="tv-instrument-journey__copy"><span><LocalizedText>{step.label}</LocalizedText></span>{step.detail && <small><LocalizedText>{step.detail}</LocalizedText></small>}</span>
          <ArrowUpRight className="tv-instrument-journey__arrow" size={14} aria-hidden="true" />
        </span>;
        return <li key={step.id} data-tone={step.tone}>
          {step.href ? <Link className="tv-instrument-journey__pill" href={step.href}>{content}</Link> :
            <button className="tv-instrument-journey__pill" type="button" onClick={step.onClick}>{content}</button>}
        </li>;
      })}
    </ol>
  </nav></LocalizedAttributes>;
}
