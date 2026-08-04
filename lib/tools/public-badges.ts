export type PromoChipKind = "level" | "tool-of-week" | "featured";

export type PromoChip = {
  label: string;
  kind: PromoChipKind;
};

type PromoChipSource = {
  levelLabel?: string | null;
  toolOfWeek?: boolean;
  featured?: boolean;
};

export function buildPromoChips(tool: PromoChipSource): PromoChip[] {
  const chips: PromoChip[] = [];
  if (tool.levelLabel) chips.push({ label: tool.levelLabel, kind: "level" });
  if (tool.toolOfWeek) chips.push({ label: "In evidenza", kind: "tool-of-week" });
  else if (tool.featured) chips.push({ label: "In evidenza", kind: "featured" });
  const seen = new Set<string>();
  return chips.filter((chip) => {
    if (seen.has(chip.label)) return false;
    seen.add(chip.label);
    return true;
  });
}
