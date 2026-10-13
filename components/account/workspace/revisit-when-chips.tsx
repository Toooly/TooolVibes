"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import {
  REVISIT_PRESETS,
  type RevisitPresetId,
  revisitAtFromPreset,
} from "@/lib/account/workspace-lifecycle";

const chipClassName =
  "selection-chip text-ui-strong inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]";

export function RevisitWhenChips({
  onSelect,
  labelledBy,
  tone = "dark",
}: {
  onSelect: (revisitAt: string, preset: RevisitPresetId) => void;
  labelledBy?: string;
  tone?: "dark" | "light";
}) {
  const style =
    tone === "light"
      ? {
          borderColor: "rgba(28, 22, 48, 0.16)",
          background: "rgba(28, 22, 48, 0.06)",
          color: "#1c1630",
        }
      : {
          borderColor: "var(--line)",
          background: "rgba(255,255,255,0.06)",
          color: "var(--tv-ink-primary, #f4f1ff)",
        };

  return (
    <LocalizedAttributes><div
      className="mt-2 flex flex-wrap gap-2"
      role="group"
      aria-label={labelledBy ? undefined : "Quando rivedere"}
      aria-labelledby={labelledBy}
    >
      {REVISIT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={chipClassName}
          style={style}
          onClick={() => onSelect(revisitAtFromPreset(preset.id), preset.id)}
        >
          <LocalizedText>{preset.label}</LocalizedText>
        </button>
      ))}
    </div></LocalizedAttributes>
  );
}
