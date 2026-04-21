"use client";

import { useEffect, useState } from "react";

type RoundTimerProps = {
  durationMinutes: number;
  startedAt: string | null;
};

export function RoundTimer({ durationMinutes, startedAt }: RoundTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!startedAt) {
    return (
      <div style={cardStyle}>
        <span style={labelStyle}>Cronometro</span>
        <strong style={valueStyle}>Aguardando inicio</strong>
      </div>
    );
  }

  const startedAtMs = new Date(startedAt).getTime();
  const elapsedMs = Math.max(now - startedAtMs, 0);
  const remainingMs = Math.max(durationMinutes * 60_000 - elapsedMs, 0);

  return (
    <div style={cardStyle}>
      <span style={labelStyle}>Cronometro</span>
      <strong style={valueStyle}>{formatDuration(elapsedMs)}</strong>
      <span style={metaStyle}>
        {remainingMs > 0
          ? `Correndo até ${durationMinutes} min`
          : `Passou dos ${durationMinutes} min`}
      </span>
    </div>
  );
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FAFAFA",
  padding: "10px 12px",
  display: "grid",
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#8B6914",
  fontWeight: 700,
};

const valueStyle: React.CSSProperties = {
  fontSize: 24,
  color: "#101010",
  lineHeight: 1,
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#4B5563",
  lineHeight: 1.4,
};
