"use client";

import { createContext, useContext } from "react";

import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

export type { PublicToolCatalogItem };

const PublicToolCatalogContext = createContext<readonly PublicToolCatalogItem[]>([]);

export function PublicToolCatalogProvider({
  children,
  tools,
}: {
  children: React.ReactNode;
  tools: readonly PublicToolCatalogItem[];
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
