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
  return prisma.championship.findUnique({
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
});

export const getChampionshipTeamPublicPageData = cache(
  async (championshipSlug: string, teamSlug: string) => {
    return prisma.championship.findUnique({
      where: { slug: championshipSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        seasonLabel: true,
        teams: {
          where: {
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
                standings: {
                  where: {
                    championship: {
                      slug: championshipSlug,
                    },
                  },
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
                  },
                },
                homeMatches: {
                  where: {
                    championship: {
                      slug: championshipSlug,
                    },
                  },
                  orderBy: [{ round: "asc" }, { createdAt: "asc" }],
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
                        stageType: true,
                      },
                    },
                    awayTeam: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        shortName: true,
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
                  orderBy: [{ round: "asc" }, { createdAt: "asc" }],
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
                        stageType: true,
                      },
                    },
                    homeTeam: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        shortName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
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
