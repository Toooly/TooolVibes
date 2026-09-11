import type { ToolPublicView } from "@/lib/data/tool-public-view";

/**
 * Hero Decision Scope — proprietary product-system visualization.
 * Built from the Tooolvibes logo geometry:
 *   1. LOOP   — interlaced candidate orbits (the TOOOL "oo")
 *   2. WAVE    — gold→cyan signal trace
 *   3. TILE    — rounded identity squares
 * Product instrument: candidates, signal, compare axis, memory.
 * Lifecycle copy lives in the Decision System, not here.
 * Decorative: aria-hidden, no interactive elements.
 */
export function HeroDecisionScope({
  tools,
}: {
  tools: ToolPublicView[];
}) {
  const candidates = tools.slice(0, 3);
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <svg
      className="def-scope"
      viewBox="0 0 480 460"
      role="img"
      aria-label="Il sistema Tooolvibes: scopri i candidati, valuta i segnali, confronta, decidi e ricorda la scelta."
    >
      <defs>
        <linearGradient id="def-scope-loop-a" x1="60" y1="40" x2="300" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b794ff" />
          <stop offset="0.5" stopColor="#6a3cff" />
          <stop offset="1" stopColor="#2a1494" />
        </linearGradient>
        <linearGradient id="def-scope-loop-b" x1="120" y1="20" x2="360" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6a3cff" />
          <stop offset="0.6" stopColor="#2a1494" />
          <stop offset="1" stopColor="#140a44" />
        </linearGradient>
        <linearGradient id="def-scope-wave" x1="30" y1="240" x2="450" y2="270" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3bf4c" />
          <stop offset="0.5" stopColor="#ffe57d" />
          <stop offset="1" stopColor="#48dfff" />
        </linearGradient>
      </defs>

      {/* candidate orbit — interlaced loops */}
      <ellipse
        cx="170" cy="130" rx="120" ry="88"
        fill="none" stroke="url(#def-scope-loop-a)"
        strokeWidth="5" strokeLinecap="round"
      />
      <ellipse
        cx="290" cy="120" rx="120" ry="88"
        fill="none" stroke="url(#def-scope-loop-b)"
        strokeWidth="5" strokeLinecap="round"
      />

      {/* candidate tiles riding the orbit */}
      {candidates.map((t, i) => {
        const pos = [
          { x: 56, y: 122 },
          { x: 168, y: 42 },
          { x: 284, y: 114 },
        ][i];
        return (
          <g key={t.slug} transform={`translate(${pos.x} ${pos.y})`}>
            <rect width="44" height="44" rx="14" fill="#f4f0e7" />
            <rect x="3" y="3" width="38" height="38" rx="11" fill="#1a0d63" />
            <text
              x="22" y="27.5"
              textAnchor="middle"
              fontFamily="var(--tv-font-display, Anton, sans-serif)"
              fontSize="15"
              fill="#f4f0e7"
            >
              {initials(t.name)}
            </text>
          </g>
        );
      })}

      {/* signal wave crossing the system */}
      <path
        className="def-scope__wave"
        d="M24 262c40 14 78-38 122-38 46 0 76 52 128 52 44 0 66-36 100-36"
        fill="none" stroke="url(#def-scope-wave)"
        strokeWidth="4.5" strokeLinecap="round"
      />

      {/* comparison axis */}
      <line x1="40" y1="316" x2="440" y2="316" stroke="rgba(244,240,231,0.14)" strokeWidth="1" />
      <line x1="40" y1="316" x2="240" y2="316" stroke="#6a3cff" strokeWidth="2" className="def-scope__axis" />

      {/* decision node */}
      <circle cx="240" cy="316" r="5" fill="#f3bf4c" className="def-scope__pulse" />
      <path
        d="M240 316l14-8v16z"
        fill="#f3bf4c"
        transform="rotate(90 240 316)"
      />

      {/* memory rail */}
      <line x1="60" y1="392" x2="420" y2="392" stroke="rgba(244,240,231,0.12)" strokeWidth="1" />
      {[100, 180, 260, 340].map((x, i) => (
        <rect
          key={x}
          x={x - 7} y="385"
          width="14" height="14" rx="4.5"
          fill={i === 1 ? "#d6c4ff" : "#18181d"}
          stroke={i === 1 ? "#d6c4ff" : "rgba(244,240,231,0.25)"}
          strokeWidth="1"
        />
      ))}

      {/* frame annotation */}
    </svg>
  );
}
