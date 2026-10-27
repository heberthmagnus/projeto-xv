"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { TeamFlag } from "@/components/championship/TeamFlag";
import { safeExternalUrl } from "@/lib/sponsor-links";
import { RulesModule } from "./regulation-module";

type Category = "ADULTO" | "MASTER";
type Tab = "CLASSIFICACAO" | "SIMULADOR" | "ESTATISTICAS" | "ELENCOS" | "REGULAMENTO";

type Team = { category: Category; order: number; name: string; slug: string | null; icon: string | null; players: string[]; shirtImageUrl?: string | null; sponsor?: { name: string; logoUrl: string } | null };
type Game = {
  id: string;
  category: Category;
  round: number;
  order: number;
  stage: { order: number; stageType: string; name: string } | null;
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
  scorers: Array<{ name: string; team: string; icon: string | null; quantity: number }>;
  cards: Array<{
    playerId: string | null;
    teamId: string | null;
    name: string;
    team: string;
    teamIcon: string | null;
    quantity: number;
    type: "AMARELO" | "AZUL" | "VERMELHO";
    matchId: string;
    matchLabel: string;
    round: number;
    stage: Game["stage"];
  }>;
};

type Suspension = { playerId: string; name: string; reason: string; team: string; icon: string | null; nextGame: string; category: Category };
type Props = { teams: Team[]; matches: Game[]; suspensions: Suspension[]; initialRounds: Record<Category, number> };

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "CLASSIFICACAO", label: "Classificação" },
  { id: "SIMULADOR", label: "Simulador" },
  { id: "ESTATISTICAS", label: "Estatísticas" },
  { id: "ELENCOS", label: "Elencos" },
  { id: "REGULAMENTO", label: "Regulamento" },
];

