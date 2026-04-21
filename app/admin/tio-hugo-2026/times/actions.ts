"use server";

import {
  ChampionshipPlayerStatus,
  ChampionshipStageType,
  MatchStatus,
  StandingMovement,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getRequiredChampionshipBySlug,
  getTioHugoAdminTeamsPath,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";

const PLACEHOLDER_TEAMS = [
  { name: "Time A", shortName: "A", primaryColor: "#101010", secondaryColor: "#B89020" },
  { name: "Time B", shortName: "B", primaryColor: "#3450A1", secondaryColor: "#D9E2FF" },
  { name: "Time C", shortName: "C", primaryColor: "#047857", secondaryColor: "#D1FAE5" },
  { name: "Time D", shortName: "D", primaryColor: "#B45309", secondaryColor: "#FDE68A" },
  { name: "Time E", shortName: "E", primaryColor: "#7C3AED", secondaryColor: "#E9D5FF" },
] as const;

export async function createChampionshipTeam(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const name = String(formData.get("name") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const primaryColor = normalizeColor(formData.get("primaryColor"));
  const secondaryColor = normalizeColor(formData.get("secondaryColor"));

  if (!name) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Nome do time é obrigatório.",
      )}`,
    );
  }

  const teamSlug = await buildUniqueTeamSlug(championship.slug, name);
  const teamsCount = await prisma.championshipTeam.count({
    where: { championshipId: championship.id },
  });

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name,
        slug: teamSlug,
        shortName: shortName || null,
        primaryColor,
        secondaryColor,
      },
      select: { id: true },
    });

    await tx.championshipTeam.create({
      data: {
        championshipId: championship.id,
        teamId: team.id,
        displayOrder: teamsCount + 1,
      },
    });
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=create-team`);
}

export async function assignRegistrationToTeam(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const registrationId = String(formData.get("registrationId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const status = parsePlayerStatus(formData.get("status"));
  const squadNumber = parseOptionalInteger(formData.get("squadNumber"));
  const rosterOrder = parseOptionalInteger(formData.get("rosterOrder"));

  if (!registrationId) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Inscrição não encontrada.",
      )}`,
    );
  }

  if (!teamId) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Selecione um time para alocar o jogador.",
      )}`,
    );
  }

  const [registration, championshipTeam] = await Promise.all([
    prisma.registration.findUnique({
      where: { id: registrationId },
      select: { id: true, championshipId: true },
    }),
    prisma.championshipTeam.findFirst({
      where: {
        championshipId: championship.id,
        teamId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!registration || registration.championshipId !== championship.id) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Inscrição inválida para este campeonato.",
      )}`,
    );
  }

  if (!championshipTeam) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Time inválido para este campeonato.",
      )}`,
    );
  }

  await prisma.championshipPlayer.upsert({
    where: { registrationId },
    create: {
      championshipId: championship.id,
      registrationId,
      teamId,
      squadNumber,
      rosterOrder,
      status,
    },
    update: {
      teamId,
      squadNumber,
      rosterOrder,
      status,
    },
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=assign-player`);
}

export async function updateChampionshipTeamSettings(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const teamId = String(formData.get("teamId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const primaryColor = normalizeColor(formData.get("primaryColor"));
  const secondaryColor = normalizeColor(formData.get("secondaryColor"));
  const displayOrder = parseOptionalInteger(formData.get("displayOrder"));

  if (!teamId || !name) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Time inválido para atualização.",
      )}`,
    );
  }

  const championshipTeam = await prisma.championshipTeam.findFirst({
    where: {
      championshipId: championship.id,
      teamId,
    },
    select: {
      id: true,
      team: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!championshipTeam) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Este time não pertence a este campeonato.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: { id: teamId },
      data: {
        name,
        shortName: shortName || null,
        primaryColor,
        secondaryColor,
      },
    });

    if (displayOrder !== null && displayOrder > 0) {
      await tx.championshipTeam.update({
        where: { id: championshipTeam.id },
        data: {
          displayOrder,
          seed: displayOrder,
        },
      });
    }
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=update-team`);
}

export async function createPlaceholderTeamsAndBaseTable() {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const existingTeamsCount = await prisma.championshipTeam.count({
    where: { championshipId: championship.id },
  });

  if (existingTeamsCount > 0) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "A criação automática só está liberada quando ainda não existem times neste campeonato.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    const createdTeams = [];

    for (const [index, placeholderTeam] of PLACEHOLDER_TEAMS.entries()) {
      const team = await tx.team.create({
        data: {
          name: placeholderTeam.name,
          slug: await buildUniqueTeamSlug(championship.slug, placeholderTeam.name),
          shortName: placeholderTeam.shortName,
          primaryColor: placeholderTeam.primaryColor,
          secondaryColor: placeholderTeam.secondaryColor,
        },
        select: { id: true },
      });

      createdTeams.push(team);

      await tx.championshipTeam.create({
        data: {
          championshipId: championship.id,
          teamId: team.id,
          displayOrder: index + 1,
          seed: index + 1,
        },
      });

      await tx.standing.create({
        data: {
          championshipId: championship.id,
          teamId: team.id,
          rank: index + 1,
          movement: StandingMovement.MANTEVE,
        },
      });
    }
  });

  await createStagesStandingsAndMatches({
    championshipId: championship.id,
    teamIds: (
      await prisma.championshipTeam.findMany({
        where: { championshipId: championship.id },
        orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
        select: { teamId: true },
      })
    ).map((team) => team.teamId),
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=create-placeholder-base`);
}

