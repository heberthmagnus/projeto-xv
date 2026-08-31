"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = "ADULTO" | "MASTER";
type Tab = "CLASSIFICACAO" | "ARTILHARIA" | "CARTOES" | "ELENCOS" | "REGULAMENTO";

type Team = { category: Category; order: number; name: string; slug: string | null; icon: string | null; players: string[] };
type Game = {
  category: Category;
  round: number;
  order: number;
  scheduledAt: string | null;
  status: "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
  homeScore: number | null;
  awayScore: number | null;
  home: string;
  homeSlug: string | null;
  homeIcon: string | null;
  away: string;
  awaySlug: string | null;
  awayIcon: string | null;
  scorers: Array<{ name: string; team: string; quantity: number }>;
  cards: Array<{ name: string; team: string; quantity: number; type: "AMARELO" | "AZUL" | "VERMELHO" }>;
};

type Props = { teams: Team[]; matches: Game[] };

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "CLASSIFICACAO", label: "Classificação" },
  { id: "ARTILHARIA", label: "Artilharia" },
  { id: "CARTOES", label: "Cartões e suspensões" },
  { id: "ELENCOS", label: "Elencos" },
  { id: "REGULAMENTO", label: "Regulamento" },
];

export function CampaoPublicDashboard({ teams, matches }: Props) {
  const [category, setCategory] = useState<Category>("ADULTO");
  const [tab, setTab] = useState<Tab>("CLASSIFICACAO");
  const [round, setRound] = useState(1);
  const categoryTeams = useMemo(
    () => teams.filter((team) => team.category === category).sort((a, b) => a.order - b.order),
    [teams, category],
  );
  const categoryMatches = useMemo(
    () => matches.filter((match) => match.category === category),
    [matches, category],
  );
  const rounds = useMemo(
    () => [...new Set(categoryMatches.map((match) => match.round))].sort((a, b) => a - b),
    [categoryMatches],
  );
  const selectedRound = rounds.includes(round) ? round : (rounds[0] ?? 1);
  const games = categoryMatches
    .filter((match) => match.round === selectedRound)
    .sort((a, b) => a.order - b.order);
  const label = category === "ADULTO" ? "Adulto" : "Master";

  function switchCategory(nextCategory: Category) {
    setCategory(nextCategory);
    setRound(1);
  }

  return (
    <div className="grid gap-5 py-3 md:py-4">
      <section className="xv-card p-3 md:p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[.16em] text-[#8B6914]">
          Campeonato Interno XV Campão 2026
        </p>
        <h1 className="mt-1 text-xl font-black">Central do campeonato</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["ADULTO", "MASTER"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchCategory(item)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${category === item ? "bg-[#B89020] text-white" : "border border-[#E5E7EB] bg-white text-[#303030]"}`}
            >
              {item === "ADULTO" ? "Adulto" : "Master"}
            </button>
          ))}
        </div>
        <nav aria-label="Módulos do campeonato" className="mt-2 flex gap-2 overflow-x-auto border-t border-[#E5E7EB] pt-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold transition ${tab === item.id ? "bg-[#1A1A1A] text-white" : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E5E7EB]"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      {tab === "CLASSIFICACAO" ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
          <StandingsTable label={label} teams={categoryTeams} matches={categoryMatches} />
          <RoundPanel
            label={label}
            games={games}
            round={selectedRound}
            rounds={rounds}
            onRoundChange={setRound}
          />
        </section>
      ) : null}

      {tab === "ARTILHARIA" ? <ScorersModule label={label} matches={categoryMatches} /> : null}
      {tab === "CARTOES" ? <CardsModule label={label} matches={categoryMatches} /> : null}
      {tab === "ELENCOS" ? <RosterModule teams={categoryTeams} label={label} /> : null}
      {tab === "REGULAMENTO" ? <RulesModule /> : null}
    </div>
  );
}

function StandingsTable({ label, teams, matches }: { label: string; teams: Team[]; matches: Game[] }) {
  const standings = useMemo(() => {
    const table = new Map(teams.map((team) => [team.name, { team, points: 0, games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }]));
    for (const match of matches) {
      if (match.status !== "FINALIZADO" || match.homeScore === null || match.awayScore === null) continue;
      const home = table.get(match.home); const away = table.get(match.away);
      if (!home || !away) continue;
      home.games += 1; away.games += 1;
      home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore;
      if (match.homeScore > match.awayScore) { home.wins += 1; home.points += 3; away.losses += 1; }
      else if (match.homeScore < match.awayScore) { away.wins += 1; away.points += 3; home.losses += 1; }
      else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
    }
    return Array.from(table.values()).sort((left, right) => right.points - left.points || (right.goalsFor - right.goalsAgainst) - (left.goalsFor - left.goalsAgainst) || right.goalsFor - left.goalsFor || left.team.order - right.team.order);
  }, [teams, matches]);
  return (
    <section className="xv-card overflow-hidden">
      <div className="border-b border-[#E5E7EB] pb-3">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Tabela</h2>
      </div>
      <div className="xv-table-scroll">
        <table className="min-w-[760px] w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-[#D4D4D8] text-left text-xs font-medium uppercase text-[#A1A1AA]">
              <th className="py-3 pr-3">Classificação</th>
              <th className="bg-[#F4F4F5] px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">J</th>
              <th className="bg-[#F4F4F5] px-4 py-3 text-center">V</th>
              <th className="px-4 py-3 text-center">E</th>
              <th className="bg-[#F4F4F5] px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center">GP</th>
              <th className="bg-[#F4F4F5] px-4 py-3 text-center">GC</th>
              <th className="px-4 py-3 text-center">SG</th>
              <th className="bg-[#F4F4F5] px-4 py-3 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, index) => {
              const { team } = entry; const goalDifference = entry.goalsFor - entry.goalsAgainst;
              const winRate = entry.games ? Math.round((entry.points / (entry.games * 3)) * 100) : 0;
              return <tr key={team.name} className="border-b border-[#E5E7EB] text-[#444]">
                <td className="py-3 pr-3 text-lg font-medium text-[#303030]">
                  <span className="inline-flex items-center">
                    <span className={`w-9 shrink-0 font-normal ${index < 4 ? "text-[#1267E8]" : "text-[#159447]"}`}>{index + 1}</span>
                    <span aria-hidden className="inline-flex w-7 shrink-0 justify-center leading-none">{team.icon}</span>
                    {team.slug ? <Link href={`/campeonatos/interno-campao-2026/times/${team.slug}`} className="hover:text-[#8B6914] hover:underline">{team.name}</Link> : <span>{team.name}</span>}
                  </span>
                </td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center text-lg font-black">{entry.points}</td>
                <td className="px-4 py-3 text-center">{entry.games}</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">{entry.wins}</td>
                <td className="px-4 py-3 text-center">{entry.draws}</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">{entry.losses}</td>
                <td className="px-4 py-3 text-center">{entry.goalsFor}</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">{entry.goalsAgainst}</td>
                <td className="px-4 py-3 text-center">{goalDifference}</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">{winRate}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoundPanel({ label, games, round, rounds, onRoundChange }: { label: string; games: Game[]; round: number; rounds: number[]; onRoundChange: (round: number) => void }) {
  return (
    <section className="xv-card">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Jogos</h2>
        </div>
        <select value={round} onChange={(event) => onRoundChange(Number(event.target.value))} className="rounded-xl border border-[#D4D4D8] bg-white px-4 py-3 text-base font-bold">
          {rounds.map((item) => <option key={item} value={item}>{item}ª rodada</option>)}
        </select>
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {games.map((game) => <article key={`${game.home}-${game.away}`} className="py-8 text-center"><p className="text-base font-bold text-[#57534E]">{game.scheduledAt ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(game.scheduledAt)) : "Data a definir"}</p><div className="mt-3 grid grid-cols-[minmax(0,1fr)_2rem_1.25rem_2rem_minmax(0,1fr)] items-center gap-2 text-xl"><span className="truncate text-right font-semibold">{game.homeSlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.homeSlug}`}>{game.home}</Link> : game.home}</span><span className="text-2xl leading-none" aria-hidden>{game.homeIcon}</span><strong className="text-center text-[#A3A3A3]">{game.status === "FINALIZADO" ? `${game.homeScore} × ${game.awayScore}` : "×"}</strong><span className="text-2xl leading-none" aria-hidden>{game.awayIcon}</span><span className="truncate text-left font-semibold">{game.awaySlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.awaySlug}`}>{game.away}</Link> : game.away}</span></div></article>)}
      </div>
    </section>
  );
}

function EmptyModule({ title, description }: { title: string; description: string }) {
  return <section className="xv-card py-12 text-center"><h2 className="text-2xl font-black">{title}</h2><p className="mx-auto mt-3 max-w-xl text-[#6B7280]">{description}</p></section>;
}

function ScorersModule({ label, matches }: { label: string; matches: Game[] }) {
  const scorers = useMemo(() => {
    const totals = new Map<string, { name: string; team: string; goals: number }>();
    matches.flatMap((match) => match.scorers).forEach((item) => { const key = `${item.name}:${item.team}`; const current = totals.get(key) || { ...item, goals: 0 }; current.goals += item.quantity; totals.set(key, current); });
    return Array.from(totals.values()).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "pt-BR"));
  }, [matches]);
  return <StatsModule title={`Artilharia ${label}`} empty="Nenhum gol lançado ainda." rows={scorers.map((item) => ({ label: `${item.name} · ${item.team}`, value: `⚽ ${item.goals}` }))} />;
}

function CardsModule({ label, matches }: { label: string; matches: Game[] }) {
  const cards = useMemo(() => matches.flatMap((match) => match.cards || []).filter((item) => item?.name && item?.type).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [matches]);
  const icon = { AMARELO: "🟨", AZUL: "🟦", VERMELHO: "🟥" } as const;
  return <StatsModule title={`Cartões e suspensões ${label}`} empty="Nenhum cartão lançado ainda." rows={cards.map((item) => ({ label: `${item.name} · ${item.team}`, value: `${icon[item.type]} ${item.quantity}` }))} />;
}

function StatsModule({ title, empty, rows }: { title: string; empty: string; rows: Array<{ label: string; value: string }> }) {
  return <section className="xv-card"><h2 className="text-center text-2xl font-black">{title}</h2>{rows.length ? <div className="mx-auto mt-5 max-w-2xl divide-y divide-[#E5E7EB]">{rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4 px-3 py-3"><span className="font-semibold text-[#303030]">{row.label}</span><strong>{row.value}</strong></div>)}</div> : <p className="py-10 text-center text-[#6B7280]">{empty}</p>}</section>;
}

function RosterModule({ teams, label }: { teams: Team[]; label: string }) {
  return <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p><h2 className="mt-1 text-2xl font-black">Elencos</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team) => <article key={team.name} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"><h3 className="font-black"><span className="mr-2 text-xl" aria-hidden>{team.icon}</span>{team.slug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${team.slug}`}>{team.name}</Link> : team.name}</h3><ol className="mt-3 grid gap-1.5 text-sm text-[#374151]">{team.players.map((player, index) => <li key={`${team.name}-${player}`}><span className="mr-2 text-[#8B6914]">{index + 1}.</span>{player}</li>)}</ol></article>)}</div></section>;
}

function RulesModule() {
  return <section className="xv-card"><h2 className="text-2xl font-black">Regulamento</h2><div className="mt-4 grid gap-3 text-[#4B5563]"><p>Fase classificatória com seis seleções em cada categoria.</p><p>A classificação será atualizada conforme o lançamento oficial dos resultados, gols e cartões.</p></div></section>;
}
