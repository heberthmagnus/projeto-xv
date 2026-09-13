import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/PageContainer";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";
import { getChampionshipBasePath } from "@/lib/routes";

type Params = Promise<{
  slug: string;
  matchId: string;
}>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, matchId } = await params;
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      championship: { slug },
    },
    select: {
      homeTeam: { select: { name: true, shortName: true, icon: true } },
      awayTeam: { select: { name: true, shortName: true, icon: true } },
    },
  });

  if (!match) {
    return { title: "Jogo não encontrado | Clube XV" };
  }

  return {
    title: `${formatTeamName(match.homeTeam)} x ${formatTeamName(match.awayTeam)} | Clube XV`,
  };
}

export default async function MatchDetailsPage({ params }: { params: Params }) {
  await connection();

  const { slug, matchId } = await params;
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      championship: { slug },
    },
    select: {
      id: true,
      round: true,
      roundNumber: true,
      scheduledAt: true,
      homeScore: true,
      awayScore: true,
      referee: true,
      notes: true,
      matchReport: true,
      championship: {
        select: {
          name: true,
          slug: true,
        },
      },
      stage: {
        select: {
          name: true,
          stageType: true,
        },
      },
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          icon: true,
          players: {
            where: { championship: { slug } },
            orderBy: { rosterOrder: "asc" },
            select: { registration: { select: { athleteProfileId: true, fullName: true, nickname: true } } },
          },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          icon: true,
          players: {
            where: { championship: { slug } },
            orderBy: { rosterOrder: "asc" },
            select: { registration: { select: { athleteProfileId: true, fullName: true, nickname: true } } },
          },
        },
      },
      participations: {
        orderBy: [{ team: { name: "asc" } }, { player: { fullName: "asc" } }],
        select: {
          id: true,
          teamId: true,
          playerId: true,
          goals: true,
          yellowCards: true,
          redCards: true,
          bionic: true,
          player: {
            select: {
              fullName: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              icon: true,
            },
          },
        },
      },
      events: {
        where: {
          type: "CARTAO_AZUL",
        },
        orderBy: [{ player: "asc" }],
        select: {
          id: true,
          player: true,
          playerId: true,
          quantity: true,
          teamId: true,
          type: true,
        },
      },
    },
  });

  if (!match) {
    notFound();
  }

  const blueCardRows = match.events.filter((event) => event.quantity > 0);

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        <Link href={getChampionshipBasePath(match.championship.slug)} className="inline-flex min-h-10 items-center rounded-full border border-[#D4D4D8] bg-white px-4 text-sm font-bold text-[#303030] transition hover:border-[#B89020] hover:text-[#8B6914]">← Voltar ao campeonato</Link>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)]">
          <TeamResultCard team={match.homeTeam} participations={match.participations.filter((item) => item.teamId === match.homeTeam.id)} blueCards={blueCardRows.filter((item) => item.teamId === match.homeTeam.id)} />

          <aside className="xv-card text-center">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <TeamScoreLabel team={match.homeTeam} align="right" />
              <div><p className="text-[0.65rem] font-bold uppercase tracking-[.14em] text-[#8B6914]">Placar</p><p className="mt-1 whitespace-nowrap text-3xl font-black tracking-tight text-[#101010]">{match.homeScore ?? "-"} <span className="text-[#A3A3A3]">×</span> {match.awayScore ?? "-"}</p></div>
              <TeamScoreLabel team={match.awayTeam} align="left" />
            </div>
            <div className="mt-5 border-t border-[#E5E7EB] pt-5 text-left">
            <h2 className="text-lg font-black text-[#101010]">Dados do jogo</h2>
            <div className="mt-4 grid gap-3 text-sm text-[#4B5563]">
              <InfoRow label="Árbitro" value={match.referee || "-"} />
              <InfoRow label="Data" value={formatDate(match.scheduledAt)} />
              <InfoRow label="Horário" value={formatTime(match.scheduledAt)} />
              <InfoRow label="Rodada" value={String(match.round)} />
              <InfoRow label="Fase" value={match.stage?.name || "-"} />
              <InfoRow label="Folga" value={getByeFromNotes(match.notes) || "-"} />
            </div>
            </div>
          </aside>

          <TeamResultCard team={match.awayTeam} participations={match.participations.filter((item) => item.teamId === match.awayTeam.id)} blueCards={blueCardRows.filter((item) => item.teamId === match.awayTeam.id)} />
        </section>

        <section className="xv-card">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Documento da partida</p>
          <h2 className="mt-1 text-2xl font-black">Súmula do jogo</h2>
          {match.matchReport ? (
            <p className="mt-4 whitespace-pre-wrap leading-7 text-[#374151]">{match.matchReport}</p>
          ) : (
            <p className="mt-4 text-[#6B7280]">A súmula desta partida ainda não foi publicada.</p>
          )}
        </section>
      </PageContainer>
    </main>
  );
}

