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
