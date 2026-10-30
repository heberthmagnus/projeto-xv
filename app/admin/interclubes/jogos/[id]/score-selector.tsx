"use client";

import { useState } from "react";

export function ScoreSelector({ name, label, initial }: { name: string; label: string; initial: number | null }) {
  const [score, setScore] = useState(initial ?? 0);
  return <div className="grid justify-items-center gap-2"><span className="text-sm font-bold text-[#52525B]">{label}</span><input type="hidden" name={name} value={score}/><div className="flex items-center gap-3"><button type="button" onClick={() => setScore(n => Math.max(0,n-1))} aria-label={`Diminuir gols de ${label}`} className="h-10 w-10 rounded-full border border-[#D4D4D8] text-xl font-bold">−</button><span className="min-w-10 text-center text-4xl font-black tabular-nums">{score}</span><button type="button" onClick={() => setScore(n => Math.min(999,n+1))} aria-label={`Aumentar gols de ${label}`} className="h-10 w-10 rounded-full border border-[#D4D4D8] text-xl font-bold">+</button></div></div>;
}
