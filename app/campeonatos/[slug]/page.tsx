import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ChampionshipFormat, ChampionshipRegistrationMode, ChampionshipStatus, MatchStatus, StandingMovement } from "@prisma/client";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { PageContainer } from "@/components/ui/PageContainer";
import { getChampionshipPublicPageDataBySlug } from "@/lib/championships";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import {
  CALENDARIO_XV_PATH,
  getChampionshipRegistrationPath,
  getChampionshipTeamBasePath,
} from "@/lib/routes";
import { MatchRoundCalendar } from "./match-round-calendar";

type Params = Promise<{
  slug: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: championship } = await executePrismaWithFallback(
    () => getChampionshipPublicPageDataBySlug(slug),
    null,
    `campeonatos:${slug}:metadata`,
  );

  if (!championship) {
    return {
      title: "Campeonato não encontrado | Clube Quinze Veranistas",
    };
  }

  return {
    title: `${championship.name} | Clube Quinze Veranistas`,
    description:
      championship.description ||
      `Acompanhe classificação, jogos e novidades de ${championship.name}.`,
  };
}

export default async function ChampionshipPublicPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{
    view?: string;
  }>;
}) {
  await connection();

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const { data: championship, databaseUnavailable } = await executePrismaWithFallback(
    () => getChampionshipPublicPageDataBySlug(slug),
    null,
    `campeonatos:${slug}:public-page`,
  );

  if (databaseUnavailable) {
    return (
      <main className="xv-page-shell-soft">
        <PageContainer>
          <DatabaseUnavailableNotice description="A página pública do campeonato continua no ar, mas os dados ao vivo não puderam ser carregados agora." />
        </PageContainer>
      </main>
    );
  }

  if (!championship) {
    notFound();
  }

  const registrationPath = getChampionshipRegistrationPath(championship.slug);
  const showRegistrationAction =
    championship.registrationMode === "INDIVIDUAL" ||
    championship.registrationMode === "POR_EQUIPES";
  const heroDescription =
    championship.description ||
    "Esta é a nova base pública do campeonato. Ela já nasce pronta para concentrar classificação, jogos e evolução do torneio sem quebrar o fluxo atual.";
  const matchViews = buildMatchViews(championship.matches);
  const requestedViewIndex = Number.parseInt(String(resolvedSearchParams.view || "1"), 10);
  const currentViewIndex =
    Number.isInteger(requestedViewIndex) && requestedViewIndex > 0
      ? Math.min(requestedViewIndex, Math.max(matchViews.length, 1))
      : 1;
  const groupStandings = championship.standings.filter((standing) => standing.gamesPlayed > 0);
  const qualifiedCutoff =
    championship._count.teams >= 5 && championship.slug === "tio-hugo-2026" ? 4 : 0;
  const topScorers = buildTopScorers(championship.matches);
  const cardLeaders = buildCardLeaders(championship.matches);

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        <section className="overflow-hidden rounded-[20px] bg-[#171717] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8">
          <div className="mb-4 inline-flex rounded-full border border-[#B89020]/40 bg-[#B89020]/15 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#F3D27A]">
            Campeonato do Clube Quinze Veranistas
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="xv-fluid-text text-[1.8rem] font-black leading-tight tracking-tight sm:text-[2.6rem]">
                {championship.name}
              </h1>
              <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-white/[0.82] sm:text-[1.05rem]">
                {heroDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <InfoPill label="Formato" value={getFormatLabel(championship.format)} />
                <InfoPill label="Status" value={getStatusLabel(championship.status)} />
                <InfoPill
                  label="Inscrição"
                  value={getRegistrationModeLabel(championship.registrationMode)}
                />
                <InfoPill
                  label="Período"
                  value={formatChampionshipWindow(
                    championship.startsAt,
                    championship.endsAt,
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {showRegistrationAction ? (
                <Link
                  href={registrationPath}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.7)] transition hover:from-[#D3AB35] hover:to-[#9A7618] sm:w-auto"
                >
                  {championship.slug === "tio-hugo-2026"
                    ? "Fazer inscrição"
                    : "Acessar inscrição"}
                </Link>
              ) : null}
              <Link
                href={CALENDARIO_XV_PATH}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/16 sm:w-auto"
              >
                Ver calendário
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroStat label="Inscritos" value={String(championship._count.registrations)} />
            <HeroStat label="Times" value={String(championship._count.teams)} />
            <HeroStat label="Jogos" value={String(championship._count.matches)} />
            <HeroStat label="Elencos montados" value={String(championship._count.players)} />
          </div>

          <div className="mt-5 xv-quick-nav">
            <Link href="#classificacao">Classificação</Link>
            <Link href="#jogos">Jogos</Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <article id="classificacao" className="xv-card overflow-hidden scroll-mt-28">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Tabela real
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Classificação
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#4B5563]">
                  Pontuação viva da fase classificatória, calculada a partir dos jogos finalizados.
                </p>
              </div>
              <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-left sm:w-auto sm:text-right">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Times na tabela
                </div>
                <div className="text-xl font-black text-[#101010]">
                  {championship.standings.length}
                </div>
              </div>
            </div>

            {championship.standings.length > 0 ? (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <TableStatCard
                    label="Líder"
                    value={
                      championship.standings[0]
                        ? formatTeamDisplayName(
                            championship.standings[0].team.shortName ||
                              championship.standings[0].team.name,
                            championship.standings[0].team.icon,
                          )
                        : "-"
                    }
                    tone="gold"
                  />
                  <TableStatCard
                    label="Jogos válidos"
                    value={String(groupStandings.reduce((sum, standing) => sum + standing.gamesPlayed, 0) / 2)}
                    tone="neutral"
                  />
                  <TableStatCard
                    label="Zona de classificação"
                    value={qualifiedCutoff ? `${qualifiedCutoff} times` : "—"}
                    tone="blue"
                  />
                </div>

                {qualifiedCutoff ? (
                  <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-sm leading-6 text-[#4B5563]">
                    Os <strong>{qualifiedCutoff} primeiros</strong> avançam para o mata-mata.
                    Nesta edição da Copa Tio Hugo, a semifinal é montada com
                    <strong> 1º x 4º</strong> e <strong>2º x 3º</strong>.
                  </div>
                ) : null}

                <div className="xv-mobile-card-grid md:hidden">
                  {championship.standings.map((standing) => (
                    <article
                      key={`${standing.id}-mobile`}
                      className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                      style={{
                        boxShadow:
                          qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff
                            ? "inset 4px 0 0 #B89020"
                            : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <TeamIcon icon={standing.team.icon} />
                          <div className="min-w-0">
                          <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                            {standing.rank ? `${standing.rank}º lugar` : "Posição"}
                          </div>
                          <Link
                            href={getChampionshipTeamBasePath(
                              championship.slug,
                              standing.team.slug || "",
                            )}
                            className="mt-1 block text-lg font-black text-[#101010] transition hover:text-[#8B6914]"
                          >
                            {standing.team.shortName || standing.team.name}
                          </Link>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#171717] px-3 py-2 text-center text-white">
                          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/60">
                            Pontos
                          </div>
                          <div className="text-xl font-black">{standing.points}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        <MobileStandingStat label="J" value={String(standing.gamesPlayed)} />
                        <MobileStandingStat label="V" value={String(standing.wins)} />
                        <MobileStandingStat label="E" value={String(standing.draws)} />
                        <MobileStandingStat
                          label="SG"
                          value={formatGoalDifference(standing.goalDifference)}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden md:block xv-table-scroll">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-[0.74rem] uppercase tracking-[0.14em] text-[#6B7280]">
                      <th className="border-b border-[#E5E7EB] px-3 py-3">#</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3">Time</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">Pts</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">J</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">V</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">E</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">D</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championship.standings.map((standing) => (
                      <tr
                        key={standing.id}
                        className="bg-white even:bg-[#FCFCFC]"
                        style={{
                          boxShadow:
                            qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff
                              ? "inset 4px 0 0 #B89020"
                              : undefined,
                        }}
                      >
                        <td className="border-b border-[#F1F5F9] px-3 py-3 font-black text-[#101010]">
                          <div className="flex items-center gap-2">
                            <span>{standing.rank ?? "-"}</span>
                            {qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff ? (
                              <span className="rounded-full bg-[#F6E8BD] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#8B6914]">
                                Classifica
                              </span>
                            ) : (
                              <span className="text-xs">
                                {getMovementIcon(standing.movement)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3">
                          <div className="flex items-center gap-3">
                            <TeamIcon icon={standing.team.icon} compact />
                            <div>
                          <Link
                            href={getChampionshipTeamBasePath(
                              championship.slug,
                              standing.team.slug || "",
                            )}
                            className="font-semibold text-[#101010] transition hover:text-[#8B6914]"
                          >
                            {standing.team.shortName || standing.team.name}
                          </Link>
                          </div>
                          </div>
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center font-bold text-[#101010]">
                          {standing.points}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.gamesPlayed}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.wins}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.draws}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.losses}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center font-semibold text-[#374151]">
                          {formatGoalDifference(standing.goalDifference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <EmptyPanel
                title="Tabela ainda em preparação"
                description="Quando os times forem definidos e a classificação começar a ser alimentada, esta coluna já recebe a tabela do campeonato sem precisar refazer a estrutura da página."
              />
            )}
          </article>

          <article className="xv-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Estatísticas
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Artilharia e cartões
                </h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4">
                <h3 className="text-base font-black text-[#101010]">Artilheiros</h3>
                <div className="mt-3 grid gap-2">
                  {topScorers.length > 0 ? (
                    topScorers.map((entry) => (
                      <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        <span className="font-semibold text-[#101010]">{entry.name}</span>
                        <span className="rounded-full bg-[#171717] px-3 py-1 text-sm font-black text-white">
                          {entry.goals}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">Sem gols registrados ainda.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4">
                <h3 className="text-base font-black text-[#101010]">Cartões</h3>
                <div className="mt-3 grid gap-2">
                  {cardLeaders.length > 0 ? (
                    cardLeaders.map((entry) => (
                      <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        <span className="font-semibold text-[#101010]">{entry.name}</span>
                        <span className="text-sm font-black text-[#101010]">
                          {"🟨".repeat(entry.yellowCards)}
                          {"🟥".repeat(entry.redCards)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6B7280]">Sem cartões registrados ainda.</p>
                  )}
                </div>
              </div>
            </div>
          </article>

        </section>

        <MatchRoundCalendar
          championshipSlug={championship.slug}
          matchViews={matchViews}
          initialViewIndex={currentViewIndex}
          totalMatches={championship.matches.length}
        />
      </PageContainer>
    </main>
  );
}

function buildMatchViews(
  matches: Array<{
    id: string;
    round: number;
    roundNumber: number | null;
    scheduledAt: Date | null;
    location: string | null;
    status: MatchStatus;
    notes: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: {
      id: string;
      name: string;
    slug: string | null;
    shortName: string | null;
    icon: string | null;
    primaryColor: string | null;
      secondaryColor: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
    slug: string | null;
    shortName: string | null;
    icon: string | null;
    primaryColor: string | null;
      secondaryColor: string | null;
    };
    stage: {
      id: string;
      name: string;
      order: number;
      stageType: string;
    } | null;
  }>,
) {
  const groups = new Map<
    string,
    {
      label: string;
      order: number;
      matches: typeof matches;
    }
  >();

  for (const match of matches) {
    const isGroupRound = match.stage?.stageType === "GRUPO";
    const key = isGroupRound
      ? `grupo-${match.round}`
      : `${match.stage?.stageType || "OUTRO"}-${match.round}`;
    const label = isGroupRound
      ? `Rodada ${match.round}`
      : match.stage?.name || `Fase ${match.round}`;
    const order = isGroupRound
      ? match.round
      : match.stage?.order
        ? 100 + match.stage.order
        : 999;
    const current = groups.get(key) || {
      label,
      order,
      matches: [],
    };

    current.matches.push(match);
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      ...group,
      matches: group.matches.sort((a, b) => {
        return (a.roundNumber || 0) - (b.roundNumber || 0);
      }),
    }));
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/[0.6]">
        {label}
      </div>
      <div className="mt-1 text-[1.8rem] font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-2 text-sm text-white/[0.88]">
      <span className="font-bold text-white">{label}:</span> {value}
    </div>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-7">
      <h3 className="text-lg font-black tracking-tight text-[#101010]">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4B5563]">
        {description}
      </p>
    </div>
  );
}

function buildTopScorers(
  matches: Array<{
    participations?: Array<{
      player: { id: string; fullName: string };
      goals: number;
    }>;
  }>,
) {
  const scorers = new Map<string, { key: string; name: string; goals: number }>();

  for (const match of matches) {
    for (const participation of match.participations || []) {
      if (participation.goals <= 0) {
        continue;
      }

      const current =
        scorers.get(participation.player.id) || {
          key: participation.player.id,
          name: participation.player.fullName,
          goals: 0,
        };
      current.goals += participation.goals;
      scorers.set(participation.player.id, current);
    }
  }

  return Array.from(scorers.values()).sort((left, right) => {
    if (right.goals !== left.goals) return right.goals - left.goals;
    return left.name.localeCompare(right.name, "pt-BR");
  });
}

function buildCardLeaders(
  matches: Array<{
    participations?: Array<{
      player: { id: string; fullName: string };
      yellowCards: number;
      redCards: number;
    }>;
  }>,
) {
  const players = new Map<
    string,
    { key: string; name: string; yellowCards: number; redCards: number }
  >();

  for (const match of matches) {
    for (const participation of match.participations || []) {
      if (participation.yellowCards <= 0 && participation.redCards <= 0) {
        continue;
      }

      const current =
        players.get(participation.player.id) || {
          key: participation.player.id,
          name: participation.player.fullName,
          yellowCards: 0,
          redCards: 0,
        };
      current.yellowCards += participation.yellowCards;
      current.redCards += participation.redCards;
      players.set(participation.player.id, current);
    }
  }

  return Array.from(players.values()).sort((left, right) => {
    const rightTotal = right.yellowCards + right.redCards;
    const leftTotal = left.yellowCards + left.redCards;
    if (rightTotal !== leftTotal) return rightTotal - leftTotal;
    return left.name.localeCompare(right.name, "pt-BR");
  });
}

function formatTeamDisplayName(name: string, icon?: string | null) {
  return icon ? `${icon} ${name}` : name;
}

function TeamIcon({
  icon,
  primaryColor,
  secondaryColor,
  compact = false,
}: {
  icon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border bg-white ${
        compact ? "h-9 w-9 text-xl" : "h-11 w-11 text-2xl"
      }`}
      style={{
        background: icon ? "#FFFFFF" : buildTeamBadgeBackground(primaryColor, secondaryColor),
        borderColor: secondaryColor || primaryColor || "#E5E7EB",
      }}
    >
      {icon || null}
    </span>
  );
}

function TableStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "neutral" | "blue";
}) {
  const tones = {
    gold: {
      background: "#FCF7E6",
      border: "#F1D68A",
      color: "#8B6914",
    },
    neutral: {
      background: "#FAFAFA",
      border: "#E5E7EB",
      color: "#374151",
    },
    blue: {
      background: "#EEF2FF",
      border: "#C7D2FE",
      color: "#3450A1",
    },
  } as const;

  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        background: tones[tone].background,
        borderColor: tones[tone].border,
      }}
    >
      <div
        className="text-[0.72rem] font-bold uppercase tracking-[0.14em]"
        style={{ color: tones[tone].color }}
      >
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-[#101010]">{value}</div>
    </div>
  );
}

function MobileStandingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-2 py-3">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-base font-black text-[#101010]">{value}</div>
    </div>
  );
}

function getFormatLabel(format: ChampionshipFormat) {
  switch (format) {
    case "PONTOS_CORRIDOS":
      return "Pontos corridos";
    case "MATA_MATA":
      return "Mata-mata";
    case "MISTO":
      return "Misto";
    default:
      return format;
  }
}

function getStatusLabel(status: ChampionshipStatus) {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    case "RASCUNHO":
    default:
      return "Em preparação";
  }
}

function getRegistrationModeLabel(mode: ChampionshipRegistrationMode) {
  switch (mode) {
    case "INDIVIDUAL":
      return "Individual";
    case "POR_EQUIPES":
      return "Por equipes";
    case "FECHADO":
      return "Fechado";
    default:
      return mode;
  }
}

function getMovementIcon(movement: StandingMovement) {
  switch (movement) {
    case "SUBIU":
      return "▲";
    case "CAIU":
      return "▼";
    case "MANTEVE":
    default:
      return "•";
  }
}

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatChampionshipWindow(startsAt?: Date | null, endsAt?: Date | null) {
  if (startsAt && endsAt) {
    return `${formatDate(startsAt)} a ${formatDate(endsAt)}`;
  }

  if (startsAt) {
    return `A partir de ${formatDate(startsAt)}`;
  }

  if (endsAt) {
    return `Até ${formatDate(endsAt)}`;
  }

  return "A definir";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function buildTeamBadgeBackground(
  primaryColor?: string | null,
  secondaryColor?: string | null,
) {
  const primary = primaryColor || "#D1D5DB";
  const secondary = secondaryColor || "#F9FAFB";

  return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;
}
