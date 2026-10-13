export type ToolDetailSection = {
  id: string;
  label: string;
  enabled: boolean;
  navVisible: boolean;
  analyticsKey: string;
};

type ToolDetailSectionInput = {
  hasExtendedContent: boolean;
  hasRelatedTools: boolean;
  hasRelatedGuides: boolean;
  hasRelatedStacks: boolean;
  hasTechnicalData: boolean;
  hasPricing: boolean;
};

export function buildToolDetailSections(input: ToolDetailSectionInput): ToolDetailSection[] {
  const sections: ToolDetailSection[] = [
    {
      id: "td-final-overview",
      label: "Panoramica",
      enabled: true,
      navVisible: true,
      analyticsKey: "overview",
    },
  ];

  if (input.hasExtendedContent) {
    sections.push({
      id: "td-final-approfondisci",
      label: "Dettagli",
      enabled: true,
      navVisible: true,
      analyticsKey: "deepen",
    });
  }

  if (input.hasPricing) {
    sections.push({
      id: "td-final-pricing",
      label: "Prezzi",
      enabled: true,
      navVisible: true,
      analyticsKey: "pricing",
    });
  }

  if (input.hasRelatedTools) {
    sections.push({
      id: "td-final-alternatives",
      label: "Alternative",
      enabled: true,
      navVisible: true,
      analyticsKey: "alternatives",
    });
  }

  if (input.hasRelatedGuides) {
    sections.push({
      id: "td-final-related-guides",
      label: "Guide correlate",
      enabled: true,
      navVisible: false,
      analyticsKey: "related_guides",
    });
  }

  if (input.hasRelatedStacks) {
    sections.push({
      id: "td-final-related-stacks",
      label: "In questi Stack",
      enabled: true,
      navVisible: false,
      analyticsKey: "related_stacks",
    });
  }

  if (input.hasTechnicalData) {
    sections.push({
      id: "td-final-information",
      label: "Dati tecnici",
      enabled: true,
      navVisible: false,
      analyticsKey: "technical_data",
    });
  }

  return sections;
}

export function getNavSections(sections: ToolDetailSection[]): ToolDetailSection[] {
  return sections.filter((s) => s.enabled && s.navVisible);
}