function TeamResultCard({
  team,
  participations,
  blueCards,
}: {
  team: TeamWithRoster;
  participations: Array<{ playerId: string; goals: number; yellowCards: number; redCards: number }>;
  blueCards: Array<{ playerId: string | null; quantity: number }>;
}) {
  const participationByPlayer = new Map(participations.map((item) => [item.playerId, item]));
  const blueCardsByPlayer = new Map(blueCards.filter((item) => item.playerId).map((item) => [item.playerId!, item.quantity]));
  return (
    <article className="xv-card p-4">
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-[#E5E7EB] bg-white text-lg">{team.icon || null}</span>
        <h2 className="text-lg font-black text-[#101010]">{team.shortName || team.name}</h2>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[370px] w-full text-sm">
          <thead><tr className="border-b border-[#D4D4D8] text-left text-[0.65rem] font-black uppercase tracking-wide text-[#6B7280]"><th className="w-7 py-2">#</th><th className="py-2">Jogadores</th><th className="w-10 py-2 text-center" title="Gols">⚽</th><th className="w-8 py-2 text-center" title="Cartões amarelos">🟨</th><th className="w-8 py-2 text-center" title="Cartões azuis">🟦</th><th className="w-8 py-2 text-center" title="Cartões vermelhos">🟥</th></tr></thead>
          <tbody>{team.players.map((player, index) => {
          const stats = player.registration.athleteProfileId ? participationByPlayer.get(player.registration.athleteProfileId) : undefined;
          const blue = player.registration.athleteProfileId ? blueCardsByPlayer.get(player.registration.athleteProfileId) ?? 0 : 0;
          const name = getPreferredPlayerName(player.registration.nickname, player.registration.fullName);
          return <tr key={name} className="border-b border-[#E5E7EB] last:border-0"><td className="py-2 text-[#6B7280]">{index + 1}</td><td className="py-2 pr-2 font-semibold text-[#101010]">{name}</td><td className="py-2 text-center font-black text-[#101010]">{stats?.goals ?? 0}</td><CardCell color="yellow" count={stats?.yellowCards ?? 0}/><CardCell color="blue" count={blue}/><CardCell color="red" count={stats?.redCards ?? 0}/></tr>;
        })}</tbody>
        </table>
      </div>
    </article>
  );
}

function CardCell({ color, count }: { color: "yellow" | "blue" | "red"; count: number }) {
  const colors = { yellow: "bg-[#FACC15]", blue: "bg-[#2563EB]", red: "bg-[#EF4444]" };
  const label = { yellow: "amarelo", blue: "azul", red: "vermelho" };
  return <td className="py-2 text-center"><i aria-label={count ? `${count} cartão(ões) ${label[color]}` : `Nenhum cartão ${label[color]}`} className={`inline-block h-4 w-3 rounded-sm shadow-sm ${count ? colors[color] : "bg-[#C7C7C7]"}`} /></td>;
}

function TeamScoreLabel({
  team,
  align,
}: {
  team: { name: string; shortName: string | null; icon: string | null };
  align: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
      <span className={`flex items-center gap-1.5 text-sm font-black text-[#101010] ${align === "right" ? "justify-end" : ""}`}><span className="text-xl">{team.icon || null}</span><span className="truncate">{team.shortName || team.name}</span></span>
    </div>
  );
}

type TeamWithRoster = {
  name: string;
  shortName: string | null;
  icon: string | null;
  players: Array<{ registration: { athleteProfileId: string | null; fullName: string; nickname: string | null } }>;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-2">
      <span className="font-bold text-[#101010]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatTeamName(team: { name: string; shortName: string | null; icon: string | null }) {
  const name = team.shortName || team.name;
  return team.icon ? `${team.icon} ${name}` : name;
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTime(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getByeFromNotes(notes: string | null) {
  const match = notes?.match(/Folga:\s*([^.;]+)/i);
  return match?.[1]?.trim() || null;
}
