"use client";

import { createContext, useContext } from "react";

export type PublicToolCatalogItem = {
  slug: string;
  name: string;
  categoryLabel: string;
  shortDescription: string;
  featured: boolean;
  toolOfWeek: boolean;
  tags: string[];
  levelLabel: string | null;
};

const PublicToolCatalogContext = createContext<readonly PublicToolCatalogItem[]>([]);

export function PublicToolCatalogProvider({
  children,
  tools,
}: {
  children: React.ReactNode;
  tools: PublicToolCatalogItem[];
}) {
  return (
    <PublicToolCatalogContext.Provider value={tools}>
      {children}
    </PublicToolCatalogContext.Provider>
  );
}

export function usePublicToolCatalog() {
  return useContext(PublicToolCatalogContext);
}