export function CampaoPublicDashboard({ teams, matches, suspensions, initialRounds }: Props) {
  const [category, setCategory] = useState<Category>("ADULTO");
  const [tab, setTab] = useState<Tab>("CLASSIFICACAO");
  const [round, setRound] = useState(() => initialRounds.ADULTO);
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
    setRound(initialRounds[nextCategory]);
  }

  return (
    <div className="grid gap-3 py-1.5 md:py-2">
      <section className="xv-card p-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[.16em] text-[#8B6914]">
          Campeonato Interno XV Campão 2026
        </p>
        <div className="mt-0.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-black">Central do campeonato</h1>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
            <div className="flex shrink-0 gap-1.5" aria-label="Categoria">
              {(["ADULTO", "MASTER"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchCategory(item)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${category === item ? "bg-[#B89020] text-white" : "border border-[#E5E7EB] bg-white text-[#303030]"}`}
                >
                  {item === "ADULTO" ? "Adulto" : "Master"}
                </button>
              ))}
            </div>
            <nav aria-label="Módulos do campeonato" className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${tab === item.id ? "bg-[#1A1A1A] text-white" : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E5E7EB]"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {tab === "CLASSIFICACAO" ? (
        <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.8fr)]">
          <div className="grid content-start gap-3">
            <StandingsTable label={label} teams={categoryTeams} matches={categoryMatches} />
            <ChampionshipHighlights label={label} teams={categoryTeams} matches={categoryMatches} />
          </div>
          <RoundPanel label={label} games={games} round={selectedRound} rounds={rounds} onRoundChange={setRound} />
        </section>
      ) : null}

      {tab === "SIMULADOR" ? <StandingsSimulator label={label} teams={categoryTeams} matches={categoryMatches} /> : null}
      {tab === "ESTATISTICAS" ? <StatisticsAndDiscipline label={label} matches={categoryMatches} suspensions={suspensions} /> : null}
      {tab === "ELENCOS" ? <RosterModule teams={categoryTeams} label={label} /> : null}
      {tab === "REGULAMENTO" ? <RulesModule /> : null}
      {tab === "CLASSIFICACAO" ? <SponsorsShowcase teams={categoryTeams} /> : null}
    </div>
  );
}

function SponsorsShowcase({ teams }: { teams: Team[] }) {
  const sponsoredTeams = teams.filter((team) => team.sponsor && safeExternalUrl(team.sponsor.logoUrl));
  if (!sponsoredTeams.length) return null;
  return <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Apoio aos times</p><h2 className="mt-1 text-2xl font-black">Patrocinadores dos Times</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{sponsoredTeams.map((team) => { const sponsor = team.sponsor!; const logo = safeExternalUrl(sponsor.logoUrl)!; const shirt = safeExternalUrl(team.shirtImageUrl); return <Link key={team.name} href={team.slug ? `/campeonatos/interno-campao-2026/times/${team.slug}` : "#"} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4 no-underline transition hover:border-[#D4B051]"><div className="flex items-center gap-2 font-black text-[#101010]"><CountryFlag icon={team.icon} name={team.name} className="text-xl"/>{team.name}</div>{shirt ? <img src={shirt} alt={`Camisa ${team.name}`} className="mt-3 h-32 w-full rounded-xl border border-[#E5E7EB] bg-white object-contain"/> : null}<p className="mt-3 text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">Patrocínio</p><img src={logo} alt={`Logotipo ${sponsor.name}`} className="mt-2 h-14 w-28 rounded-xl border border-[#E5E7EB] bg-white object-contain p-2"/><p className="mt-2 font-bold text-[#101010]">{sponsor.name}</p></Link>; })}</div></section>;
}

type StandingEntry = { team: Team; points: number; games: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number };
type SimulatedScore = { home?: number; away?: number };
type SimulatedScores = Record<string, SimulatedScore>;

function buildStandings(teams: Team[], matches: Game[], simulatedScores: SimulatedScores = {}) {
  const table = new Map(teams.map((team) => [team.name, { team, points: 0, games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }]));
  for (const match of matches) {
    const simulated = match.status === "FINALIZADO" ? null : simulatedScores[match.id];
    const homeScore = match.status === "FINALIZADO" ? match.homeScore : simulated?.home;
    const awayScore = match.status === "FINALIZADO" ? match.awayScore : simulated?.away;
    if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) continue;
    const home = table.get(match.home); const away = table.get(match.away);
    if (!home || !away) continue;
    home.games += 1; away.games += 1;
    home.goalsFor += homeScore; home.goalsAgainst += awayScore;
    away.goalsFor += awayScore; away.goalsAgainst += homeScore;
    if (homeScore > awayScore) { home.wins += 1; home.points += 3; away.losses += 1; }
    else if (homeScore < awayScore) { away.wins += 1; away.points += 3; home.losses += 1; }
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
  }
  return Array.from(table.values()).sort((left, right) => right.points - left.points || (right.goalsFor - right.goalsAgainst) - (left.goalsFor - left.goalsAgainst) || right.goalsFor - left.goalsFor || left.team.order - right.team.order);
}

function buildScorers(matches: Game[]) {
  const totals = new Map<string, { name: string; team: string; icon: string | null; goals: number }>();
  matches.flatMap((match) => match.scorers).forEach((item) => { const key = `${item.name}:${item.team}`; const current = totals.get(key) || { ...item, goals: 0 }; current.goals += item.quantity; totals.set(key, current); });
  return Array.from(totals.values()).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "pt-BR"));
}

function ChampionshipHighlights({ label, teams, matches }: { label: string; teams: Team[]; matches: Game[] }) {
  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const scorers = useMemo(() => buildScorers(matches), [matches]);
  const teamsWithGames = standings.filter((entry) => entry.games > 0);
  const highestGoals = Math.max(...teamsWithGames.map((entry) => entry.goalsFor), 0);
  const lowestGoalsAgainst = teamsWithGames.length ? Math.min(...teamsWithGames.map((entry) => entry.goalsAgainst)) : 0;
  const bestAttack = teamsWithGames.filter((entry) => entry.goalsFor === highestGoals);
  const bestDefense = teamsWithGames.filter((entry) => entry.goalsAgainst === lowestGoalsAgainst);
  const highestScorerGoals = Math.max(...scorers.map((entry) => entry.goals), 0);
  const topScorers = scorers.filter((entry) => entry.goals === highestScorerGoals);

  return <section className="grid gap-3 sm:grid-cols-3" aria-label={`Destaques da categoria ${label}`}>
    <HighlightCard label="Melhor ataque" value={teamsWithGames.length ? `${highestGoals} gol${highestGoals === 1 ? "" : "s"}` : "Sem jogos"} tone="gold">
      {bestAttack.length ? <TeamLeaders teams={bestAttack} /> : null}
    </HighlightCard>
    <HighlightCard label="Melhor defesa" value={teamsWithGames.length ? `${lowestGoalsAgainst} gol${lowestGoalsAgainst === 1 ? " sofrido" : "s sofridos"}` : "Sem jogos"} tone="blue">
      {bestDefense.length ? <TeamLeaders teams={bestDefense} /> : null}
    </HighlightCard>
    <HighlightCard label="Artilharia" value={topScorers.length ? `${highestScorerGoals} gol${highestScorerGoals === 1 ? "" : "s"}` : "Sem gols"} tone="neutral">
      {topScorers.length ? <div className="grid gap-1.5">{topScorers.map((scorer) => <span key={`${scorer.name}:${scorer.team}`} className="inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-[#303030]"><CountryFlag icon={scorer.icon} name={scorer.team} className="text-lg"/><span className="truncate">{scorer.name}</span><span className="truncate font-medium text-[#6B7280]">· {scorer.team}</span></span>)}</div> : null}
    </HighlightCard>
  </section>;
}

function HighlightCard({ label, value, tone, children }: { label: string; value: string; tone: "gold" | "blue" | "neutral" }) {
  const toneClass = tone === "gold" ? "border-[#E8D193] bg-[#FFFCF2]" : tone === "blue" ? "border-[#C7DAF8] bg-[#F6FAFF]" : "border-[#E5E7EB] bg-white";
  const textClass = "text-[#101010]";
  const detailClass = "text-[#4B5563]";
  return <article className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${toneClass}`}><p className="text-[0.72rem] font-bold uppercase tracking-[.16em] text-[#8B6914]">{label}</p><p className={`mt-2 text-2xl font-black ${textClass}`}>{value}</p><div className={`mt-3 min-h-5 ${detailClass}`}>{children}</div></article>;
}

function TeamLeaders({ teams }: { teams: StandingEntry[] }) { return <div className="grid gap-1.5">{teams.map((entry) => <Link key={entry.team.name} href={entry.team.slug ? `/campeonatos/interno-campao-2026/times/${entry.team.slug}` : "#"} className="inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-[#303030] hover:text-[#8B6914]"><CountryFlag icon={entry.team.icon} name={entry.team.name} className="text-lg"/><span className="truncate">{entry.team.name}</span></Link>)}</div>; }

function StandingsTable({ label, teams, matches, simulatedScores, title = "Tabela", description }: { label: string; teams: Team[]; matches: Game[]; simulatedScores?: SimulatedScores; title?: string; description?: string }) {
  const standings = useMemo(() => buildStandings(teams, matches, simulatedScores), [teams, matches, simulatedScores]);
  return (
    <section className="xv-card overflow-hidden">
      <div className="border-b border-[#E5E7EB] pb-3">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[#6B7280]">{description}</p> : null}
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
                    <CountryFlag icon={team.icon} name={team.name} className="mr-2 w-7 shrink-0" />
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

function StandingsSimulator({ label, teams, matches }: { label: string; teams: Team[]; matches: Game[] }) {
  const [simulatedScores, setSimulatedScores] = useState<SimulatedScores>({});
  const pendingMatches = useMemo(
    () => matches.filter((match) => !["FINALIZADO", "CANCELADO"].includes(match.status)).sort((left, right) => left.round - right.round || left.order - right.order),
    [matches],
  );
  const completedSimulations = Object.values(simulatedScores).filter((score) => Number.isInteger(score.home) && Number.isInteger(score.away)).length;

  function updateScore(matchId: string, side: "home" | "away", value: string) {
    const number = value === "" ? null : Number(value);
    setSimulatedScores((current) => {
      const previous = current[matchId] ?? {};
      const nextScore = { ...previous, [side]: number === null || !Number.isInteger(number) || number < 0 ? undefined : number };
      if (nextScore.home === undefined && nextScore.away === undefined) {
        const next = { ...current };
        delete next[matchId];
        return next;
      }
      return { ...current, [matchId]: nextScore };
    });
  }

  return <section className="grid gap-3"><div className="xv-card py-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p><h2 className="mt-1 text-2xl font-black">Simular classificação</h2><p className="mt-1 text-sm text-[#6B7280]">Informe resultados para os jogos pendentes e acompanhe a projeção. Isso não altera a classificação oficial.</p></div><div className="grid items-start gap-3 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]"><section className="xv-card"><div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-2"><div><h3 className="text-xl font-black">Seus palpites</h3><p className="mt-1 text-sm text-[#6B7280]">{completedSimulations} de {pendingMatches.length} jogo(s) simulados.</p></div>{completedSimulations ? <button type="button" onClick={() => setSimulatedScores({})} className="shrink-0 text-sm font-bold text-[#8B6914] hover:underline">Limpar</button> : null}</div>{pendingMatches.length ? <div className="divide-y divide-[#E5E7EB]">{pendingMatches.map((match) => { const score = simulatedScores[match.id]; return <article key={match.id} className="py-3"><p className="text-xs font-bold text-[#6B7280]">Rodada {match.round} · {formatGameDateTime(match.scheduledAt)}</p><div className="mt-2 grid grid-cols-[minmax(0,1fr)_2.75rem_1.5rem_2.75rem_minmax(0,1fr)] items-center gap-1.5"><span className="truncate text-right text-sm font-bold">{match.home}</span><input type="number" min="0" inputMode="numeric" value={score?.home ?? ""} onChange={(event) => updateScore(match.id, "home", event.target.value)} aria-label={`Placar simulado de ${match.home}`} placeholder="–" className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white text-center font-black"/><span className="text-center font-black text-[#8B6914]">×</span><input type="number" min="0" inputMode="numeric" value={score?.away ?? ""} onChange={(event) => updateScore(match.id, "away", event.target.value)} aria-label={`Placar simulado de ${match.away}`} placeholder="–" className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white text-center font-black"/><span className="truncate text-left text-sm font-bold">{match.away}</span></div></article>; })}</div> : <p className="py-8 text-center text-sm text-[#6B7280]">Não há jogos pendentes nesta categoria.</p>}</section><StandingsTable label={label} teams={teams} matches={matches} simulatedScores={simulatedScores} title="Projeção da tabela" description={completedSimulations ? "Inclui os seus resultados simulados." : "Preencha um placar para começar a projeção."}/></div></section>;
}

function RoundPanel({ label, games, round, rounds, onRoundChange }: { label: string; games: Game[]; round: number; rounds: number[]; onRoundChange: (round: number) => void }) {
  return (
    <section className="xv-card">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Jogos</h2>
        </div>
        <select value={round} onChange={(event) => onRoundChange(Number(event.target.value))} className="rounded-xl border border-[#D4D4D8] bg-white px-3 py-2 text-sm font-bold">
          {rounds.map((item) => <option key={item} value={item}>{item}ª rodada</option>)}
        </select>
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {games.map((game) => <article key={game.id} className="py-5 text-center"><p className="text-sm font-bold text-[#57534E]">{formatGameDateTime(game.scheduledAt)}</p><div className="mt-2 grid grid-cols-[minmax(0,1fr)_2rem_3.75rem_2rem_minmax(0,1fr)] items-center gap-2 text-lg"><span className="truncate text-right font-semibold">{game.homeSlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.homeSlug}`}>{game.home}</Link> : game.home}</span><CountryFlag icon={game.homeIcon} name={game.home} className="text-xl"/><Link href={`/campeonatos/interno-campao-2026/jogos/${game.id}`} className="whitespace-nowrap text-center font-black text-[#8B6914] hover:underline" aria-label={`Ver resultado e súmula de ${game.home} x ${game.away}`}>{game.status === "FINALIZADO" ? `${game.homeScore} × ${game.awayScore}` : "×"}</Link><CountryFlag icon={game.awayIcon} name={game.away} className="text-xl"/><span className="truncate text-left font-semibold">{game.awaySlug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${game.awaySlug}`}>{game.away}</Link> : game.away}</span></div><Link href={`/campeonatos/interno-campao-2026/jogos/${game.id}`} className="mt-2 inline-block text-sm font-bold text-[#8B6914] hover:underline">Ver resultado e súmula</Link></article>)}
      </div>
    </section>
  );
}

function StatisticsAndDiscipline({ label, matches, suspensions }: { label: string; matches: Game[]; suspensions: Suspension[] }) {
  return <section className="grid gap-3"><div className="xv-card py-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p><h2 className="mt-1 text-2xl font-black">Estatísticas e disciplina</h2><p className="mt-1 text-sm text-[#6B7280]">Artilharia e situação disciplinar da categoria em uma única visão.</p></div><div className="grid items-start gap-3 xl:grid-cols-2"><ScorersModule label={label} matches={matches} /><CardsModule label={label} matches={matches} suspensions={suspensions} /></div></section>;
}

function ScorersModule({ label, matches }: { label: string; matches: Game[] }) {
  const scorers = useMemo(() => buildScorers(matches), [matches]);
  return <StatsModule title="Artilharia" description={`Todos os jogadores com gol no ${label}.`} empty="Nenhum gol lançado ainda." rows={scorers.map((item) => ({ label: <span className="inline-flex items-center gap-2"><CountryFlag icon={item.icon} name={item.team} className="text-xl" />{item.name}</span>, value: `⚽ ${item.goals}` }))} />;
}

function CardsModule({ label, matches, suspensions }: { label: string; matches: Game[]; suspensions: Suspension[] }) {
  const category: Category = label === "Adulto" ? "ADULTO" : "MASTER";
  const categorySuspensions = suspensions.filter((item) => item.category === category);
  const players = useMemo(() => {
    type CardType = Game["cards"][number]["type"];
    type GameCards = { label: string; round: number; stage: Game["stage"]; totals: Record<CardType, number> };
    type PlayerCards = { playerId: string | null; name: string; team: string; icon: string | null; totals: Record<CardType, number>; yellowBalance: number; games: Map<string, GameCards> };
    const emptyTotals = (): Record<CardType, number> => ({ AMARELO: 0, AZUL: 0, VERMELHO: 0 });
    const grouped = new Map<string, PlayerCards>();

    for (const item of matches.flatMap((match) => match.cards || [])) {
      if (!item?.name || !item?.type || item.quantity < 1) continue;
      const fallbackKey = `${item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")}:${item.team}`;
      const key = item.playerId && item.teamId ? `profile:${item.teamId}:${item.playerId}` : `legacy:${fallbackKey}`;
      const player = grouped.get(key) || { playerId: item.playerId, name: item.name, team: item.team, icon: item.teamIcon, totals: emptyTotals(), yellowBalance: 0, games: new Map<string, GameCards>() };
      const game = player.games.get(item.matchId) || { label: item.matchLabel, round: item.round, stage: item.stage, totals: emptyTotals() };
      game.totals[item.type] += item.quantity;
      player.games.set(item.matchId, game);
      grouped.set(key, player);
    }

    for (const player of grouped.values()) {
      player.totals = emptyTotals();
      player.yellowBalance = 0;
      let leftClassificationStage = false;
      for (const game of Array.from(player.games.values()).sort((a, b) => (a.stage?.order ?? 0) - (b.stage?.order ?? 0) || a.round - b.round || a.label.localeCompare(b.label, "pt-BR"))) {
        const isClassification = !game.stage || game.stage.stageType === "RODADA";
        // Art. 15: os amarelos da fase classificatória não seguem para as fases finais.
        if (!isClassification && !leftClassificationStage) {
          player.yellowBalance = 0;
          leftClassificationStage = true;
        }
        // Art. 23: vermelho anula amarelo/azul do mesmo jogo; azul anula o amarelo
        // e vale como um amarelo no acumulado.
        if (game.totals.VERMELHO > 0) { game.totals.AMARELO = 0; game.totals.AZUL = 0; }
        else if (game.totals.AZUL > 0) { game.totals.AMARELO = 0; game.totals.AZUL = 1; }
        else if (game.totals.AMARELO > 0) game.totals.AMARELO = 1;
        const yellowForAccumulation = game.totals.AMARELO + game.totals.AZUL;
        player.yellowBalance = (player.yellowBalance + yellowForAccumulation) % 3;
        for (const type of ["AMARELO", "AZUL", "VERMELHO"] as const) player.totals[type] += game.totals[type];
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const totalA = a.totals.AMARELO + a.totals.AZUL + a.totals.VERMELHO;
      const totalB = b.totals.AMARELO + b.totals.AZUL + b.totals.VERMELHO;
      return totalB - totalA || a.name.localeCompare(b.name, "pt-BR");
    });
  }, [matches]);
  const pendingPlayers = players.filter((player) => player.yellowBalance === 2 && !categorySuspensions.some((item) => item.playerId === player.playerId && item.team === player.team));

  return (
    <section className="xv-card">
      <div className="border-b border-[#E5E7EB] pb-3">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p>
        <h2 className="mt-1 text-2xl font-black">Disciplina</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Suspensões, pendurados e histórico de cartões.</p>
      </div>
      {categorySuspensions.length || pendingPlayers.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{categorySuspensions.length ? <div className="rounded-2xl border border-[#F0C6C2] bg-[#FFF5F4] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#B42318]">Suspensos na próxima partida</p><ul className="mt-2 grid gap-2 text-sm">{categorySuspensions.map((item) => <li key={`${item.playerId}:${item.team}`}><span className="inline-flex items-center gap-1.5"><CountryFlag icon={item.icon} name={item.team} className="text-lg"/><strong>{item.name}</strong> · {item.team} · {item.reason}</span><span className="block text-[#6B7280]">{item.nextGame}</span></li>)}</ul></div> : null}{pendingPlayers.length ? <div className="rounded-2xl border border-[#F2D38A] bg-[#FFFBEB] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#855D00]">Pendurado(s) para a próxima rodada</p><p className="mt-1 text-sm text-[#6B7280]">Com 2 cartões no saldo vigente; o próximo amarelo ou azul gera suspensão automática.</p><ul className="mt-2 grid gap-2 text-sm">{pendingPlayers.map((player) => <li key={`${player.playerId}:${player.team}`} className="flex flex-wrap items-center gap-1.5"><CountryFlag icon={player.icon} name={player.team} className="text-lg"/><strong>{player.name}</strong> · {player.team} <YellowCard count={2} compact /></li>)}</ul></div> : null}</div> : null}
      {players.length ? (
        <div className="mt-3 grid gap-2">
          {players.map((player) => {
            const suspension = categorySuspensions.find((item) => item.playerId === player.playerId && item.team === player.team);
            return (
            <article key={`${player.name}:${player.team}`} className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="flex items-center gap-1.5 font-black text-[#303030]"><CountryFlag icon={player.icon} name={player.team} className="text-lg"/>{player.name}</h3><p className="text-sm text-[#6B7280]">{player.team}</p><p className={`mt-1 flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${player.yellowBalance === 2 ? "bg-[#FFF0B8] text-[#855D00]" : "bg-[#F4F4F5] text-[#52525B]"}`}>Saldo vigente: <YellowCard count={player.yellowBalance} compact /></p>{suspension ? <p className="mt-1 w-fit rounded-full bg-[#FFF0F0] px-2 py-1 text-xs font-bold text-[#B42318]">Suspenso · {suspension.reason} · {suspension.nextGame}</p> : null}</div>
                <CardTotals totals={player.totals} />
              </div>
              <ul className="mt-2 divide-y divide-[#E5E7EB] border-t border-[#E5E7EB]">
                {Array.from(player.games.values()).map((game) => (
                  <li key={game.label} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-semibold text-[#4B5563]">{game.label}</span>
                    <CardTotals totals={game.totals} compact />
                  </li>
                ))}
              </ul>
            </article>
            );
          })}
        </div>
      ) : <p className="py-10 text-center text-[#6B7280]">Nenhum cartão lançado ainda.</p>}
    </section>
  );
}

function CardTotals({ totals, compact = false }: { totals: { AMARELO: number; AZUL: number; VERMELHO: number }; compact?: boolean }) {
  const entries = [
    ["AMARELO", "bg-[#FFF7D6] text-[#855D00]"],
    ["AZUL", "bg-[#E9F1FF] text-[#1952A6]"],
    ["VERMELHO", "bg-[#FFF0F0] text-[#B42318]"],
  ] as const;
  return <span className="flex items-center gap-1.5" aria-label="Cartões"><span className="sr-only">Cartões: </span>{entries.filter(([type]) => totals[type] > 0).map(([type, color]) => <span key={type} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-bold ${compact ? "text-xs" : "text-sm"} ${color}`}><span aria-hidden className={`inline-block h-4 w-3 rounded-sm border border-black/10 ${type === "AMARELO" ? "bg-[#FACC15]" : type === "AZUL" ? "bg-[#60A5FA]" : "bg-[#EF4444]"}`}/>{totals[type]}</span>)}</span>;
}

function YellowCard({ count, compact = false }: { count: number; compact?: boolean }) {
  return <span className={`inline-flex items-center gap-1 ${compact ? "text-xs" : "text-sm"}`}><span aria-hidden className="inline-block h-3.5 w-2.5 rounded-sm border border-[#D9A900] bg-[#FACC15]"/>{count}</span>;
}

function StatsModule({ title, description, empty, rows }: { title: string; description: string; empty: string; rows: Array<{ label: ReactNode; value: string }> }) {
  return <section className="xv-card"><div className="border-b border-[#E5E7EB] pb-2"><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-[#6B7280]">{description}</p></div>{rows.length ? <div className="mt-2 divide-y divide-[#E5E7EB]">{rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4 px-2 py-2.5"><span className="font-semibold text-[#303030]">{row.label}</span><strong>{row.value}</strong></div>)}</div> : <p className="py-8 text-center text-[#6B7280]">{empty}</p>}</section>;
}

function RosterModule({ teams, label }: { teams: Team[]; label: string }) {
  return <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Categoria {label}</p><h2 className="mt-1 text-2xl font-black">Elencos</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team) => <article key={team.name} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"><h3 className="flex items-center gap-2 font-black"><CountryFlag icon={team.icon} name={team.name} className="text-xl"/>{team.slug ? <Link className="hover:text-[#8B6914] hover:underline" href={`/campeonatos/interno-campao-2026/times/${team.slug}`}>{team.name}</Link> : team.name}</h3><ol className="mt-3 grid gap-1.5 text-sm text-[#374151]">{team.players.map((player, index) => <li key={`${team.name}-${player}`}><span className="mr-2 text-[#8B6914]">{index + 1}.</span>{player}</li>)}</ol></article>)}</div></section>;
}

function CountryFlag({ icon, className = "" }: { icon: string | null; name: string; className?: string }) {
  return <TeamFlag icon={icon} className={className} />;
}

function formatGameDateTime(value: string | null) {
  if (!value) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
