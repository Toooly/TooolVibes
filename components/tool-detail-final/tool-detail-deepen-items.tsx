"use client";

import { scrollToSection, readingLine } from "@/lib/shell/scroll-port";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

import { LocalizedText } from "@/components/i18n/localized-text";
import { FileText, Settings, Target, Scale, User, HelpCircle } from "lucide-react";

type Panel = {
  id: string;
  title: string;
  content: React.ReactNode;
  [key: string]: unknown;
};

export function ToolDetailDeepenItems({ panels }: { panels: Panel[] }) {
  const reducedMotion = useReducedMotion();
  return (
    <>
      {panels.map((panel) => (
        <details
          key={panel.id}
          id={`td-final-panel-${panel.id}`}
          className="td-final-deepen__item"
          name="td-final-approfondisci"
          onToggle={(e) => {
            const el = e.target as HTMLDetailsElement;
            if (!el.open) return;
            if (el.getBoundingClientRect().top < readingLine()) {
              scrollToSection(el, reducedMotion ? "auto" : "smooth");
            }
          }}
        >
          <summary className="td-final-deepen__summary">
            <span className="td-final-deepen__icon" aria-hidden="true">
              {panel.id === "overview" ? <FileText size={16} /> :
               panel.id === "features" ? <Settings size={16} /> :
               panel.id === "use-cases" ? <Target size={16} /> :
               panel.id === "pros-limits" ? <Scale size={16} /> :
               panel.id === "experience" ? <User size={16} /> :
               <HelpCircle size={16} />}
            </span>
            <span><LocalizedText>{panel.title}</LocalizedText></span>
            <span className="td-final-deepen__chevron" aria-hidden="true" />
          </summary>
          <div className="td-final-deepen__panel"><LocalizedText>{panel.content}</LocalizedText></div>
        </details>
      ))}
    </>
  );
}
