import { getToolBadgeLabel, type DirectoryTool } from "@/lib/data/tooolvibes-directory";

type DirectoryToolGlyphProps = {
  tool: DirectoryTool;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 rounded-[11px] text-[0.78rem]",
  md: "h-11 w-11 rounded-[13px] text-[0.84rem]",
  lg: "h-14 w-14 rounded-[18px] text-[0.96rem]",
} satisfies Record<NonNullable<DirectoryToolGlyphProps["size"]>, string>;

function getToolLogoUrl(tool: DirectoryTool) {
  const domain = tool.domain || tool.externalUrl;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function DirectoryToolGlyph({
  tool,
  size = "md",
  className = "",
}: DirectoryToolGlyphProps) {
  return (
    <span
      aria-hidden="true"
      className={`tool-glyph-motion inline-flex items-center justify-center border border-[rgba(76,55,166,0.2)] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] shadow-[0_12px_28px_rgba(60,37,152,0.14)] ${sizeClasses[size]} ${className}`.trim()}
      style={{
        background: `linear-gradient(135deg, ${tool.accentFrom}, ${tool.accentTo})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getToolLogoUrl(tool)}
        alt=""
        loading="lazy"
        decoding="async"
        className="tool-glyph-logo"
      />
      <span className="tool-glyph-initials">{getToolBadgeLabel(tool.name)}</span>
    </span>
  );
}
