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
  home: string;
  homeSlug: string | null;
  homeIcon: string | null;
  away: string;
  awaySlug: string | null;
  awayIcon: string | null;
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
          <StandingsTable label={label} teams={categoryTeams} />
          <RoundPanel
            label={label}
            games={games}
            round={selectedRound}
            rounds={rounds}
            onRoundChange={setRound}
          />
        </section>
      ) : null}

      {tab === "ARTILHARIA" ? <EmptyModule title={`Artilharia ${label}`} description="Os gols lançados nas partidas aparecerão aqui, com jogador, seleção e total de gols." /> : null}
      {tab === "CARTOES" ? <EmptyModule title={`Cartões e suspensões ${label}`} description="Cartões, cumprimento de suspensão e jogadores pendurados serão centralizados neste painel." /> : null}
      {tab === "ELENCOS" ? <RosterModule teams={categoryTeams} label={label} /> : null}
      {tab === "REGULAMENTO" ? <RulesModule /> : null}
    </div>
  );
}

function StandingsTable({ label, teams }: { label: string; teams: Team[] }) {
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
            {teams.map((team, index) => (
              <tr key={team.name} className="border-b border-[#E5E7EB] text-[#444]">
                <td className="py-3 pr-3 text-lg font-medium text-[#303030]">
                  <span className="inline-flex items-center">
                    <span className={`w-9 shrink-0 font-normal ${index < 4 ? "text-[#1267E8]" : "text-[#159447]"}`}>{index + 1}</span>
                    <span aria-hidden className="inline-flex w-7 shrink-0 justify-center leading-none">{team.icon}</span>
                    {team.slug ? <Link href={`/campeonatos/interno-campao-2026/times/${team.slug}`} className="hover:text-[#8B6914] hover:underline">{team.name}</Link> : <span>{team.name}</span>}
                  </span>
                </td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center text-lg font-black">0</td>
                <td className="px-4 py-3 text-center">0</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">0</td>
                <td className="px-4 py-3 text-center">0</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">0</td>
                <td className="px-4 py-3 text-center">0</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">0</td>
                <td className="px-4 py-3 text-center">0</td>
                <td className="bg-[#F4F4F5] px-4 py-3 text-center">0</td>
              </tr>
            ))}
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
        {games.map((game) => <article key={`${game.home}-${game.away}`} className="py-8 text-center"><p className="text-base font-bold text-[#57534E]">{game.scheduledAt ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(game.scheduledAt)) : "Data a definir"}</p><div className="mt-3 grid grid-cols-[minmax(0,1fr)_2rem_1.25rem_2rem_minmax(0,1fr)] items-center gap-2 text-xl"><span className="truncate text-right font-semibold">{game.homeSlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.homeSlug}`}>{game.home}</Link> : game.home}</span><span className="text-2xl leading-none" aria-hidden>{game.homeIcon}</span><strong className="text-center text-[#A3A3A3]">×</strong><span className="text-2xl leading-none" aria-hidden>{game.awayIcon}</span><span className="truncate text-left font-semibold">{game.awaySlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.awaySlug}`}>{game.away}</Link> : game.away}</span></div></article>)}
      </div>
    </section>
  );
}

function EmptyModule({ title, description }: { title: string; description: string }) {
  return <section className="xv-card py-12 text-center"><h2 className="text-2xl font-black">{title}</h2><p className="mx-auto mt-3 max-w-xl text-[#6B7280]">{description}</p></section>;
}

function RosterModule({ teams, label }: { teams: Team[]; label: string }) {
  return <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p><h2 className="mt-1 text-2xl font-black">Elencos</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team) => <article key={team.name} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"><h3 className="font-black"><span className="mr-2 text-xl" aria-hidden>{team.icon}</span>{team.slug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${team.slug}`}>{team.name}</Link> : team.name}</h3><ol className="mt-3 grid gap-1.5 text-sm text-[#374151]">{team.players.map((player, index) => <li key={`${team.name}-${player}`}><span className="mr-2 text-[#8B6914]">{index + 1}.</span>{player}</li>)}</ol></article>)}</div></section>;
}

function RulesModule() {
  return <section className="xv-card"><h2 className="text-2xl font-black">Regulamento</h2><div className="mt-4 grid gap-3 text-[#4B5563]"><p>Fase classificatória com seis seleções em cada categoria.</p><p>A classificação será atualizada conforme o lançamento oficial dos resultados, gols e cartões.</p></div></section>;
}
