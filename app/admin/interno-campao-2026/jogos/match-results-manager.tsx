"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCompleteMatchSheet, type MatchSaveState } from "./actions";

type EventType = "GOL" | "CARTAO_AMARELO" | "CARTAO_AZUL" | "CARTAO_VERMELHO";
type Team = { id: string; name: string; shortName: string | null; icon: string | null; players: Array<{ id: string; profileId: string | null; name: string }> };
export type AdminMatch = {
  id: string; category: "ADULTO" | "MASTER"; round: number; scheduledAt: string | null; homeScore: number | null; awayScore: number | null; status: string; matchReport: string | null;
  events: Array<{ player: string; playerId: string | null; teamId: string | null; type: EventType; quantity: number }>;
  participations: Array<{ playerId: string; teamId: string; goals: number; yellowCards: number; redCards: number }>;
  homeTeam: Team; awayTeam: Team;
};

export function MatchResultsManager({ matches }: { matches: AdminMatch[] }) {
  const [category, setCategory] = useState<"ADULTO" | "MASTER">("ADULTO");
  const filtered = useMemo(() => matches.filter((match) => match.category === category), [matches, category]);
  const rounds = useMemo(() => [...new Set(filtered.map((match) => match.round))].sort((a, b) => a - b), [filtered]);
  const [round, setRound] = useState(rounds[0] ?? 1);
  const [selected, setSelected] = useState<AdminMatch | null>(null);
  const selectedMatch = selected ? matches.find((match) => match.id === selected.id) ?? selected : null;
  const selectedRound = rounds.includes(round) ? round : (rounds[0] ?? 1);
  const games = filtered.filter((match) => match.round === selectedRound);

  useEffect(() => { if (!selected) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [selected]);

  return <><section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#B89020]">Campeonato Interno 2026</p><div className="mt-1"><h1 className="text-2xl font-black">Lançar resultados</h1><p className="mt-2 text-sm text-[#6B7280]">Escolha a categoria e a rodada. Abra uma partida para preencher a súmula.</p><div className="mt-4 flex w-fit rounded-xl border border-[#D4D4D8] p-1" aria-label="Categoria">{(["ADULTO", "MASTER"] as const).map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg px-4 py-2 text-sm font-black transition ${category === item ? "bg-[#1A1A1A] text-white" : "text-[#52525B]"}`}>{item === "ADULTO" ? "Adulto" : "Master"}</button>)}</div></div></section>
    <section className="mt-5 xv-card"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {category === "ADULTO" ? "Adulto" : "Master"}</p><h2 className="mt-1 text-2xl font-black">Jogos</h2></div><label className="flex items-center gap-2 text-sm font-bold">Rodada<select value={selectedRound} onChange={(event) => setRound(Number(event.target.value))} className="rounded-xl border border-[#D4D4D8] bg-white px-3 py-2.5 font-bold">{rounds.map((item) => <option key={item} value={item}>{item}ª rodada</option>)}</select></label></div>
      <div className="divide-y divide-[#E5E7EB]">{games.length ? games.map((match) => <button key={match.id} type="button" onClick={() => setSelected(match)} className="grid w-full gap-2 px-2 py-5 text-left transition hover:bg-[#FFFCF2] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4"><div><p className="text-sm font-bold text-[#6B7280]">{formatDate(match.scheduledAt)}</p><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-black"><span>{match.homeTeam.icon} {teamName(match.homeTeam)}</span><span className="text-[#8B6914]">{match.homeScore ?? "–"} × {match.awayScore ?? "–"}</span><span>{match.awayTeam.icon} {teamName(match.awayTeam)}</span></div></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E7D5A0] bg-white px-3 py-2 text-sm font-black text-[#8B6914]">Lançar dados <span aria-hidden>→</span></span></button>) : <p className="py-10 text-center text-[#6B7280]">Nenhum jogo nesta rodada.</p>}</div></section>
    {selectedMatch ? <MatchModal key={`${selectedMatch.id}-${JSON.stringify(selectedMatch.events)}`} match={selectedMatch} onClose={() => setSelected(null)}/> : null}</>;
}

function MatchModal({ match, onClose }: { match: AdminMatch; onClose: () => void }) {
  const [state, setState] = useState<MatchSaveState>({ status: "idle", message: "" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const saveAll = () => {
    const modal = document.getElementById(`match-sheet-${match.id}`);
    if (!modal) return;
    const data = new FormData();
    data.set("matchId", match.id);
    modal.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((field) => {
      if (!field.name || (field instanceof HTMLInputElement && field.type === "checkbox" && !field.checked)) return;
      data.append(field.name, field.value);
    });
    startTransition(async () => {
      const result = await saveCompleteMatchSheet({ status: "idle", message: "" }, data);
      setState(result);
      if (result.status === "success") router.refresh();
    });
  };
  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/55 p-0 sm:place-items-center sm:p-5" role="presentation" onMouseDown={onClose}><section id={`match-sheet-${match.id}`} role="dialog" aria-modal="true" aria-labelledby="match-sheet-title" className="max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:rounded-[28px] sm:p-6" onMouseDown={(event) => event.stopPropagation()}><div className="sticky top-[-1rem] z-10 -mx-4 mb-4 flex items-start justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 pb-4 pt-4 sm:top-[-1.5rem] sm:-mx-6 sm:px-6 sm:pt-6"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">{match.category === "ADULTO" ? "Adulto" : "Master"} · Rodada {match.round}</p><h2 id="match-sheet-title" className="mt-1 text-xl font-black">{teamName(match.homeTeam)} <span className="text-[#A3A3A3]">×</span> {teamName(match.awayTeam)}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#D4D4D8] text-xl font-bold hover:bg-[#F4F4F5]" aria-label="Fechar súmula">×</button></div>
    {state.status !== "idle" ? <p role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>{state.status === "success" ? "✓ " : "! "}{state.message}</p> : null}
    <div className="grid gap-4 border-b border-[#E5E7EB] pb-5 sm:grid-cols-2"><div className="flex flex-wrap items-end gap-3"><ScoreInput name="homeScore" label={teamName(match.homeTeam)} value={match.homeScore}/><ScoreInput name="awayScore" label={teamName(match.awayTeam)} value={match.awayScore}/></div><label className="grid gap-1 text-sm font-bold">Data e horário<input name="scheduledAt" type="datetime-local" defaultValue={toInput(match.scheduledAt)} className="rounded-lg border border-[#D4D4D8] p-2.5"/></label></div>
    <div className="grid gap-5 py-5 xl:grid-cols-2"><TeamSheet match={match} team={match.homeTeam}/><TeamSheet match={match} team={match.awayTeam}/></div>
    <div className="border-t border-[#E5E7EB] pt-5"><label className="grid gap-2"><span className="text-sm font-black">Súmula do jogo</span><textarea name="matchReport" defaultValue={match.matchReport ?? ""} rows={4} placeholder="Observações e ocorrências da partida..." className="w-full rounded-xl border border-[#D4D4D8] p-3 text-sm"/></label></div><div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"><button type="button" onClick={saveAll} disabled={pending} className="w-full rounded-xl bg-[#B89020] px-5 py-3 font-black text-white disabled:opacity-70">{pending ? "Salvando alterações…" : "Salvar todas as alterações"}</button><p className="mt-2 text-center text-xs text-[#6B7280]">Resultado, horário, atletas, gols, cartões e súmula são salvos juntos.</p></div>
  </section></div>;
}

function TeamSheet({ match, team }: { match: AdminMatch; team: Team }) {
  const eventStats = new Map<string, Partial<Record<EventType, number>>>();
  match.events.filter((event) => event.teamId === team.id && event.playerId && event.player).forEach((event) => { const stats = eventStats.get(`${event.playerId}:${event.player}`) ?? {}; stats[event.type] = (stats[event.type] ?? 0) + event.quantity; eventStats.set(`${event.playerId}:${event.player}`, stats); });
  const participations = new Map(match.participations.filter((item) => item.teamId === team.id).map((item) => [item.playerId, item]));
  return <section className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-3"><input type="hidden" name="teamId" value={team.id}/><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-black">{team.icon} {teamName(team)}</h3><span className="text-xs font-bold uppercase tracking-wide text-[#8B6914]">Atletas</span></div><div className="overflow-x-auto"><table className="min-w-[470px] w-full text-sm"><thead><tr className="border-y border-[#E5E7EB] text-left text-[0.65rem] font-black uppercase tracking-wide text-[#6B7280]"><th className="w-7 py-2">#</th><th className="py-2">Jogador</th><th className="w-12 px-1 text-center">Jogou</th><th className="w-10 px-1 text-center" title="Gols">⚽</th><th className="w-9 px-1 text-center" title="Cartões amarelos">🟨</th><th className="w-9 px-1 text-center" title="Cartões azuis">🟦</th><th className="w-9 px-1 text-center" title="Cartões vermelhos">🟥</th></tr></thead><tbody>{team.players.map((player, index) => { const stats = player.profileId ? eventStats.get(`${player.profileId}:${player.name}`) : undefined; const hasEventsForProfile = Boolean(player.profileId && match.events.some((event) => event.teamId === team.id && event.playerId === player.profileId)); const participation = player.profileId ? participations.get(player.profileId) : undefined; const fallback = hasEventsForProfile ? undefined : participation; return <tr key={player.id} className="border-b border-[#E5E7EB]"><td className="py-2 text-[#6B7280]">{index + 1}</td><td className="py-2 pr-2 font-semibold text-[#303030]"><input type="hidden" name={`playerId:${team.id}`} value={player.id}/>{player.name}</td><td className="px-1 text-center"><input type="checkbox" name={`played:${player.id}`} defaultChecked={Boolean(fallback || stats)} aria-label={`Participação de ${player.name}`} className="h-5 w-5 rounded accent-[#B89020]"/></td><StatCounter name={`goals:${player.id}`} value={stats?.GOL ?? fallback?.goals ?? 0} label={`Gols de ${player.name}`} kind="goal"/><StatCounter name={`yellow:${player.id}`} value={stats?.CARTAO_AMARELO ?? fallback?.yellowCards ?? 0} label={`Cartões amarelos de ${player.name}`} kind="yellow"/><StatCounter name={`blue:${player.id}`} value={stats?.CARTAO_AZUL ?? 0} label={`Cartões azuis de ${player.name}`} kind="blue"/><StatCounter name={`red:${player.id}`} value={stats?.CARTAO_VERMELHO ?? fallback?.redCards ?? 0} label={`Cartões vermelhos de ${player.name}`} kind="red"/></tr>; })}</tbody></table></div><p className="mt-3 text-xs text-[#6B7280]">No celular, deslize a lista para ver todos os indicadores. Eles voltam a zero após o limite.</p></section>;
}

function ScoreInput({ name, label, value }: { name: string; label: string; value: number | null }) { return <label className="grid gap-1 text-sm font-bold">{label}<input name={name} type="number" min="0" defaultValue={value ?? ""} className="w-20 rounded-lg border border-[#D4D4D8] p-2.5"/></label>; }
function StatCounter({ name, value, label, kind }: { name: string; value: number; label: string; kind: "goal" | "yellow" | "blue" | "red" }) {
  const [count, setCount] = useState(value);
  const maximum = kind === "goal" ? 9 : 2;
  const activeClass = { goal: "bg-[#101010] text-white", yellow: "bg-[#FACC15]", blue: "bg-[#2563EB] text-white", red: "bg-[#EF4444] text-white" }[kind];
  return <td className="px-1 py-1 text-center"><input type="hidden" name={name} value={count}/><button type="button" onClick={() => setCount((current) => current >= maximum ? 0 : current + 1)} aria-label={`${label}: ${count}. Clique para aumentar`} title={`${label}: clique para aumentar; após ${maximum}, volta a zero`} className={`grid h-8 w-8 place-items-center rounded-md text-sm font-black shadow-sm transition ${count ? activeClass : "bg-[#C7C7C7] text-[#555]"}`}>{kind === "goal" ? count : ""}</button></td>;
}
function teamName(team: Team) { return team.shortName || team.name; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "Data a definir"; }
function toInput(value: string | null) { if (!value) return ""; const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)); const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""; return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`; }
