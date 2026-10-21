/** Decorative, source-free material artwork shared by the Radar and podium. */
export function InstrumentOrbit({ className = "" }: { className?: string }) {
  return <div className={`tv-instrument-orbit ${className}`} aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element -- precompressed static alpha WebP, no image transformation endpoint */}
    <img src="/graphics/instrument-orbit.webp" width={1024} height={1024} alt="" loading="lazy" decoding="async" />
  </div>;
}
