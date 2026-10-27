import Link from "next/link";
import { TeamFlag } from "@/components/championship/TeamFlag";
import { TeamSponsorPresentation } from "@/components/championship/TeamSponsorPresentation";
import { getChampionshipTeamPublicPageData } from "@/lib/championships";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { CardsModule, ScorersModule, type Game, type Suspension } from "./public-dashboard";

type Data = NonNullable<Awaited<ReturnType<typeof getChampionshipTeamPublicPageData>>>;

export function CampaoTeamPage({ championship, now }: { championship: Data; now: number }) {
  const team = championship.teamEntry.team;
  const name = team.shortName || team.name;
  const category = championship.teamEntry.groupLabel === "MASTER" ? "MASTER" : "ADULTO";
  const label = category === "MASTER" ? "Master" : "Adulto";
  const standing = championship.currentStanding;
  const rosterNames = new Map(team.players.flatMap(({ registration }) => registration.athleteProfileId ? [[registration.athleteProfileId, getPreferredPlayerName(registration.nickname, registration.fullName)] as const] : []));
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
  const profileByName = new Map(team.players.flatMap(({ registration }) => registration.athleteProfileId ? [registration.fullName, registration.nickname].filter((value): value is string => !!value?.trim()).map((value) => [normalize(value), registration.athleteProfileId!] as const) : []));
  const games: Game[] = championship.matches.filter((match) => match.homeTeam.id === team.id || match.awayTeam.id === team.id).map((match) => {
    const home = match.homeTeam.shortName || match.homeTeam.name;
    const away = match.awayTeam.shortName || match.awayTeam.name;
    const matchLabel = `Rodada ${match.round} · ${home} ${match.homeScore ?? "–"} × ${match.awayScore ?? "–"} ${away}`;
    const cards: Game["cards"] = match.participations.filter((item) => item.teamId === team.id).flatMap((item) => ([
      { playerId: item.player.id, name: rosterNames.get(item.player.id) ?? getPreferredPlayerName(item.player.nickname, item.player.fullName), teamId: team.id, team: name, teamIcon: team.icon, quantity: item.yellowCards, type: "AMARELO" as const, matchId: match.id, matchLabel, round: match.round, stage: match.stage },
      { playerId: item.player.id, name: rosterNames.get(item.player.id) ?? getPreferredPlayerName(item.player.nickname, item.player.fullName), teamId: team.id, team: name, teamIcon: team.icon, quantity: item.redCards, type: "VERMELHO" as const, matchId: match.id, matchLabel, round: match.round, stage: match.stage },
    ].filter((item) => item.quantity > 0)));
    for (const event of match.events.filter((item) => item.teamId === team.id)) {
      const playerId = event.playerId ?? profileByName.get(normalize(event.player)) ?? null;
      cards.push({ playerId, name: playerId ? rosterNames.get(playerId) ?? event.player : event.player, teamId: team.id, team: name, teamIcon: team.icon, quantity: event.quantity, type: "AZUL", matchId: match.id, matchLabel, round: match.round, stage: match.stage });
    }
    return { id: match.id, category, round: match.round, order: match.roundNumber ?? 0, stage: match.stage, scheduledAt: match.scheduledAt?.toISOString() ?? null, status: match.status, homeScore: match.homeScore, awayScore: match.awayScore, home, homeSlug: match.homeTeam.slug, homeIcon: match.homeTeam.icon, away, awaySlug: match.awayTeam.slug, awayIcon: match.awayTeam.icon, scorers: match.participations.filter((item) => item.teamId === team.id && item.goals > 0).map((item) => ({ name: getPreferredPlayerName(item.player.nickname, item.player.fullName), team: name, icon: team.icon, quantity: item.goals })), cards };
  });
  const next = championship.teamMatches.find((match) => match.scheduledAt && match.scheduledAt.getTime() >= now && match.status !== "FINALIZADO" && match.status !== "CANCELADO");
  const suspensions: Suspension[] = next ? [...new Map(championship.suspensions.filter((item) => item.teamId === team.id).map((item) => [item.playerId, { playerId: item.playerId, name: getPreferredPlayerName(item.player.nickname, item.player.fullName), reason: item.reason, team: name, icon: team.icon, category, nextGame: `Rodada ${next.round} · ${name} × ${next.opponent.shortName || next.opponent.name} · ${formatDate(next.scheduledAt)}` }] as const)).values()] : [];
  const stats = [["Posição", standing?.rank ? `${standing.rank}º` : "–"], ["Pontos", standing?.points ?? 0], ["Jogos", standing?.gamesPlayed ?? 0], ["Vitórias", standing?.wins ?? 0], ["Empates", standing?.draws ?? 0], ["Derrotas", standing?.losses ?? 0], ["Gols feitos", standing?.goalsFor ?? 0], ["Gols sofridos", standing?.goalsAgainst ?? 0], ["Saldo", standing?.goalDifference ?? 0]];
  const orderedMatches = [...championship.teamMatches].sort((a, b) => {
    const futureA = a.status !== "FINALIZADO" && a.status !== "CANCELADO" && !!a.scheduledAt && a.scheduledAt.getTime() >= now;
    const futureB = b.status !== "FINALIZADO" && b.status !== "CANCELADO" && !!b.scheduledAt && b.scheduledAt.getTime() >= now;
    if (futureA !== futureB) return futureA ? -1 : 1;
    return futureA ? (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0) : (b.scheduledAt?.getTime() ?? 0) - (a.scheduledAt?.getTime() ?? 0);
  });

  return <main className="xv-page-shell-soft"><div className="xv-page-container grid gap-3 py-3">
    <header className="xv-card p-4"><Link href="/campeonatos/interno-campao-2026" className="text-sm font-bold text-[#8B6914] hover:underline">← Voltar ao campeonato</Link><div className="mt-3 flex flex-wrap items-center gap-3"><TeamFlag icon={team.icon} className="w-10" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Campão 2026 · {label}</p><h1 className="text-2xl font-black md:text-3xl">{name}</h1></div></div></header>
    <section className="xv-card p-4" aria-label="Campanha do time"><h2 className="text-lg font-black">Campanha</h2><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">{stats.map(([title, value]) => <div key={title} className="rounded-xl bg-[#F8F7F4] px-2 py-2 text-center"><div className="text-xs font-semibold text-[#6B7280]">{title}</div><div className="mt-1 text-lg font-black">{value}</div></div>)}</div></section>
    <div className="grid gap-3 xl:grid-cols-2"><section id="jogos" className="xv-card xl:h-full"><div className="border-b border-[#E5E7EB] pb-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Agenda e resultados</p><h2 className="mt-1 text-2xl font-black">Jogos do time</h2></div>{orderedMatches.length ? <div className="divide-y divide-[#E5E7EB]">{orderedMatches.map((match) => { const home = match.isHome ? team : match.opponent; const away = match.isHome ? match.opponent : team; const homeScore = match.isHome ? match.teamScore : match.opponentScore; const awayScore = match.isHome ? match.opponentScore : match.teamScore; return <article key={match.id} className="py-4 text-center"><p className="text-xs font-bold text-[#6B7280]">{match.id === next?.id ? "PRÓXIMO JOGO · " : ""}Rodada {match.round} · {formatDate(match.scheduledAt)}</p><div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"><span className="flex min-w-0 items-center justify-end gap-1.5 text-sm font-bold"><span className="truncate">{home.shortName || home.name}</span><TeamFlag icon={home.icon} className="w-6 shrink-0" /></span><strong className="whitespace-nowrap text-lg text-[#8B6914]">{match.status === "FINALIZADO" && homeScore !== null && awayScore !== null ? `${homeScore} × ${awayScore}` : "×"}</strong><span className="flex min-w-0 items-center gap-1.5 text-sm font-bold"><TeamFlag icon={away.icon} className="w-6 shrink-0" /><span className="truncate">{away.shortName || away.name}</span></span></div><Link href={`/campeonatos/interno-campao-2026/jogos/${match.id}`} className="mt-2 inline-block text-sm font-bold text-[#8B6914] hover:underline">Ver resultado e súmula</Link></article>; })}</div> : <p className="py-5 text-sm text-[#6B7280]">Ainda não há jogos cadastrados.</p>}</section>
      <div className="grid content-start gap-3 xl:content-stretch xl:grid-rows-[auto_1fr]"><ScorersModule label={label} matches={games} teamName={name} /><CardsModule label={label} matches={games} suspensions={suspensions} /></div>
    </div>
    <section id="elenco" className="xv-card"><div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3"><h2 className="text-2xl font-black">Elenco</h2><span className="text-sm font-bold text-[#6B7280]">{team.players.length} jogadores</span></div>{team.players.length ? <ul className="grid divide-y divide-[#E5E7EB] sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">{team.players.map((player) => <li key={player.id} className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] py-3"><span className="min-w-0 font-bold">{getPreferredPlayerName(player.registration.nickname, player.registration.fullName)}</span><span className="shrink-0 text-sm text-[#6B7280]">{positionLabel(player.registration.preferredPosition)}</span></li>)}</ul> : <p className="py-5 text-sm text-[#6B7280]">Elenco ainda não disponível.</p>}</section>
    <TeamSponsorPresentation sponsor={championship.teamEntry.sponsors[0]?.sponsor} shirtImageUrl={championship.teamEntry.shirtImageUrl} compact />
  </div></main>;
}

function formatDate(date: Date | null) { return date ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date) : "Data a definir"; }
function positionLabel(position: string) { return ({ GOLEIRO: "Goleiro", LATERAL: "Lateral", ZAGUEIRO: "Zagueiro", VOLANTE: "Volante", MEIA: "Meia", ATACANTE: "Atacante" } as Record<string, string>)[position] ?? position; }
