import { SignalMark } from "@/components/signal/marks/signal-mark";
import { SIGNAL_LEVEL_THRESHOLDS } from "@/lib/signal-progression/levels";

const LEVEL_CODES = [
  "first_signal",
  "first_verdict",
  "stack_builder",
  "strategist",
  "cartographer",
] as const;

export function SignalMapRail({ currentLevel = 0 }: { currentLevel?: number }) {
  return (
    <ol className="tv-signal-map" aria-label="Mappa del segnale">
      {SIGNAL_LEVEL_THRESHOLDS.map((row, index) => {
        const state =
          row.level < currentLevel
            ? "earned"
            : row.level === currentLevel
              ? "nearby"
              : "locked";
        return (
          <li key={row.level} className={`tv-signal-map__node is-${state}`}>
            <SignalMark
              code={LEVEL_CODES[index] ?? "first_signal"}
              state={state}
              title={row.title}
              width={22}
              height={22}
            />
            <span>{row.title}</span>
          </li>
        );
      })}
    </ol>
  );
}
