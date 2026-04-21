"use server";

import { MatchStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getRequiredChampionshipBySlug,
  getTioHugoAdminMatchesPath,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import { COPA_TIO_HUGO_2026_EVENTS } from "@/lib/calendar";
import { parseClubDateTimeLocalInput } from "@/lib/peladas";
import { prisma } from "@/lib/prisma";

export async function createChampionshipMatch(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const data = await parseMatchFormData(formData, championship.id);

  await prisma.match.create({
    data: {
      championshipId: championship.id,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      stageId: data.stageId,
      round: data.round,
      roundNumber: data.roundNumber,
      scheduledAt: data.scheduledAt,
      location: data.location,
      notes: data.notes,
      status: data.status,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    },
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=create-match`);
}

export async function updateChampionshipMatch(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const matchId = String(formData.get("matchId") || "").trim();

  if (!matchId) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Jogo não encontrado para atualização.",
      )}`,
    );
  }

  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      championshipId: true,
    },
  });

  if (!existingMatch || existingMatch.championshipId !== championship.id) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Este jogo não pertence a este campeonato.",
      )}`,
    );
  }

  const data = await parseMatchFormData(formData, championship.id);

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      stageId: data.stageId,
      round: data.round,
      roundNumber: data.roundNumber,
      scheduledAt: data.scheduledAt,
      location: data.location,
      notes: data.notes,
      status: data.status,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    },
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=update-match`);
}

