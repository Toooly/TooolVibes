"use client";

import { create } from "zustand";

type MobileUIState = {
  isOverlayOpen: boolean;
  setOverlayOpen: (v: boolean) => void;
};

export const useMobileUIStore = create<MobileUIState>((set) => ({
  isOverlayOpen: false,
  setOverlayOpen: (v) => set({ isOverlayOpen: v }),
}));
