import type { ToolRecord } from "@/lib/types/tool";

import { ToolCard, type ToolCardVariant } from "@/components/tools/tool-card";

type ToolGridProps = {
  tools: ToolRecord[];
  contextLabel?: string;
  variant?: Exclude<ToolCardVariant, "featured" | "scan">;
  mobileSwipe?: boolean;
};

export function ToolGrid({
  tools,
  contextLabel,
  variant = "compact",
  mobileSwipe = false,
}: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div
        className="light-surface rounded-[var(--radius-lg)] border px-6 py-10 text-center"
        style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(243,237,255,0.7))" }}
      >
        <h3 className="text-2xl">Nessun tool disponibile.</h3>
        <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
          Quando il catalogo è vuoto, questo spazio resta pronto ad accogliere i tool pubblicati.
        </p>
      </div>
    );
  }

  return (
    <>
      {mobileSwipe ? (
        <div className="tool-rail -mx-1.5 flex snap-x gap-3 overflow-x-auto px-1.5 pb-2 md:hidden">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              variant={variant}
              index={index}
              contextLabel={contextLabel}
              swipeFriendly
            />
          ))}
        </div>
      ) : null}

      <div className={`grid gap-5 ${variant === "compact" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}>
        {tools.map((tool, index) => (
          <div key={tool.id} className={mobileSwipe ? "hidden md:block" : ""}>
            <ToolCard tool={tool} variant={variant} index={index} contextLabel={contextLabel} />
          </div>
        ))}
      </div>
    </>
  );
}
