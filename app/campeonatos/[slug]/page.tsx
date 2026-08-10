import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { MatchStatus, StandingMovement } from "@prisma/client";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { PageContainer } from "@/components/ui/PageContainer";
import { getChampionshipPublicPageDataBySlug } from "@/lib/championships";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import { getChampionshipTeamBasePath } from "@/lib/routes";
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

  const matchViews = buildMatchViews(championship.matches);
  const requestedViewIndex = resolvedSearchParams.view
    ? Number.parseInt(resolvedSearchParams.view, 10)
    : Number.NaN;
  const finalViewIndex = matchViews.findIndex((view) =>
    view.matches.some((match) => match.stage?.stageType === "FINAL"),
  );
  const defaultViewIndex = finalViewIndex >= 0 ? finalViewIndex + 1 : 1;
  const currentViewIndex =
    Number.isInteger(requestedViewIndex) && requestedViewIndex > 0
      ? Math.min(requestedViewIndex, Math.max(matchViews.length, 1))
      : defaultViewIndex;
  const groupStandings = championship.standings.filter((standing) => standing.gamesPlayed > 0);
  const qualifiedCutoff =
    championship._count.teams >= 5 && championship.slug === "tio-hugo-2026" ? 4 : 0;
  const topScorers = buildTopScorers(championship.matches);
  const cardLeaders = buildCardLeaders(championship.matches);
  const matchMvps = buildMatchMvps(championship.matches);
  const activeSuspensions = (championship.suspensions || []).filter(
    (suspension) => suspension.status === "ATIVA",
  );
  const finalMatch = championship.matches.find(
    (match) =>
      match.stage?.stageType === "FINAL" &&
      match.status === "FINALIZADO" &&
      match.homeScore !== null &&
      match.awayScore !== null &&
      match.homeScore !== match.awayScore,
  );
  const championTeamId = finalMatch
    ? finalMatch.homeScore! > finalMatch.awayScore!
      ? finalMatch.homeTeam.id
      : finalMatch.awayTeam.id
    : null;
  const championStanding = championship.standings.find(
    (standing) => standing.team.id === championTeamId,
  );

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        <section className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {championship.teams.map((championshipTeam) => {
              const isChampion = championshipTeam.team.id === championTeamId;

              return (
              <Link
                key={championshipTeam.id}
                href={getChampionshipTeamBasePath(
                  championship.slug,
                  championshipTeam.team.slug || "",
                )}
                className={`rounded-[18px] border px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#D4B051] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${isChampion ? "border-[#D4B051] bg-[#FFFCF2]" : "border-[#E5E7EB] bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <TeamIcon
                    icon={championshipTeam.team.icon}
                    primaryColor={championshipTeam.team.primaryColor}
                    secondaryColor={championshipTeam.team.secondaryColor}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-base font-black text-[#101010]">
                      {championshipTeam.team.shortName || championshipTeam.team.name}
                    </div>
                    {shouldShowSecondaryTeamName(
                      championshipTeam.team.shortName || championshipTeam.team.name,
                      championshipTeam.team.name,
                    ) ? (
                      <div className="truncate text-sm text-[#6B7280]">
                        {championshipTeam.team.name}
                      </div>
                    ) : null}
                    {isChampion ? <div className="mt-1 text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#8B6914]">🏆 Campeão</div> : null}
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.95fr)_minmax(320px,0.8fr)] xl:items-start">
          <article id="classificacao" className="xv-card overflow-hidden scroll-mt-28">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Tabela real
                </span>
                <h2 className="mt-3 text-[1.85rem] font-black tracking-tight text-[#101010]">
                  Classificação
                </h2>
                <p className="mt-2 max-w-2xl text-[1.02rem] leading-7 text-[#4B5563]">
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
                    label={championStanding ? "Campeão" : "Líder"}
                    value={
                      championStanding || championship.standings[0]
                        ? formatTeamDisplayName(
                            (championStanding || championship.standings[0]).team.shortName ||
                              (championStanding || championship.standings[0]).team.name,
                            (championStanding || championship.standings[0]).team.icon,
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
                  {championship.standings.map((standing) => {
                    const isChampion = standing.team.id === championTeamId;

                    return (
                    <article
                      key={`${standing.id}-mobile`}
                      className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                      style={{
                        boxShadow:
                          isChampion
                            ? "inset 4px 0 0 #B89020"
                            : qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff
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
                          {isChampion ? <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#8B6914]">🏆 Campeão</div> : null}
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
                    );
                  })}
                </div>

                <div className="hidden md:block xv-table-scroll">
                <table className="min-w-full border-separate border-spacing-0 text-[1.02rem]">
                  <thead>
                    <tr className="text-left text-[0.74rem] uppercase tracking-[0.14em] text-[#6B7280]">
                      <th className="border-b border-[#E5E7EB] px-4 py-4">#</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4">Time</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">Pts</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">J</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">V</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">E</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">D</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">GP</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">GC</th>
                      <th className="border-b border-[#E5E7EB] px-4 py-4 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championship.standings.map((standing) => {
                      const isChampion = standing.team.id === championTeamId;

                      return (
                      <tr
                        key={standing.id}
                        className="bg-white even:bg-[#FCFCFC]"
                        style={{
                          boxShadow:
                            isChampion
                              ? "inset 4px 0 0 #B89020"
                              : qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff
                              ? "inset 4px 0 0 #B89020"
                              : undefined,
                        }}
                      >
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-[1.15rem] font-black text-[#101010]">
                          <div className="flex items-center gap-2">
                            <span>{standing.rank ?? "-"}</span>
                            {isChampion ? (
                              <span className="rounded-full bg-[#B89020] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white">
                                🏆 Campeão
                              </span>
                            ) : qualifiedCutoff && (standing.rank || 99) <= qualifiedCutoff ? (
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
                        <td className="border-b border-[#F1F5F9] px-4 py-5">
                          <div className="flex items-center gap-3">
                            <TeamIcon icon={standing.team.icon} compact />
                            <div>
                          <Link
                            href={getChampionshipTeamBasePath(
                              championship.slug,
                              standing.team.slug || "",
                            )}
                            className="text-[1.15rem] font-semibold text-[#101010] transition hover:text-[#8B6914]"
                          >
                            {standing.team.shortName || standing.team.name}
                          </Link>
                          </div>
                          </div>
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.15rem] font-bold text-[#101010]">
                          {standing.points}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.gamesPlayed}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.wins}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.draws}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.losses}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.goalsFor}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.1rem] text-[#374151]">
                          {standing.goalsAgainst}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-4 py-5 text-center text-[1.15rem] font-semibold text-[#374151]">
                          {formatGoalDifference(standing.goalDifference)}
                        </td>
                      </tr>
                      );
                    })}
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

          <MatchRoundCalendar
            championshipSlug={championship.slug}
            matchViews={matchViews}
            initialViewIndex={currentViewIndex}
            totalMatches={championship.matches.length}
            allTeams={championship.teams.map((championshipTeam) => championshipTeam.team)}
            variant="sidebar"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <article className="xv-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Estatísticas
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Artilharia
                </h2>
              </div>
            </div>

            <div className="grid gap-2">
              {topScorers.length > 0 ? (
                topScorers.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-2">
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
          </article>

          <article className="xv-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Disciplina
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Cartões
                </h2>
              </div>
            </div>

            <div className="grid gap-2">
              {cardLeaders.length > 0 ? (
                cardLeaders.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-2">
                    <span className="font-semibold text-[#101010]">{entry.name}</span>
                    <span className="text-sm font-black text-[#101010]">
                      {"🟨".repeat(entry.yellowCards)}
                      {"🟥".repeat(entry.redCards)}
                      {"🟦".repeat(entry.blueCards)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Sem cartões registrados ainda.</p>
              )}
            </div>
          </article>

          <article className="xv-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Disciplina
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Suspensões
                </h2>
              </div>
            </div>

            <div className="grid gap-2">
              {activeSuspensions.length > 0 ? (
                activeSuspensions.map((suspension) => (
                  <div key={suspension.id} className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-3">
                    <div className="font-semibold text-[#101010]">
                      {suspension.player.fullName}
                    </div>
                    <div className="mt-1 text-sm text-[#4B5563]">
                      {suspension.team.shortName || suspension.team.name} •{" "}
                      {suspension.matchesSuspended} jogo
                      {suspension.matchesSuspended === 1 ? "" : "s"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Sem suspensões ativas.</p>
              )}
            </div>
          </article>

          <article className="xv-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Destaques
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  MVPs por jogo
                </h2>
              </div>
            </div>

            <div className="grid gap-2">
              {matchMvps.length > 0 ? (
                matchMvps.map((entry) => (
                  <div key={entry.key} className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-3">
                    <div className="text-sm font-black text-[#101010]">{entry.playerName}</div>
                    <div className="mt-1 text-sm text-[#4B5563]">{entry.matchLabel}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Sem MVPs registrados ainda.</p>
              )}
            </div>
          </article>
        </section>
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
    events?: Array<{
      player: string;
      playerId: string | null;
      quantity: number;
      type: string;
    }>;
    participations?: Array<{
      player: { id: string; fullName: string };
      yellowCards: number;
      redCards: number;
    }>;
  }>,
) {
  const players = new Map<
    string,
    { key: string; name: string; yellowCards: number; redCards: number; blueCards: number }
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
          blueCards: 0,
        };
      current.yellowCards += participation.yellowCards;
      current.redCards += participation.redCards;
      players.set(participation.player.id, current);
    }

    for (const event of match.events || []) {
      if (event.type !== "CARTAO_AZUL" || event.quantity <= 0) {
        continue;
      }

      const key = event.playerId || `blue-${event.player}`;
      const current =
        players.get(key) || {
          key,
          name: event.player,
          yellowCards: 0,
          redCards: 0,
          blueCards: 0,
        };
      current.blueCards += event.quantity;
      players.set(key, current);
    }
  }

  return Array.from(players.values()).sort((left, right) => {
    const rightTotal = right.yellowCards + right.redCards + right.blueCards;
    const leftTotal = left.yellowCards + left.redCards + left.blueCards;
    if (rightTotal !== leftTotal) return rightTotal - leftTotal;
    return left.name.localeCompare(right.name, "pt-BR");
  });
}

function buildMatchMvps(
  matches: Array<{
    id: string;
    homeTeam: { shortName: string | null; name: string };
    awayTeam: { shortName: string | null; name: string };
    participations?: Array<{
      player: { id: string; fullName: string };
      mvp?: boolean;
    }>;
  }>,
) {
  const entries: Array<{ key: string; playerName: string; matchLabel: string }> = [];

  for (const match of matches) {
    const matchLabel = `${match.homeTeam.shortName || match.homeTeam.name} x ${
      match.awayTeam.shortName || match.awayTeam.name
    }`;

    for (const participation of match.participations || []) {
      if (!participation.mvp) {
        continue;
      }

      entries.push({
        key: `${match.id}-${participation.player.id}`,
        playerName: participation.player.fullName,
        matchLabel,
      });
    }
  }

  return entries;
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

function getByeTeamsForView<
  T extends {
    id: string;
    shortName: string | null;
    name: string;
    icon: string | null;
  },
>(
  matches: Array<{
    homeTeam: { id: string };
    awayTeam: { id: string };
  }>,
  teams: T[],
) {
  const activeTeamIds = new Set<string>();

  for (const match of matches) {
    activeTeamIds.add(match.homeTeam.id);
    activeTeamIds.add(match.awayTeam.id);
  }

  return teams.filter((team) => !activeTeamIds.has(team.id));
}

function formatRoundDateLabel(
  matches: Array<{
    scheduledAt: Date | null;
  }>,
) {
  const firstScheduledAt = matches.find((match) => match.scheduledAt)?.scheduledAt;

  if (!firstScheduledAt) {
    return "Data a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(firstScheduledAt);
}

function getMatchDateTimeInline(date: Date | null) {
  if (!date) {
    return "Data a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getMatchStatusText(status: MatchStatus) {
  switch (status) {
    case "FINALIZADO":
      return "Finalizado";
    case "EM_ANDAMENTO":
      return "Ao vivo";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "Agendado";
  }
}

function getMatchStatusBadgeClassName(status: MatchStatus) {
  const base = "rounded-full px-2.5 py-1";

  switch (status) {
    case "FINALIZADO":
      return `${base} bg-[#ECFDF3] text-[#047857]`;
    case "EM_ANDAMENTO":
      return `${base} bg-[#FEF3C7] text-[#92400E]`;
    case "CANCELADO":
      return `${base} bg-[#FEE2E2] text-[#991B1B]`;
    default:
      return `${base} bg-[#E9EEF9] text-[#3450A1]`;
  }
}

function CompactTeamRow({
  team,
  align = "left",
}: {
  team: {
    name: string;
    shortName: string | null;
    icon: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  align?: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "right" ? null : (
        <TeamIcon
          icon={team.icon}
          primaryColor={team.primaryColor}
          secondaryColor={team.secondaryColor}
          compact
        />
      )}
      <span className="truncate font-semibold text-[#101010]">
        {team.shortName || team.name}
      </span>
      {align === "right" ? (
        <TeamIcon
          icon={team.icon}
          primaryColor={team.primaryColor}
          secondaryColor={team.secondaryColor}
          compact
        />
      ) : null}
    </div>
  );
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

function buildTeamBadgeBackground(
  primaryColor?: string | null,
  secondaryColor?: string | null,
) {
  const primary = primaryColor || "#D1D5DB";
  const secondary = secondaryColor || "#F9FAFB";

  return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;
}