export async function applyTioHugoBaseSchedule() {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const [stages, standings, matches] = await Promise.all([
    prisma.championshipStage.findMany({
      where: {
        championshipId: championship.id,
      },
      select: {
        id: true,
        order: true,
        stageType: true,
      },
    }),
    prisma.standing.findMany({
      where: {
        championshipId: championship.id,
      },
      orderBy: [{ rank: "asc" }, { points: "desc" }],
      select: {
        id: true,
        rank: true,
        teamId: true,
      },
    }),
    prisma.match.findMany({
      where: {
        championshipId: championship.id,
      },
      select: {
        id: true,
        stageId: true,
        round: true,
        roundNumber: true,
        notes: true,
      },
    }),
  ]);

  const groupStage = stages.find((stage) => stage.stageType === "GRUPO");
  const semiStage = stages.find((stage) => stage.stageType === "SEMIFINAL");
  const finalStage = stages.find((stage) => stage.stageType === "FINAL");

  if (!groupStage || !semiStage || !finalStage) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "As fases do campeonato ainda não estão preparadas para aplicar o calendário base.",
      )}`,
    );
  }

  if (standings.length < 4) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "É preciso ter pelo menos 4 times na classificação para preparar semifinal e final.",
      )}`,
    );
  }

  const roundDates = new Map<number, Date>([
    [1, COPA_TIO_HUGO_2026_EVENTS[0].startsAt],
    [2, COPA_TIO_HUGO_2026_EVENTS[1].startsAt],
    [3, COPA_TIO_HUGO_2026_EVENTS[2].startsAt],
    [4, COPA_TIO_HUGO_2026_EVENTS[3].startsAt],
    [5, COPA_TIO_HUGO_2026_EVENTS[4].startsAt],
  ]);
  const semiDate = COPA_TIO_HUGO_2026_EVENTS[5].startsAt;
  const finalDate = COPA_TIO_HUGO_2026_EVENTS[6].startsAt;

  const groupMatches = matches.filter((match) => match.stageId === groupStage.id);
  const semifinalMatches = matches.filter((match) => match.stageId === semiStage.id);
  const finalMatches = matches.filter((match) => match.stageId === finalStage.id);

  const firstPlace = standings.find((standing) => standing.rank === 1) || standings[0];
  const secondPlace = standings.find((standing) => standing.rank === 2) || standings[1];
  const thirdPlace = standings.find((standing) => standing.rank === 3) || standings[2];
  const fourthPlace = standings.find((standing) => standing.rank === 4) || standings[3];

  await prisma.$transaction(async (tx) => {
    for (const match of groupMatches) {
      await tx.match.update({
        where: { id: match.id },
        data: {
          scheduledAt: roundDates.get(match.round) || null,
        },
      });
    }

    if (semifinalMatches.length === 0) {
      await tx.match.createMany({
        data: [
          {
            championshipId: championship.id,
            stageId: semiStage.id,
            homeTeamId: firstPlace.teamId,
            awayTeamId: fourthPlace.teamId,
            round: 6,
            roundNumber: 1,
            scheduledAt: semiDate,
            status: MatchStatus.AGENDADO,
            notes:
              "Placeholder da semifinal 1: atualizar os participantes ao fim da fase classificatória (1º x 4º).",
          },
          {
            championshipId: championship.id,
            stageId: semiStage.id,
            homeTeamId: secondPlace.teamId,
            awayTeamId: thirdPlace.teamId,
            round: 6,
            roundNumber: 2,
            scheduledAt: semiDate,
            status: MatchStatus.AGENDADO,
            notes:
              "Placeholder da semifinal 2: atualizar os participantes ao fim da fase classificatória (2º x 3º).",
          },
        ],
      });
    } else {
      for (const [index, match] of semifinalMatches
        .sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0))
        .entries()) {
        const matchup =
          index === 0
            ? {
                homeTeamId: firstPlace.teamId,
                awayTeamId: fourthPlace.teamId,
                notes:
                  "Placeholder da semifinal 1: atualizar os participantes ao fim da fase classificatória (1º x 4º).",
              }
            : {
                homeTeamId: secondPlace.teamId,
                awayTeamId: thirdPlace.teamId,
                notes:
                  "Placeholder da semifinal 2: atualizar os participantes ao fim da fase classificatória (2º x 3º).",
              };

        await tx.match.update({
          where: { id: match.id },
          data: {
            homeTeamId: matchup.homeTeamId,
            awayTeamId: matchup.awayTeamId,
            round: 6,
            roundNumber: index + 1,
            scheduledAt: semiDate,
            notes: matchup.notes,
          },
        });
      }
    }

    if (finalMatches.length === 0) {
      await tx.match.create({
        data: {
          championshipId: championship.id,
          stageId: finalStage.id,
          homeTeamId: firstPlace.teamId,
          awayTeamId: secondPlace.teamId,
          round: 7,
          roundNumber: 1,
          scheduledAt: finalDate,
          status: MatchStatus.AGENDADO,
          notes:
            "Placeholder da final: vencedor da semifinal 1 x vencedor da semifinal 2. Ajustar os participantes após as semifinais.",
        },
      });
    } else {
      const finalMatch = finalMatches[0];

      await tx.match.update({
        where: { id: finalMatch.id },
        data: {
          homeTeamId: firstPlace.teamId,
          awayTeamId: secondPlace.teamId,
          round: 7,
          roundNumber: 1,
          scheduledAt: finalDate,
          notes:
            "Placeholder da final: vencedor da semifinal 1 x vencedor da semifinal 2. Ajustar os participantes após as semifinais.",
        },
      });
    }
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=apply-base-schedule`);
}

async function parseMatchFormData(formData: FormData, championshipId: string) {
  const homeTeamId = String(formData.get("homeTeamId") || "").trim();
  const awayTeamId = String(formData.get("awayTeamId") || "").trim();
  const stageId = String(formData.get("stageId") || "").trim();
  const round = parsePositiveInteger(formData.get("round"), 1);
  const roundNumber = parseOptionalPositiveInteger(formData.get("roundNumber"));
  const scheduledAtRaw = String(formData.get("scheduledAt") || "").trim();
  const location = normalizeNullableText(formData.get("location"));
  const notes = normalizeNullableText(formData.get("notes"));
  const status = parseMatchStatus(formData.get("status"));
  const homeScore = parseNonNegativeInteger(formData.get("homeScore"));
  const awayScore = parseNonNegativeInteger(formData.get("awayScore"));

  if (!homeTeamId || !awayTeamId) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Selecione os dois times do jogo.",
      )}`,
    );
  }

  if (homeTeamId === awayTeamId) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Mandante e visitante precisam ser times diferentes.",
      )}`,
    );
  }

  if (!stageId) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Selecione a fase do jogo.",
      )}`,
    );
  }

  const [homeTeam, awayTeam, stage] = await Promise.all([
    prisma.championshipTeam.findFirst({
      where: {
        championshipId,
        teamId: homeTeamId,
      },
      select: { id: true },
    }),
    prisma.championshipTeam.findFirst({
      where: {
        championshipId,
        teamId: awayTeamId,
      },
      select: { id: true },
    }),
    prisma.championshipStage.findFirst({
      where: {
        championshipId,
        id: stageId,
      },
      select: { id: true },
    }),
  ]);

  if (!homeTeam || !awayTeam) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "Os times selecionados precisam pertencer a este campeonato.",
      )}`,
    );
  }

  if (!stage) {
    redirect(
      `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
        "A fase selecionada não pertence a este campeonato.",
      )}`,
    );
  }

  let scheduledAt: Date | null = null;

  if (scheduledAtRaw) {
    scheduledAt = parseClubDateTimeLocalInput(scheduledAtRaw);

    if (Number.isNaN(scheduledAt.getTime())) {
      redirect(
        `${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(
          "Informe uma data e horário válidos para o jogo.",
        )}`,
      );
    }
  }

  return {
    homeTeamId,
    awayTeamId,
    stageId,
    round,
    roundNumber,
    scheduledAt,
    location,
    notes,
    status,
    homeScore,
    awayScore,
  };
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  return raw || null;
}

function parsePositiveInteger(value: FormDataEntryValue | null, fallback: number) {
  const raw = String(value || "").trim();
  const parsed = Number(raw);

  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseOptionalPositiveInteger(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeInteger(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (!raw) {
    return 0;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function parseMatchStatus(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (
    raw === MatchStatus.AGENDADO ||
    raw === MatchStatus.EM_ANDAMENTO ||
    raw === MatchStatus.FINALIZADO ||
    raw === MatchStatus.CANCELADO
  ) {
    return raw;
  }

  return MatchStatus.AGENDADO;
}
