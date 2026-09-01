import { MatchEventType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { addMatchEvent, deleteMatchEvent, registerMatchParticipation, saveMatchResult, updateMatchEvent } from "./actions";
import { TeamPlayerSelect } from "./team-player-select";

const eventTypes = [
  [MatchEventType.GOL, "Gol"],
  [MatchEventType.CARTAO_AMARELO, "Cartão amarelo"],
  [MatchEventType.CARTAO_AZUL, "Cartão azul"],
  [MatchEventType.CARTAO_VERMELHO, "Cartão vermelho"],
] as const;

export default async function JogosInternoAdminPage() {
  await requireAdmin();
  const championship = await ensureInternoCampao2026Championship();
  const [championshipTeams, matches] = await Promise.all([
    prisma.championshipTeam.findMany({ where: { championshipId: championship.id }, select: { teamId: true, groupLabel: true } }),
    prisma.match.findMany({
      where: { championshipId: championship.id },
      orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
      include: {
        events: { orderBy: { id: "asc" } },
        homeTeam: { include: { players: { where: { championshipId: championship.id }, include: { registration: true }, orderBy: { registration: { fullName: "asc" } } } } },
        awayTeam: { include: { players: { where: { championshipId: championship.id }, include: { registration: true }, orderBy: { registration: { fullName: "asc" } } } } },
      },
    }),
  ]);
  const categoryByTeamId = new Map(championshipTeams.map((team) => [team.teamId, team.groupLabel === "MASTER" ? "MASTER" : "ADULTO"] as const));

  return <main className="xv-page-shell"><div className="xv-page-container">
    <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#B89020]">Campeonato Interno 2026</p><h1 className="mt-1 text-2xl font-black">Lançar resultados</h1><p className="mt-2 text-sm text-[#6B7280]">Placar, participações, gols e cartões para Adulto e Master, em todas as rodadas.</p></section>
    <div className="mt-5 grid gap-4">{matches.map((match) => {
      const category = categoryByTeamId.get(match.homeTeamId) === "MASTER" ? "Master" : "Adulto";
      const players = [...match.homeTeam.players.map((player) => ({ team: match.homeTeam, player })), ...match.awayTeam.players.map((player) => ({ team: match.awayTeam, player }))];
      const playerOptions = players.map(({ team, player }) => ({ id: player.id, teamId: team.id, teamName: team.shortName || team.name, name: player.registration.nickname || player.registration.fullName }));
      return <section key={match.id} className="xv-card">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">{category} · Rodada {match.round}</p><h2 className="text-xl font-black">{match.homeTeam.shortName || match.homeTeam.name} x {match.awayTeam.shortName || match.awayTeam.name}</h2></div><span className="rounded-full bg-[#F4F4F5] px-3 py-1 text-sm font-bold">{match.status}</span></div>
        <form action={saveMatchResult} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="matchId" value={match.id}/><label className="grid gap-1 text-sm font-bold">{match.homeTeam.shortName || match.homeTeam.name}<input name="homeScore" type="number" min="0" defaultValue={match.homeScore ?? ""} className="w-20 rounded-lg border p-2"/></label><label className="grid gap-1 text-sm font-bold">{match.awayTeam.shortName || match.awayTeam.name}<input name="awayScore" type="number" min="0" defaultValue={match.awayScore ?? ""} className="w-20 rounded-lg border p-2"/></label><button className="rounded-lg bg-[#B89020] px-4 py-2 font-bold text-white">Salvar placar</button></form>
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2">
          <form action={registerMatchParticipation} className="grid gap-2"><input type="hidden" name="matchId" value={match.id}/><p className="text-sm font-bold">Participação (jogos feitos)</p><TeamPlayerSelect players={playerOptions}/><button className="rounded-lg border border-[#B89020] px-4 py-2 font-bold text-[#8B6914]">Registrar participação</button></form>
          <form action={addMatchEvent} className="grid gap-2"><input type="hidden" name="matchId" value={match.id}/><p className="text-sm font-bold">Novo gol ou cartão</p><TeamPlayerSelect players={playerOptions}/><EventFields/><button className="rounded-lg border border-[#B89020] px-4 py-2 font-bold text-[#8B6914]">Lançar evento</button></form>
        </div>
        {match.events.length ? <div className="mt-4 border-t pt-4"><h3 className="text-sm font-black">Lançamentos já feitos</h3><div className="mt-2 grid gap-2">{match.events.map((event) => <div key={event.id} className="rounded-lg border bg-[#FAFAFA] p-3"><form action={updateMatchEvent} className="grid gap-2"><input type="hidden" name="eventId" value={event.id}/><input type="hidden" name="matchId" value={match.id}/><TeamPlayerSelect players={playerOptions} defaultPlayerId={players.find((item) => item.player.registration.athleteProfileId === event.playerId && item.team.id === event.teamId)?.player.id}/><div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_90px_auto]"><select name="type" defaultValue={event.type} className="rounded-lg border p-2">{eventTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input name="quantity" type="number" min="1" defaultValue={event.quantity} className="rounded-lg border p-2"/><button className="rounded-lg bg-[#1A1A1A] px-4 py-2 font-bold text-white">Corrigir</button></div></form><div className="mt-2 flex items-center justify-between gap-2"><p className="text-sm text-[#52525B]">Atual: {event.player} · {eventTypes.find(([value]) => value === event.type)?.[1]} ({event.quantity})</p><form action={deleteMatchEvent}><input type="hidden" name="eventId" value={event.id}/><button className="text-sm font-bold text-[#B42318]">Excluir</button></form></div></div>)}</div></div> : null}
      </section>;
    })}</div>
  </div></main>;
}

function EventFields() {
  return <div className="grid grid-cols-[1fr_80px] gap-2"><select name="type" className="rounded-lg border p-2">{eventTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input name="quantity" type="number" min="1" defaultValue="1" className="rounded-lg border p-2"/></div>;
}
