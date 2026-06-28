import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/PageContainer";
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
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          icon: true,
        },
      },
      participations: {
        orderBy: [{ team: { name: "asc" } }, { player: { fullName: "asc" } }],
        select: {
          id: true,
          teamId: true,
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
    },
  });

  if (!match) {
    notFound();
  }

  const goalRows = match.participations.filter((participation) => participation.goals > 0);
  const cardRows = match.participations.filter(
    (participation) => participation.yellowCards > 0 || participation.redCards > 0,
  );
  const homePlayers = match.participations.filter(
    (participation) => participation.teamId === match.homeTeam.id,
  );
  const awayPlayers = match.participations.filter(
    (participation) => participation.teamId === match.awayTeam.id,
  );

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        <section className="overflow-hidden rounded-[24px] bg-[#171717] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8">
          <Link
            href={getChampionshipBasePath(match.championship.slug)}
            className="inline-flex min-h-10 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Voltar ao campeonato
          </Link>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
            <TeamHeader team={match.homeTeam} align="right" />
            <div className="rounded-[20px] bg-white px-5 py-4 text-center text-[#101010]">
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                Placar final
              </div>
              <div className="mt-1 text-[2.5rem] font-black leading-none">
                {match.homeScore ?? "-"} x {match.awayScore ?? "-"}
              </div>
            </div>
            <TeamHeader team={match.awayTeam} align="left" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="xv-card">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailBlock title="Gols">
                {goalRows.length > 0 ? (
                  goalRows.map((participation) => (
                    <StatLine
                      key={`goal-${participation.id}`}
                      label={participation.player.fullName}
                      value={"⚽".repeat(participation.goals)}
                    />
                  ))
                ) : (
                  <EmptyText>Sem gols registrados.</EmptyText>
                )}
              </DetailBlock>

              <DetailBlock title="Cartões">
                {cardRows.length > 0 ? (
                  cardRows.map((participation) => (
                    <StatLine
                      key={`card-${participation.id}`}
                      label={participation.player.fullName}
                      value={`${"🟨".repeat(participation.yellowCards)}${"🟥".repeat(
                        participation.redCards,
                      )}`}
                    />
                  ))
                ) : (
                  <EmptyText>Sem cartões registrados.</EmptyText>
                )}
              </DetailBlock>
            </div>
          </article>

          <aside className="xv-card">
            <h2 className="text-lg font-black text-[#101010]">Dados do jogo</h2>
            <div className="mt-4 grid gap-3 text-sm text-[#4B5563]">
              <InfoRow label="Árbitro" value={match.referee || "-"} />
              <InfoRow label="Data" value={formatDate(match.scheduledAt)} />
              <InfoRow label="Horário" value={formatTime(match.scheduledAt)} />
              <InfoRow label="Rodada" value={String(match.round)} />
              <InfoRow label="Fase" value={match.stage?.name || "-"} />
              <InfoRow label="Folga" value={getByeFromNotes(match.notes) || "-"} />
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <PlayersCard team={match.homeTeam} players={homePlayers} />
          <PlayersCard team={match.awayTeam} players={awayPlayers} />
        </section>
      </PageContainer>
    </main>
  );
}

function TeamHeader({
  team,
  align,
}: {
  team: { name: string; shortName: string | null; icon: string | null };
  align: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "md:justify-end" : ""}`}>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-3xl shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
        {team.icon || null}
      </span>
      <div className={align === "right" ? "md:text-right" : ""}>
        <div className="text-2xl font-black">{team.shortName || team.name}</div>
        {shouldShowSecondaryTeamName(team.shortName || team.name, team.name) ? (
          <div className="text-sm text-white/70">{team.name}</div>
        ) : null}
      </div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4">
      <h2 className="text-lg font-black text-[#101010]">{title}</h2>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="font-semibold text-[#101010]">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function PlayersCard({
  team,
  players,
}: {
  team: { name: string; shortName: string | null; icon: string | null };
  players: Array<{ id: string; bionic: boolean; player: { fullName: string } }>;
}) {
  return (
    <article className="xv-card">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E7EB] bg-white text-2xl">
          {team.icon || null}
        </span>
        <h2 className="text-lg font-black text-[#101010]">{team.shortName || team.name}</h2>
      </div>
      <div className="mt-4 grid gap-2">
        {players.map((participation) => (
          <div
            key={participation.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#FCFCFC] px-3 py-2 text-sm"
          >
            <span className="font-semibold text-[#101010]">
              {participation.player.fullName}
            </span>
            {participation.bionic ? (
              <span className="rounded-full bg-[#EEF2FF] px-2 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#4338CA]">
                Bionic
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-2">
      <span className="font-bold text-[#101010]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[#6B7280]">{children}</p>;
}

function formatTeamName(team: { name: string; shortName: string | null; icon: string | null }) {
  const name = team.shortName || team.name;
  return team.icon ? `${team.icon} ${name}` : name;
}

function shouldShowSecondaryTeamName(primary: string, secondary: string) {
  return normalizeTeamLabel(primary) !== normalizeTeamLabel(secondary);
}

function normalizeTeamLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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
