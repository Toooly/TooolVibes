type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  invert?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  invert = false,
}: SectionHeadingProps) {
  return (
    <div className="max-w-[58rem]">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2 w-2 rounded-full shadow-[0_0_0_4px_rgba(242,179,71,0.12)]"
          style={invert ? { background: "var(--gold)" } : { background: "var(--gold)" }}
        />
        <p
          className="pill pill-premium"
          style={
            invert
              ? {
                  color: "rgba(255,255,255,0.82)",
                  borderColor: "rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          {eyebrow}
        </p>
        <div className="title-accent hidden h-px flex-1 sm:block" />
      </div>
      <h2 className="mt-2.5 section-title max-w-none sm:max-w-[20ch] sm:text-balance lg:max-w-[22ch]" style={invert ? { color: "#f7f3ff" } : undefined}>
        {title}
      </h2>
      <p className="mt-2.5 section-copy" style={invert ? { color: "rgba(239,233,255,0.74)" } : undefined}>
        {description}
      </p>
    </div>
  );
}
