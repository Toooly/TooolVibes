export interface OrbitalItem {
  id: string;
  title: string;
  initials: string;
  description: string;
  category: string;
  href: string;
  sectionId: string;
  priority: number;
  color?: string;
}

export interface OrbitalSection {
  id: string;
  label: string;
  items: OrbitalItem[];
}

export interface OrbitConfig {
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  tilt: number;
}

export interface OrbitalContextValue {
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  registerSection: (section: OrbitalSection) => void;
  unregisterSection: (id: string) => void;
  getItemsForSection: (id: string) => OrbitalItem[];
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}
