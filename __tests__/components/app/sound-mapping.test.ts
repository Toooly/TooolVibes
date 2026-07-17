// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import {
  getAnimationSoundKind,
  getSoundKind,
  isSoundKind,
} from "@/components/app/sound/sound-mapping";

/* Pure DOM → SoundKind mapping contract (B26 extraction parity). */

function inWrapper<T extends HTMLElement>(element: T): T {
  const wrapper = document.createElement("div");
  wrapper.appendChild(element);
  document.body.appendChild(wrapper);
  return element;
}

describe("sound-mapping isSoundKind", () => {
  it("accepts known kinds and rejects unknown values", () => {
    expect(isSoundKind("tap")).toBe(true);
    expect(isSoundKind("battleWin")).toBe(true);
    expect(isSoundKind("not-a-kind")).toBe(false);
    expect(isSoundKind(null)).toBe(false);
    expect(isSoundKind(undefined)).toBe(false);
  });
});

describe("sound-mapping getSoundKind", () => {
  it("honours the explicit data-sonic-action on the element or an ancestor", () => {
    const button = inWrapper(document.createElement("button"));
    button.dataset.sonicAction = "compare";
    expect(getSoundKind(button)).toBe("compare");

    const parent = document.createElement("div");
    parent.dataset.sonicAction = "save";
    const child = document.createElement("button");
    parent.appendChild(child);
    document.body.appendChild(parent);
    expect(getSoundKind(child)).toBe("save");
  });

  it("maps tabs, summaries and carousel controls by role/class", () => {
    const tab = inWrapper(document.createElement("button"));
    tab.setAttribute("role", "tab");
    expect(getSoundKind(tab)).toBe("tab");

    const summary = inWrapper(document.createElement("summary"));
    expect(getSoundKind(summary)).toBe("expand");

    const carousel = inWrapper(document.createElement("button"));
    carousel.classList.add("category-tool-carousel__dot");
    expect(getSoundKind(carousel)).toBe("carousel");
  });

  it("classifies by accessible text for common actions", () => {
    const close = inWrapper(document.createElement("button"));
    close.textContent = "Chiudi";
    expect(getSoundKind(close)).toBe("close");

    const save = inWrapper(document.createElement("button"));
    save.textContent = "Salva";
    expect(getSoundKind(save)).toBe("save");

    const compare = inWrapper(document.createElement("button"));
    compare.textContent = "Confronta";
    expect(getSoundKind(compare)).toBe("compare");

    const menu = inWrapper(document.createElement("button"));
    menu.setAttribute("aria-label", "Apri menu");
    expect(getSoundKind(menu)).toBe("menu");
  });

  it("falls back to nav for anchors and tap for generic elements", () => {
    const anchor = inWrapper(document.createElement("a"));
    anchor.href = "https://tooolvibes.example/tools";
    expect(getSoundKind(anchor)).toBe("nav");

    const generic = inWrapper(document.createElement("button"));
    expect(getSoundKind(generic)).toBe("tap");
  });
});

describe("sound-mapping getAnimationSoundKind", () => {
  it("maps known animation names and targets", () => {
    const element = document.createElement("div");
    expect(getAnimationSoundKind("drawer-gravity-in", element)).toBe(
      "drawerOpen"
    );
    expect(getAnimationSoundKind("toast-slide-in", element)).toBe("toast");
    expect(getAnimationSoundKind("fade-up", element)).toBe("reveal");
    expect(getAnimationSoundKind("details-open", element)).toBe("expand");
    expect(getAnimationSoundKind("chip-pop", element)).toBe("update");
    expect(getAnimationSoundKind("unknown-anim", element)).toBeNull();
  });

  it("maps drawer content and toast targets regardless of name", () => {
    const drawer = document.createElement("div");
    drawer.setAttribute("data-slot", "drawer-content");
    expect(getAnimationSoundKind("anything", drawer)).toBe("drawerOpen");

    const toast = document.createElement("div");
    toast.classList.add("motion-toast");
    expect(getAnimationSoundKind("anything", toast)).toBe("toast");
  });
});
