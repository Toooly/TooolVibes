import { SOUND_KINDS, type SoundKind } from "./sound-profiles";

/* ═══════════════════════════════════════════════════════════════
   sound-mapping — mapping puro DOM → SoundKind (B26).
   Selettori interattivi/hover, classificazione per elemento e
   per animazione, pulse visivo is-sonic-tap. Estratto invariato
   dal monolite interaction-sound-layer-v2.
   ═══════════════════════════════════════════════════════════════ */

export const INTERACTIVE_SELECTOR =
  "a, button, summary, [role='button'], [role='tab'], [cmdk-item], [data-sonic-action]";
export const HOVER_SELECTOR =
  "a[href], button:not(:disabled), summary, [role='button']:not([aria-disabled='true']), [role='tab']:not([aria-disabled='true']), [cmdk-item]:not([aria-disabled='true'])";
export function isSoundKind(value: string | null | undefined): value is SoundKind {
  return SOUND_KINDS.includes(value as SoundKind);
}

export function getSoundKind(element: HTMLElement): SoundKind {
  const explicitKind =
    element.closest<HTMLElement>("[data-sonic-action]")?.dataset.sonicAction;
  if (isSoundKind(explicitKind)) {
    return explicitKind;
  }
  const actionText = `${
    element.getAttribute("aria-label") ?? ""
  } ${element.textContent ?? ""}`.toLowerCase();
  if (element.getAttribute("role") === "tab") {
    return "tab";
  }
  if (element.matches("summary, [data-slot='accordion-trigger']")) {
    return "expand";
  }
  if (actionText.includes("scorri")) {
    return "carousel";
  }
  if (element.closest(".group\\/brand, .brand-mark")) {
    return "brand";
  }
  if (
    element.classList.contains("mobile-menu-button") ||
    element.getAttribute("aria-label")?.toLowerCase().includes("menu")
  ) {
    return "menu";
  }
  if (actionText.includes("chiudi") || actionText.includes("close")) {
    return "close";
  }
  if (actionText.includes("cerca") || actionText.includes("search")) {
    return "search";
  }
  if (
    actionText.includes("filtra") ||
    actionText.includes("filtro") ||
    actionText.includes("categoria")
  ) {
    return "filterApply";
  }
  if (
    actionText.includes("salva") ||
    actionText.includes("shortlist") ||
    actionText.includes("salvato")
  ) {
    return "save";
  }
  if (actionText.includes("confronta") || actionText.includes("compare")) {
    return "compare";
  }
  if (
    actionText.includes("dettagli") ||
    actionText.includes("scheda") ||
    actionText.includes("dettaglio")
  ) {
    return "detail";
  }
  if (actionText.includes("stack")) {
    return "stack";
  }
  if (
    actionText.includes("segnali") ||
    actionText.includes("mostra") ||
    actionText.includes("altre")
  ) {
    return "expand";
  }
  if (
    actionText.includes("apri") ||
    actionText.includes("esplora") ||
    actionText.includes("entra")
  ) {
    return "open";
  }
  if (element instanceof HTMLAnchorElement) {
    return "nav";
  }
  return "tap";
}

export function addPulse(element: HTMLElement) {
  const targets = [element];
  const brandMark =
    element.querySelector<HTMLElement>(".brand-mark") ??
    element.closest<HTMLElement>(".brand-mark");
  if (brandMark && !targets.includes(brandMark)) {
    targets.push(brandMark);
  }
  window.requestAnimationFrame(() => {
    targets.forEach((target) => {
      if (!target.isConnected) {
        return;
      }
      target.classList.remove("is-sonic-tap");
      void target.offsetWidth;
      target.classList.add("is-sonic-tap");
      window.setTimeout(() => target.classList.remove("is-sonic-tap"), 560);
    });
  });
}

export function getAnimationSoundKind(
  animationName: string,
  target: Element
): SoundKind | null {
  if (
    animationName.includes("drawer-gravity") ||
    target.matches("[data-slot='drawer-content']")
  ) {
    return "drawerOpen";
  }
  if (
    animationName.includes("toast") ||
    target.matches(".cn-toast, .motion-toast")
  ) {
    return "toast";
  }
  if (
    animationName.includes("details-open") ||
    animationName.includes("mobile-expander-open")
  ) {
    return "expand";
  }
  if (
    animationName.includes("fade-up") ||
    animationName.includes("soft-pop") ||
    animationName.includes("section-stage") ||
    animationName.includes("route-stage")
  ) {
    return "reveal";
  }
  if (
    animationName.includes("card-gravity") ||
    animationName.includes("chip-pop") ||
    animationName.includes("badge-pop")
  ) {
    return "update";
  }
  return null;
}
