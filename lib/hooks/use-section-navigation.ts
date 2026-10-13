"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "./use-reduced-motion";
import { readingLine, scrollToSection } from "@/lib/shell/scroll-port";

type Section = { id: string; label: string };

/** One scroll/hash contract for tool, stack and editorial section menus. */
export function useSectionNavigation(sections: Section[]) {
  const [items, setItems] = useState(sections);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const pinned = useRef<string | null>(null);
  const release = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    let available = sections;
    const measure = () => {
      frame = 0;
      if (pinned.current) return;
      let current = available[0]?.id ?? "";
      const line = readingLine();
      for (const item of available) {
        const target = document.getElementById(item.id);
        if (target && target.getBoundingClientRect().top <= line + 2) current = item.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const collect = () => {
      const previousIds = new Set(available.map((item) => item.id));
      const seen = new Set<string>();
      available = sections.flatMap((section) => {
        const target = document.getElementById(section.id);
        if (!target) return [];
        const gate = target.closest("[inert], [aria-hidden='true']")?.closest(".tv-member-gate");
        const item = gate ? { id: "tv-member-gate-title", label: "Continua nel tuo spazio" } : section;
        if (seen.has(item.id) || (!gate && target.closest("[inert], [aria-hidden='true']"))) return [];
        seen.add(item.id);
        return [item];
      });
      setItems((previous) => JSON.stringify(previous) === JSON.stringify(available) ? previous : available);
      if (available.some((item) => !previousIds.has(item.id) && `#${item.id}` === window.location.hash)) followHash();
      schedule();
    };
    const followHash = () => {
      const requested = sections.find((section) => `#${section.id}` === window.location.hash);
      const locked = requested && document.getElementById(requested.id)?.closest("[inert], [aria-hidden='true']");
      const item = available.find((section) => `#${section.id}` === window.location.hash || (locked && section.id === "tv-member-gate-title"));
      const target = item && document.getElementById(item.id);
      if (!target) return;
      openParents(target);
      setActive(item.id);
      pinned.current = item.id;
      if (release.current) clearTimeout(release.current);
      scrollToSection(target);
      release.current = setTimeout(() => { pinned.current = null; schedule(); }, 900);
    };
    const cancelPin = () => {
      pinned.current = null;
      if (release.current) clearTimeout(release.current);
      schedule();
    };
    collect();
    followHash();
    const observer = new MutationObserver(collect);
    const root = document.querySelector("main");
    if (root) observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["id", "inert", "aria-hidden"] });
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    document.addEventListener("wheel", cancelPin, { passive: true });
    document.addEventListener("touchstart", cancelPin, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (release.current) clearTimeout(release.current);
      document.removeEventListener("scroll", schedule, true);
      document.removeEventListener("wheel", cancelPin);
      document.removeEventListener("touchstart", cancelPin);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", followHash);
    };
  }, [sections]);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    openParents(target);
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    pinned.current = id;
    setActive(id);
    if (release.current) clearTimeout(release.current);
    scrollToSection(target, reducedMotion ? "auto" : "smooth");
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
    release.current = setTimeout(() => { pinned.current = null; document.dispatchEvent(new Event("scroll")); }, 900);
  };

  return { items, active, navigate };
}

function openParents(target: HTMLElement) {
  let element: HTMLElement | null = target;
  while (element) {
    if (element instanceof HTMLDetailsElement) element.open = true;
    element = element.parentElement;
  }
}
