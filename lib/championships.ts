import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  getAdminChampionshipAdvancedSimulationPath,
  getAdminChampionshipBasePath,
  getAdminChampionshipMatchesPath,
  getAdminChampionshipRegistrationsPath,
  getAdminChampionshipSimulationPath,
  getAdminChampionshipTeamsPath,
  getChampionshipBasePath,
  getChampionshipRegistrationPath,
  getChampionshipTeamBasePath,
} from "@/lib/routes";

export const TIO_HUGO_2026_SLUG = "tio-hugo-2026";

export const getChampionshipBySlug = cache(async (slug: string) => {
  return prisma.championship.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      seasonLabel: true,
      format: true,
      status: true,
      registrationMode: true,
      startsAt: true,
      endsAt: true,
    },
  });
});

export async function getRequiredChampionshipBySlug(slug: string) {
  const championship = await getChampionshipBySlug(slug);

  if (!championship) {
    throw new Error("Campeonato não encontrado.");
  }

  return championship;
}

export const getChampionshipTeamsWithPlayersBySlug = cache(async (slug: string) => {
  const championship = await prisma.championship.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      stages: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          order: true,
          stageType: true,
        },
      },
      matches: {
        orderBy: [{ stage: { order: "asc" } }, { round: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          round: true,
          roundNumber: true,
          status: true,
          stage: {
            select: {
              id: true,
              name: true,
              order: true,
              stageType: true,
            },
          },
          homeTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
        },
      },
      standings: {
        orderBy: [{ rank: "asc" }, { team: { name: "asc" } }],
        select: {
          id: true,
          rank: true,
          points: true,
          teamId: true,
        },
      },
      teams: {
        orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
        select: {
          id: true,
          groupLabel: true,
          seed: true,
          displayOrder: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              crestUrl: true,
              primaryColor: true,
              secondaryColor: true,
              players: {
                where: {
                  championship: { slug },
                },
                orderBy: [{ rosterOrder: "asc" }, { squadNumber: "asc" }, { createdAt: "asc" }],
                select: {
                  id: true,
                  squadNumber: true,
                  rosterOrder: true,
                  status: true,
                  registration: {
                    select: {
                      id: true,
                      fullName: true,
                      nickname: true,
                      preferredPosition: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      registrations: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fullName: true,
          nickname: true,
          preferredPosition: true,
          level: true,
          championshipPlayer: {
            select: {
              id: true,
              teamId: true,
              squadNumber: true,
              rosterOrder: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!championship) {
    return null;
  }

  return championship;
});

export const getChampionshipPublicPageDataBySlug = cache(async (slug: string) => {
  const championship = await prisma.championship.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      seasonLabel: true,
      description: true,
      format: true,
      status: true,
      registrationMode: true,
      startsAt: true,
      endsAt: true,
      _count: {
        select: {
          registrations: true,
          teams: true,
          standings: true,
          matches: true,
          players: true,
        },
      },
      teams: {
        orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
        select: {
          id: true,
          displayOrder: true,
          seed: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
      },
      standings: {
        orderBy: [
          { rank: "asc" },
          { points: "desc" },
          { goalDifference: "desc" },
          { goalsFor: "desc" },
        ],
        select: {
          id: true,
          rank: true,
          points: true,
          gamesPlayed: true,
          wins: true,
          draws: true,
          losses: true,
          goalsFor: true,
          goalsAgainst: true,
          goalDifference: true,
          winRate: true,
          movement: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
      },
      matches: {
        orderBy: [
          { scheduledAt: "asc" },
          { round: "asc" },
          { roundNumber: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          round: true,
          roundNumber: true,
          scheduledAt: true,
          location: true,
          status: true,
          notes: true,
          homeScore: true,
          awayScore: true,
          homeTeam: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
              order: true,
              stageType: true,
            },
          },
        },
      },
    },
  });

  if (!championship) {
    return null;
  }

  return {
    ...championship,
    standings: buildDynamicChampionshipStandings({
      teams: championship.teams,
      matches: championship.matches,
    }),
  };
});

function buildDynamicChampionshipStandings(args: {
  teams: Array<{
    team: {
      id: string;
      name: string;
      slug: string | null;
      shortName: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
    };
  }>;
  matches: Array<{
    id: string;
    status: "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
    homeScore: number;
    awayScore: number;
    homeTeam: {
      id: string;
      name: string;
      slug: string | null;
      shortName: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      slug: string | null;
      shortName: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
    };
    stage: {
      id: string;
      name: string;
      order: number;
      stageType: string;
    } | null;
  }>;
}) {
  const table = new Map(
    args.teams.map((championshipTeam) => [
      championshipTeam.team.id,
      {
        id: `dynamic-standing-${championshipTeam.team.id}`,
        rank: null as number | null,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        winRate: 0,
        movement: "MANTEVE" as const,
        team: championshipTeam.team,
      },
    ]),
  );

  for (const match of args.matches) {
    if (match.status !== "FINALIZADO" || match.stage?.stageType !== "GRUPO") {
      continue;
    }

    const home = table.get(match.homeTeam.id);
    const away = table.get(match.awayTeam.id);

    if (!home || !away) {
      continue;
    }

    home.gamesPlayed += 1;
    away.gamesPlayed += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Array.from(table.values())
    .map((entry) => ({
      ...entry,
      goalDifference: entry.goalsFor - entry.goalsAgainst,
      winRate:
        entry.gamesPlayed > 0
          ? Math.round((entry.points / (entry.gamesPlayed * 3)) * 100)
          : 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      return a.team.name.localeCompare(b.team.name, "pt-BR");
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return standings;
}

export const getChampionshipTeamPublicPageData = cache(
  async (championshipSlug: string, teamSlug: string) => {
    const [championship, championshipTeam] = await prisma.$transaction([
      prisma.championship.findUnique({
        where: { slug: championshipSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          seasonLabel: true,
          description: true,
          teams: {
            orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
            select: {
              id: true,
              displayOrder: true,
              seed: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  shortName: true,
                  primaryColor: true,
                  secondaryColor: true,
                },
              },
            },
          },
          matches: {
            orderBy: [
              { scheduledAt: "asc" },
              { round: "asc" },
              { roundNumber: "asc" },
              { createdAt: "asc" },
            ],
            select: {
              id: true,
              round: true,
              roundNumber: true,
              scheduledAt: true,
              status: true,
              homeScore: true,
              awayScore: true,
              homeTeam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  shortName: true,
                  primaryColor: true,
                  secondaryColor: true,
                },
              },
              awayTeam: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  shortName: true,
                  primaryColor: true,
                  secondaryColor: true,
                },
              },
              stage: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                  stageType: true,
                },
              },
            },
          },
        },
      }),
      prisma.championshipTeam.findFirst({
        where: {
          championship: {
            slug: championshipSlug,
          },
          team: {
            slug: teamSlug,
          },
        },
        select: {
          id: true,
          seed: true,
          displayOrder: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              crestUrl: true,
              primaryColor: true,
              secondaryColor: true,
              players: {
                where: {
                  championship: {
                    slug: championshipSlug,
                  },
                },
                orderBy: [
                  { rosterOrder: "asc" },
                  { squadNumber: "asc" },
                  { createdAt: "asc" },
                ],
                select: {
                  id: true,
                  squadNumber: true,
                  rosterOrder: true,
                  status: true,
                  registration: {
                    select: {
                      id: true,
                      fullName: true,
                      nickname: true,
                      preferredPosition: true,
                      level: true,
                    },
                  },
                },
              },
              homeMatches: {
                where: {
                  championship: {
                    slug: championshipSlug,
                  },
                },
                select: {
                  id: true,
                  round: true,
                  roundNumber: true,
                  status: true,
                  scheduledAt: true,
                  homeScore: true,
                  awayScore: true,
                  stage: {
                    select: {
                      id: true,
                      name: true,
                      order: true,
                      stageType: true,
                    },
                  },
                  awayTeam: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      shortName: true,
                      primaryColor: true,
                      secondaryColor: true,
                    },
                  },
                },
              },
              awayMatches: {
                where: {
                  championship: {
                    slug: championshipSlug,
                  },
                },
                select: {
                  id: true,
                  round: true,
                  roundNumber: true,
                  status: true,
                  scheduledAt: true,
                  homeScore: true,
                  awayScore: true,
                  stage: {
                    select: {
                      id: true,
                      name: true,
                      order: true,
                      stageType: true,
                    },
                  },
                  homeTeam: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      shortName: true,
                      primaryColor: true,
                      secondaryColor: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!championship || !championshipTeam) {
      return null;
    }

    const standings = buildDynamicChampionshipStandings({
      teams: championship.teams,
      matches: championship.matches,
    });

    const teamMatches = [
      ...championshipTeam.team.homeMatches.map((match) => ({
        id: match.id,
        round: match.round,
        roundNumber: match.roundNumber,
        scheduledAt: match.scheduledAt,
        status: match.status,
        stage: match.stage,
        isHome: true,
        opponent: match.awayTeam,
        teamScore: match.homeScore,
        opponentScore: match.awayScore,
      })),
      ...championshipTeam.team.awayMatches.map((match) => ({
        id: match.id,
        round: match.round,
        roundNumber: match.roundNumber,
        scheduledAt: match.scheduledAt,
        status: match.status,
        stage: match.stage,
        isHome: false,
        opponent: match.homeTeam,
        teamScore: match.awayScore,
        opponentScore: match.homeScore,
      })),
    ].sort((a, b) => {
      const dateA = a.scheduledAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = b.scheduledAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      const stageOrderA = a.stage?.order ?? Number.MAX_SAFE_INTEGER;
      const stageOrderB = b.stage?.order ?? Number.MAX_SAFE_INTEGER;

      if (stageOrderA !== stageOrderB) {
        return stageOrderA - stageOrderB;
      }

      if (a.round !== b.round) {
        return a.round - b.round;
      }

      return (a.roundNumber || 0) - (b.roundNumber || 0);
    });

    return {
      ...championship,
      currentStanding:
        standings.find((standing) => standing.team.id === championshipTeam.team.id) || null,
      standings,
      teamEntry: championshipTeam,
      teamMatches,
    };
  },
);

export function getTioHugoRegistrationPath() {
  return getChampionshipRegistrationPath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoBasePath() {
  return getChampionshipBasePath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoTeamBasePath(teamSlug: string) {
  return getChampionshipTeamBasePath(TIO_HUGO_2026_SLUG, teamSlug);
}

export function getTioHugoAdminBasePath() {
  return getAdminChampionshipBasePath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoAdminRegistrationsPath() {
  return getAdminChampionshipRegistrationsPath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoAdminTeamsPath() {
  return getAdminChampionshipTeamsPath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoAdminMatchesPath() {
  return getAdminChampionshipMatchesPath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoAdminSimulationPath() {
  return getAdminChampionshipSimulationPath(TIO_HUGO_2026_SLUG);
}

export function getTioHugoAdminAdvancedSimulationPath() {
  return getAdminChampionshipAdvancedSimulationPath(TIO_HUGO_2026_SLUG);
}
