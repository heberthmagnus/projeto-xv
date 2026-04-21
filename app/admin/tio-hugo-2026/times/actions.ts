"use server";

import { ChampionshipPlayerStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getRequiredChampionshipBySlug,
  getTioHugoAdminTeamsPath,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";

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
