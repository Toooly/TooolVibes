"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export const CHROME_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";

export type ChromeViewport = "dual" | "desktop" | "mobile";

const ChromeViewportContext = createContext<ChromeViewport>("dual");

export function ChromeViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ChromeViewport>("dual");

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(CHROME_DESKTOP_MEDIA_QUERY);
    const update = () => {
      setViewport(media.matches ? "desktop" : "mobile");
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && !active.isConnected) {
      active.blur();
    }
  }, [viewport]);

  return (
    <ChromeViewportContext.Provider value={viewport}>
      {children}
    </ChromeViewportContext.Provider>
  );
}

export function useChromeViewport(): ChromeViewport {
  return useContext(ChromeViewportContext);
}
