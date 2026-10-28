"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamFlag } from "@/components/championship/TeamFlag";

type Tab = "CLASSIFICACAO" | "ESTATISTICAS" | "TIMES";

type Team = {
  id: string;
  name: string;
  shortName: string | null;
  slug: string | null;
  icon: string | null;
};

type Standing = {
  id: string;
  rank: number | null;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  team: Team;
};

type Match = {
  id: string;
  round: number;
  stageName: string | null;
  stageType: string | null;
  scheduledAt: string | null;
  status: "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

type Props = {
  championshipName: string;
  seasonLabel: string | null;
  teams: Team[];
  standings: Standing[];
  matches: Match[];
  championTeamId: string | null;
  topScorers: Array<{ key: string; name: string; goals: number }>;
  cardLeaders: Array<{ key: string; name: string; yellowCards: number; redCards: number; blueCards: number }>;
  matchMvps: Array<{ key: string; playerName: string; matchLabel: string }>;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "CLASSIFICACAO", label: "Classificação" },
  { id: "ESTATISTICAS", label: "Estatísticas" },
  { id: "TIMES", label: "Times" },
];

export function TioHugoPublicDashboard({ championshipName, seasonLabel, teams, standings, matches, championTeamId, topScorers, cardLeaders, matchMvps }: Props) {
  const [tab, setTab] = useState<Tab>("CLASSIFICACAO");
  const rounds = useMemo(() => [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b), [matches]);
  const [round, setRound] = useState(() => rounds.at(-1) ?? 1);
  const selectedRound = rounds.includes(round) ? round : (rounds.at(-1) ?? 1);
  const selectedMatches = matches.filter((match) => match.round === selectedRound).sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
  const champion = teams.find((team) => team.id === championTeamId) ?? null;
  const teamsWithGames = standings.filter((standing) => standing.gamesPlayed > 0);
  const bestAttack = teamsWithGames.length ? Math.max(...teamsWithGames.map((standing) => standing.goalsFor)) : null;
  const bestDefense = teamsWithGames.length ? Math.min(...teamsWithGames.map((standing) => standing.goalsAgainst)) : null;

  return (
    <div className="grid gap-3 py-1.5 md:py-2">
      <section className="xv-card p-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[.16em] text-[#8B6914]">{championshipName} {seasonLabel}</p>
        <div className="mt-0.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-black">Central do campeonato</h1>
          <nav aria-label="Módulos do campeonato" className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            {tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${tab === item.id ? "bg-[#1A1A1A] text-white" : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E5E7EB]"}`}>{item.label}</button>)}
          </nav>
        </div>
      </section>

      {champion ? <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8D193] bg-[#FFFCF2] px-4 py-3"><span className="grid h-11 w-11 place-items-center rounded-full border border-[#E8D193] bg-white"><TeamFlag icon={champion.icon} className="text-2xl" /></span><div><p className="text-[0.68rem] font-bold uppercase tracking-[.14em] text-[#8B6914]">Campeão da edição</p><Link href={teamHref(champion)} className="text-lg font-black text-[#101010] hover:text-[#8B6914]">🏆 {teamName(champion)}</Link></div></section> : null}

      {tab === "CLASSIFICACAO" ? <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.8fr)]"><div className="grid content-start gap-3"><StandingsTable standings={standings} championTeamId={championTeamId} /><Highlights standings={standings} bestAttack={bestAttack} bestDefense={bestDefense} topScorers={topScorers} /></div><RoundPanel rounds={rounds} round={selectedRound} onRoundChange={setRound} matches={selectedMatches} /></section> : null}
      {tab === "ESTATISTICAS" ? <Statistics scorers={topScorers} cards={cardLeaders} mvps={matchMvps} /> : null}
      {tab === "TIMES" ? <Teams teams={teams} championTeamId={championTeamId} /> : null}
    </div>
  );
}

function StandingsTable({ standings, championTeamId }: { standings: Standing[]; championTeamId: string | null }) {
  return <section className="xv-card overflow-hidden"><div className="border-b border-[#E5E7EB] pb-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Classificação final</p><h2 className="mt-1 text-2xl font-black tracking-tight">Tabela</h2></div><div className="xv-table-scroll"><table className="min-w-[760px] w-full border-collapse text-base"><thead><tr className="border-b border-[#D4D4D8] text-left text-xs font-medium uppercase text-[#A1A1AA]"><th className="py-3 pr-3">Classificação</th><th className="bg-[#F4F4F5] px-4 py-3 text-center">P</th><th className="px-4 py-3 text-center">J</th><th className="bg-[#F4F4F5] px-4 py-3 text-center">V</th><th className="px-4 py-3 text-center">E</th><th className="bg-[#F4F4F5] px-4 py-3 text-center">D</th><th className="px-4 py-3 text-center">GP</th><th className="bg-[#F4F4F5] px-4 py-3 text-center">GC</th><th className="px-4 py-3 text-center">SG</th></tr></thead><tbody>{standings.map((standing) => { const isChampion = standing.team.id === championTeamId; return <tr key={standing.id} className={isChampion ? "border-b border-[#E8D193] bg-[#FFFCF2] text-[#444]" : "border-b border-[#E5E7EB] text-[#444]"}><td className="py-3 pr-3 text-lg font-medium text-[#303030]"><span className="inline-flex items-center"><span className={`w-9 shrink-0 font-normal ${isChampion ? "text-[#8B6914]" : "text-[#159447]"}`}>{standing.rank ?? "–"}</span><TeamFlag icon={standing.team.icon} className="mr-2 w-7 shrink-0 text-xl" /><Link href={teamHref(standing.team)} className="hover:text-[#8B6914] hover:underline">{teamName(standing.team)}</Link>{isChampion ? <span className="ml-2 rounded-full bg-[#B89020] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[.1em] text-white">🏆 Campeão</span> : null}</span></td><Cell shade value={standing.points} bold /><Cell value={standing.gamesPlayed} /><Cell shade value={standing.wins} /><Cell value={standing.draws} /><Cell shade value={standing.losses} /><Cell value={standing.goalsFor} /><Cell shade value={standing.goalsAgainst} /><Cell value={standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference} /></tr>; })}</tbody></table></div></section>;
}

function Cell({ value, shade = false, bold = false }: { value: string | number; shade?: boolean; bold?: boolean }) { return <td className={`${shade ? "bg-[#F4F4F5]" : ""} px-4 py-3 text-center ${bold ? "text-lg font-black" : ""}`}>{value}</td>; }

function Highlights({ standings, bestAttack, bestDefense, topScorers }: { standings: Standing[]; bestAttack: number | null; bestDefense: number | null; topScorers: Props["topScorers"] }) { const scorerGoals = topScorers[0]?.goals ?? 0; return <section className="grid gap-3 sm:grid-cols-3" aria-label="Destaques do campeonato"><Highlight label="Melhor ataque" value={bestAttack === null ? "Sem jogos" : `${bestAttack} gols`} teams={standings.filter((item) => item.goalsFor === bestAttack).map((item) => item.team)} /><Highlight label="Melhor defesa" value={bestDefense === null ? "Sem jogos" : `${bestDefense} gols sofridos`} teams={standings.filter((item) => item.goalsAgainst === bestDefense).map((item) => item.team)} blue /><article className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"><p className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-[#8B6914]">Artilharia</p><p className="mt-2 text-2xl font-black text-[#101010]">{topScorers.length ? `${scorerGoals} gols` : "Sem gols"}</p><div className="mt-3 grid gap-1.5">{topScorers.filter((item) => item.goals === scorerGoals).map((item) => <span key={item.key} className="text-sm font-bold text-[#303030]">⚽ {item.name}</span>)}</div></article></section>; }

function Highlight({ label, value, teams, blue = false }: { label: string; value: string; teams: Team[]; blue?: boolean }) { return <article className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${blue ? "border-[#C7DAF8] bg-[#F6FAFF]" : "border-[#E8D193] bg-[#FFFCF2]"}`}><p className={`text-[0.72rem] font-bold uppercase tracking-[.16em] ${blue ? "text-[#2563A8]" : "text-[#8B6914]"}`}>{label}</p><p className="mt-2 text-2xl font-black text-[#101010]">{value}</p><div className="mt-3 grid gap-1.5">{teams.map((team) => <Link key={team.id} href={teamHref(team)} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#303030] hover:text-[#8B6914]"><TeamFlag icon={team.icon} className="text-lg" />{teamName(team)}</Link>)}</div></article>; }

function RoundPanel({ rounds, round, onRoundChange, matches }: { rounds: number[]; round: number; onRoundChange: (round: number) => void; matches: Match[] }) { return <section className="xv-card"><div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Jogos</p><h2 className="mt-1 text-2xl font-black tracking-tight">Rodadas</h2></div><select value={round} onChange={(event) => onRoundChange(Number(event.target.value))} className="rounded-xl border border-[#D4D4D8] bg-white px-3 py-2 text-sm font-bold">{rounds.map((item) => <option key={item} value={item}>{item}ª rodada</option>)}</select></div><div className="divide-y divide-[#E5E7EB]">{matches.map((match) => <article key={match.id} className="py-5 text-center"><p className="text-sm font-bold text-[#57534E]">{match.stageName || `Rodada ${match.round}`} · {formatDate(match.scheduledAt)}</p><div className="mt-2 grid grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_3.75rem_minmax(0,1fr)] items-center gap-1.5 text-lg"><Link className="truncate text-right font-semibold hover:text-[#8B6914]" href={teamHref(match.homeTeam)}>{teamName(match.homeTeam)}</Link><TeamFlag icon={match.homeTeam.icon} className="text-xl" /><Link href={`/campeonatos/tio-hugo-2026/jogos/${match.id}`} className="whitespace-nowrap text-center font-black text-[#8B6914] hover:underline">{match.status === "FINALIZADO" ? `${match.homeScore} × ${match.awayScore}` : "×"}</Link><TeamFlag icon={match.awayTeam.icon} className="text-xl" /><Link className="truncate text-left font-semibold hover:text-[#8B6914]" href={teamHref(match.awayTeam)}>{teamName(match.awayTeam)}</Link></div><Link href={`/campeonatos/tio-hugo-2026/jogos/${match.id}`} className="mt-2 inline-block text-sm font-bold text-[#8B6914] hover:underline">Ver resultado e súmula</Link></article>)}</div></section>; }

function Statistics({ scorers, cards, mvps }: { scorers: Props["topScorers"]; cards: Props["cardLeaders"]; mvps: Props["matchMvps"] }) { return <section className="grid gap-3 xl:grid-cols-3"><StatCard title="Artilharia" rows={scorers.map((item) => ({ label: item.name, value: `⚽ ${item.goals}` }))} empty="Nenhum gol registrado." /><StatCard title="Cartões" rows={cards.map((item) => ({ label: item.name, value: `${"🟨".repeat(item.yellowCards)}${"🟥".repeat(item.redCards)}${"🟦".repeat(item.blueCards)}` }))} empty="Nenhum cartão registrado." /><StatCard title="MVPs por jogo" rows={mvps.map((item) => ({ label: item.playerName, value: item.matchLabel }))} empty="Nenhum MVP registrado." /></section>; }
function StatCard({ title, rows, empty }: { title: string; rows: Array<{ label: string; value: string }>; empty: string }) { return <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Estatísticas</p><h2 className="mt-1 text-2xl font-black">{title}</h2><div className="mt-4 grid gap-2">{rows.length ? rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-2"><span className="font-semibold text-[#101010]">{row.label}</span><span className="text-right text-sm font-bold text-[#4B5563]">{row.value}</span></div>) : <p className="text-sm text-[#6B7280]">{empty}</p>}</div></section>; }
function Teams({ teams, championTeamId }: { teams: Team[]; championTeamId: string | null }) { return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team) => { const isChampion = team.id === championTeamId; return <Link key={team.id} href={teamHref(team)} className={`rounded-2xl border p-4 no-underline transition hover:border-[#D4B051] ${isChampion ? "border-[#E8D193] bg-[#FFFCF2]" : "border-[#E5E7EB] bg-white"}`}><div className="flex items-center gap-3"><TeamFlag icon={team.icon} className="text-3xl" /><div><p className="text-lg font-black text-[#101010]">{teamName(team)}</p>{isChampion ? <p className="text-xs font-bold uppercase tracking-[.12em] text-[#8B6914]">🏆 Campeão</p> : null}</div></div></Link>; })}</section>; }
function teamName(team: Team) { return team.shortName || team.name; }
function teamHref(team: Team) { return team.slug ? `/campeonatos/tio-hugo-2026/times/${team.slug}` : "/campeonatos/tio-hugo-2026"; }
function formatDate(date: string | null) { return date ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(date)) : "Data a definir"; }