export async function generateBaseTableFromExistingTeams() {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const [teams, matchesCount] = await Promise.all([
    prisma.championshipTeam.findMany({
      where: {
        championshipId: championship.id,
      },
      orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
      select: {
        teamId: true,
      },
    }),
    prisma.match.count({
      where: {
        championshipId: championship.id,
      },
    }),
  ]);

  if (teams.length !== 5) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "A tabela base da Copa Tio Hugo espera exatamente 5 times.",
      )}`,
    );
  }

  if (matchesCount > 0) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Já existem jogos cadastrados neste campeonato.",
      )}`,
    );
  }

  await createStagesStandingsAndMatches({
    championshipId: championship.id,
    teamIds: teams.map((team) => team.teamId),
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=create-base-table`);
}

export async function unassignChampionshipPlayer(formData: FormData) {
  await requireAdmin();

  const championshipPlayerId = String(formData.get("championshipPlayerId") || "").trim();

  if (!championshipPlayerId) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Vínculo de elenco não encontrado.",
      )}`,
    );
  }

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const championshipPlayer = await prisma.championshipPlayer.findUnique({
    where: { id: championshipPlayerId },
    select: { id: true, championshipId: true },
  });

  if (!championshipPlayer || championshipPlayer.championshipId !== championship.id) {
    redirect(
      `${getTioHugoAdminTeamsPath()}?error=${encodeURIComponent(
        "Jogador não encontrado neste campeonato.",
      )}`,
    );
  }

  await prisma.championshipPlayer.update({
    where: { id: championshipPlayerId },
    data: {
      teamId: null,
      squadNumber: null,
      rosterOrder: null,
    },
  });

  redirect(`${getTioHugoAdminTeamsPath()}?success=unassign-player`);
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parsePlayerStatus(value: FormDataEntryValue | null): ChampionshipPlayerStatus {
  const raw = String(value || "").trim();

  if (raw === "RESERVA" || raw === "INATIVO") {
    return raw;
  }

  return "ATIVO";
}

function normalizeColor(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }

  return null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function buildUniqueTeamSlug(championshipSlug: string, name: string) {
  const base = slugify(`${championshipSlug}-${name}`) || `${championshipSlug}-time`;

  const existingTeams = await prisma.team.findMany({
    where: {
      slug: {
        startsWith: base,
      },
    },
    select: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existingTeams.map((team) => team.slug).filter(Boolean));

  if (!existingSlugs.has(base)) {
    return base;
  }

  let index = 2;

  while (existingSlugs.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

function buildRoundRobinSchedule(teamIds: string[]) {
  if (teamIds.length < 2) {
    return [];
  }

  const hasBye = teamIds.length % 2 !== 0;
  const rotation = hasBye ? [...teamIds, "__BYE__"] : [...teamIds];
  const totalRounds = rotation.length - 1;
  const matchesPerRound = rotation.length / 2;
  const fixtures: Array<{
    round: number;
    matchNumber: number;
    homeTeamId: string;
    awayTeamId: string;
  }> = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex += 1) {
      const homeTeamId = rotation[matchIndex];
      const awayTeamId = rotation[rotation.length - 1 - matchIndex];

      if (homeTeamId === "__BYE__" || awayTeamId === "__BYE__") {
        continue;
      }

      fixtures.push({
        round: roundIndex + 1,
        matchNumber: fixtures.filter((fixture) => fixture.round === roundIndex + 1).length + 1,
        homeTeamId: roundIndex % 2 === 0 ? homeTeamId : awayTeamId,
        awayTeamId: roundIndex % 2 === 0 ? awayTeamId : homeTeamId,
      });
    }

    const fixed = rotation[0];
    const moving = rotation.slice(1);
    moving.unshift(moving.pop() as string);
    rotation.splice(0, rotation.length, fixed, ...moving);
  }

  return fixtures;
}

async function createStagesStandingsAndMatches(args: {
  championshipId: string;
  teamIds: string[];
}) {
  await prisma.$transaction(async (tx) => {
    const existingStandings = await tx.standing.findMany({
      where: {
        championshipId: args.championshipId,
      },
      select: {
        teamId: true,
      },
    });

    const existingTeamIds = new Set(existingStandings.map((standing) => standing.teamId));

    for (const [index, teamId] of args.teamIds.entries()) {
      if (existingTeamIds.has(teamId)) {
        continue;
      }

      await tx.standing.create({
        data: {
          championshipId: args.championshipId,
          teamId,
          rank: index + 1,
          movement: StandingMovement.MANTEVE,
        },
      });
    }

    const stageGroup = await tx.championshipStage.createManyAndReturn({
      data: [
        {
          championshipId: args.championshipId,
          name: "Fase classificatória",
          order: 1,
          stageType: ChampionshipStageType.GRUPO,
        },
        {
          championshipId: args.championshipId,
          name: "Semifinal",
          order: 2,
          stageType: ChampionshipStageType.SEMIFINAL,
        },
        {
          championshipId: args.championshipId,
          name: "Final",
          order: 3,
          stageType: ChampionshipStageType.FINAL,
        },
      ],
      select: {
        id: true,
        order: true,
      },
    });

    const groupStage = stageGroup.find((stage) => stage.order === 1);

    if (!groupStage) {
      throw new Error("Não foi possível preparar a fase classificatória.");
    }

    const pairings = buildRoundRobinSchedule(args.teamIds);

    await tx.match.createMany({
      data: pairings.map((pairing) => ({
        championshipId: args.championshipId,
        homeTeamId: pairing.homeTeamId,
        awayTeamId: pairing.awayTeamId,
        round: pairing.round,
        roundNumber: pairing.matchNumber,
        stageId: groupStage.id,
        status: MatchStatus.AGENDADO,
      })),
    });
  });
}
