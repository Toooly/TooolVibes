"use client";

import { useEffect, useState } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

function formatRemaining(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type DailyResetCountdownProps = {
  className?: string;
  size?: number;
};

export function DailyResetCountdown({ className, size = 56 }: DailyResetCountdownProps) {
  const [key, setKey] = useState(0);
  const [duration, setDuration] = useState(24 * 60 * 60);

  useEffect(() => {
    setDuration(getSecondsUntilMidnight());
    setKey((previous) => previous + 1);
  }, []);

  return (
    <div
      className={className}
      aria-label="Conto alla rovescia fino al reset giornaliero delle missioni"
    >
      <CountdownCircleTimer
        key={key}
        isPlaying
        duration={duration}
        colors={["#6a3cff", "#39d2f6", "#f3bf4c", "#b42318"]}
        colorsTime={[duration, Math.floor(duration * 0.5), Math.floor(duration * 0.15), 0]}
        strokeWidth={4}
        size={size}
        trailColor="rgba(106, 60, 255, 0.12)"
        onComplete={() => {
          setDuration(24 * 60 * 60);
          setKey((previous) => previous + 1);
          return { shouldRepeat: false };
        }}
      >
        {({ remainingTime }) => (
          <span className="daily-reset-countdown__text" aria-live="polite">
            {formatRemaining(remainingTime)}
          </span>
        )}
      </CountdownCircleTimer>
    </div>
  );
}
