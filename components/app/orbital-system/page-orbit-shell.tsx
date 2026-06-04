"use client";

import { SectionOrbitProvider } from "./section-orbit-provider";
import type { OrbitalItem } from "./types";
import type { ReactNode } from "react";

interface PageOrbitShellProps {
  sectionId: string;
  label: string;
  items: OrbitalItem[];
  children: ReactNode;
}

export function PageOrbitShell({ sectionId, label, items, children }: PageOrbitShellProps) {
  return (
    <SectionOrbitProvider sectionId={sectionId} label={label} items={items}>
      {children}
    </SectionOrbitProvider>
  );
}
