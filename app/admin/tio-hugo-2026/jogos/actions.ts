"use server";

import { MatchEventType, MatchStatus, Prisma, SuspensionStatus } from "@prisma/client";
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

export async function createMatchEvent(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const data = await parseMatchEventFormData(formData, championship.id);

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.create({
      data: {
        matchId: data.matchId,
        teamId: data.teamId,
        playerId: data.playerId,
        player: data.playerName,
        type: data.type,
        quantity: data.quantity,
        minute: data.minute,
        notes: data.notes,
      },
    });

    await syncMatchParticipationsFromEvents(tx, data.matchId);
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=create-event#match-${data.matchId}`);
}

export async function updateMatchEvent(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const eventId = String(formData.get("eventId") || "").trim();

  if (!eventId) {
    redirectWithError("Evento não encontrado para atualização.");
  }

  const existingEvent = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      matchId: true,
      match: {
        select: {
          championshipId: true,
        },
      },
    },
  });

  if (!existingEvent || existingEvent.match.championshipId !== championship.id) {
    redirectWithError("Este evento não pertence à Copa Tio Hugo 2026.");
  }

  const data = await parseMatchEventFormData(formData, championship.id);

  if (data.matchId !== existingEvent.matchId) {
    redirectWithError("O jogo do evento não pode ser alterado nesta edição.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.update({
      where: { id: eventId },
      data: {
        teamId: data.teamId,
        playerId: data.playerId,
        player: data.playerName,
        type: data.type,
        quantity: data.quantity,
        minute: data.minute,
        notes: data.notes,
      },
    });

    await syncMatchParticipationsFromEvents(tx, data.matchId);
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=update-event#match-${data.matchId}`);
}

export async function deleteMatchEvent(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const eventId = String(formData.get("eventId") || "").trim();

  if (!eventId) {
    redirectWithError("Evento não encontrado para remoção.");
  }

  const existingEvent = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      matchId: true,
      match: { select: { championshipId: true } },
    },
  });

  if (!existingEvent || existingEvent.match.championshipId !== championship.id) {
    redirectWithError("Este evento não pertence à Copa Tio Hugo 2026.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.delete({ where: { id: eventId } });
    await syncMatchParticipationsFromEvents(tx, existingEvent.matchId);
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=delete-event#match-${existingEvent.matchId}`);
}

export async function createSuspension(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const data = await parseSuspensionFormData(formData, championship.id);

  await prisma.suspension.create({
    data: {
      championshipId: championship.id,
      playerId: data.playerId,
      teamId: data.teamId,
      reason: data.reason,
      relatedEventId: data.relatedEventId,
      relatedMatchId: data.relatedMatchId,
      matchesSuspended: data.matchesSuspended,
      status: data.status,
    },
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=create-suspension#suspensions`);
}

export async function updateSuspension(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const suspensionId = String(formData.get("suspensionId") || "").trim();

  if (!suspensionId) {
    redirectWithError("Suspensão não encontrada para atualização.");
  }

  const existingSuspension = await prisma.suspension.findUnique({
    where: { id: suspensionId },
    select: { id: true, championshipId: true },
  });

  if (!existingSuspension || existingSuspension.championshipId !== championship.id) {
    redirectWithError("Esta suspensão não pertence à Copa Tio Hugo 2026.");
  }

  const data = await parseSuspensionFormData(formData, championship.id);

  await prisma.suspension.update({
    where: { id: suspensionId },
    data: {
      playerId: data.playerId,
      teamId: data.teamId,
      reason: data.reason,
      relatedEventId: data.relatedEventId,
      relatedMatchId: data.relatedMatchId,
      matchesSuspended: data.matchesSuspended,
      status: data.status,
    },
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=update-suspension#suspensions`);
}

export async function deleteSuspension(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const suspensionId = String(formData.get("suspensionId") || "").trim();

  if (!suspensionId) {
    redirectWithError("Suspensão não encontrada para remoção.");
  }

  const existingSuspension = await prisma.suspension.findUnique({
    where: { id: suspensionId },
    select: { id: true, championshipId: true },
  });

  if (!existingSuspension || existingSuspension.championshipId !== championship.id) {
    redirectWithError("Esta suspensão não pertence à Copa Tio Hugo 2026.");
  }

  await prisma.suspension.delete({ where: { id: suspensionId } });

  redirect(`${getTioHugoAdminMatchesPath()}?success=delete-suspension#suspensions`);
}

export async function markSuspensionAsServed(formData: FormData) {
  await requireAdmin();

  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const suspensionId = String(formData.get("suspensionId") || "").trim();

  if (!suspensionId) {
    redirectWithError("Suspensão não encontrada para baixa.");
  }

  const existingSuspension = await prisma.suspension.findUnique({
    where: { id: suspensionId },
    select: { id: true, championshipId: true },
  });

  if (!existingSuspension || existingSuspension.championshipId !== championship.id) {
    redirectWithError("Esta suspensão não pertence à Copa Tio Hugo 2026.");
  }

  await prisma.suspension.update({
    where: { id: suspensionId },
    data: { status: SuspensionStatus.CUMPRIDA },
  });

  redirect(`${getTioHugoAdminMatchesPath()}?success=serve-suspension#suspensions`);
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

async function parseMatchEventFormData(formData: FormData, championshipId: string) {
  const matchId = String(formData.get("matchId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const playerId = String(formData.get("playerId") || "").trim();
  const type = parseMatchEventType(formData.get("type"));
  const quantity = parsePositiveInteger(formData.get("quantity"), 1);
  const minute = parseOptionalPositiveInteger(formData.get("minute"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!matchId || !teamId || !playerId) {
    redirectWithError("Selecione jogo, time e jogador para registrar o evento.");
  }

  const [match, player] = await Promise.all([
    prisma.match.findFirst({
      where: {
        id: matchId,
        championshipId,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      select: { id: true },
    }),
    prisma.championshipPlayer.findFirst({
      where: {
        championshipId,
        teamId,
        registration: {
          athleteProfileId: playerId,
        },
      },
      select: {
        registration: {
          select: {
            fullName: true,
            nickname: true,
            athleteProfileId: true,
          },
        },
      },
    }),
  ]);

  if (!match) {
    redirectWithError("O time selecionado precisa participar deste jogo da Copa Tio Hugo 2026.");
  }

  if (!player?.registration.athleteProfileId) {
    redirectWithError("O jogador selecionado precisa pertencer ao time escolhido.");
  }

  return {
    matchId,
    teamId,
    playerId,
    playerName: player.registration.nickname || player.registration.fullName,
    type,
    quantity,
    minute,
    notes,
  };
}

async function parseSuspensionFormData(formData: FormData, championshipId: string) {
  const teamId = String(formData.get("teamId") || "").trim();
  const playerId = String(formData.get("playerId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const relatedEventId = normalizeNullableText(formData.get("relatedEventId"));
  const relatedMatchId = normalizeNullableText(formData.get("relatedMatchId"));
  const matchesSuspended = parsePositiveInteger(formData.get("matchesSuspended"), 1);
  const status = parseSuspensionStatus(formData.get("status"));

  if (!teamId || !playerId || !reason) {
    redirectWithError("Selecione time, jogador e motivo da suspensão.");
  }

  const player = await prisma.championshipPlayer.findFirst({
    where: {
      championshipId,
      teamId,
      registration: {
        athleteProfileId: playerId,
      },
    },
    select: { id: true },
  });

  if (!player) {
    redirectWithError("O jogador suspenso precisa pertencer ao time escolhido.");
  }

  if (relatedMatchId) {
    const relatedMatch = await prisma.match.findFirst({
      where: { id: relatedMatchId, championshipId },
      select: { id: true },
    });

    if (!relatedMatch) {
      redirectWithError("O jogo relacionado precisa pertencer à Copa Tio Hugo 2026.");
    }
  }

  if (relatedEventId) {
    const relatedEvent = await prisma.matchEvent.findFirst({
      where: {
        id: relatedEventId,
        match: {
          championshipId,
        },
      },
      select: { id: true, matchId: true },
    });

    if (!relatedEvent) {
      redirectWithError("O evento relacionado precisa pertencer à Copa Tio Hugo 2026.");
    }
  }

  return {
    teamId,
    playerId,
    reason,
    relatedEventId,
    relatedMatchId,
    matchesSuspended,
    status,
  };
}

function parseMatchEventType(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (
    raw === MatchEventType.GOL ||
    raw === MatchEventType.CARTAO_AMARELO ||
    raw === MatchEventType.CARTAO_VERMELHO ||
    raw === MatchEventType.CARTAO_AZUL ||
    raw === MatchEventType.OBSERVACAO
  ) {
    return raw;
  }

  return MatchEventType.GOL;
}

function parseSuspensionStatus(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (
    raw === SuspensionStatus.ATIVA ||
    raw === SuspensionStatus.CUMPRIDA ||
    raw === SuspensionStatus.CANCELADA
  ) {
    return raw;
  }

  return SuspensionStatus.ATIVA;
}

async function syncMatchParticipationsFromEvents(
  tx: Prisma.TransactionClient,
  matchId: string,
) {
  const events = await tx.matchEvent.findMany({
    where: {
      matchId,
      playerId: {
        not: null,
      },
      type: {
        in: [
          MatchEventType.GOL,
          MatchEventType.CARTAO_AMARELO,
          MatchEventType.CARTAO_VERMELHO,
        ],
      },
    },
    select: {
      playerId: true,
      teamId: true,
      type: true,
      quantity: true,
    },
  });

  const match = await tx.match.findUnique({
    where: { id: matchId },
    select: {
      championshipId: true,
      participations: {
        select: {
          id: true,
          playerId: true,
          teamId: true,
        },
      },
    },
  });

  if (!match) {
    return;
  }

  const stats = new Map<
    string,
    {
      playerId: string;
      teamId: string;
      goals: number;
      yellowCards: number;
      redCards: number;
    }
  >();

  for (const event of events) {
    if (!event.playerId || !event.teamId) {
      continue;
    }

    const key = `${event.playerId}:${event.teamId}`;
    const entry =
      stats.get(key) ||
      {
        playerId: event.playerId,
        teamId: event.teamId,
        goals: 0,
        yellowCards: 0,
        redCards: 0,
      };

    if (event.type === MatchEventType.GOL) {
      entry.goals += event.quantity;
    } else if (event.type === MatchEventType.CARTAO_AMARELO) {
      entry.yellowCards += event.quantity;
    } else if (event.type === MatchEventType.CARTAO_VERMELHO) {
      entry.redCards += event.quantity;
    }

    stats.set(key, entry);
  }

  const touchedKeys = new Set([
    ...match.participations.map(
      (participation: { playerId: string; teamId: string }) =>
        `${participation.playerId}:${participation.teamId}`,
    ),
    ...stats.keys(),
  ]);

  for (const key of touchedKeys) {
    const entry = stats.get(key);
    const participation = match.participations.find(
      (item: { playerId: string; teamId: string }) =>
        `${item.playerId}:${item.teamId}` === key,
    );

    if (!entry && participation) {
      await tx.matchPlayerParticipation.update({
        where: { id: participation.id },
        data: {
          goals: 0,
          yellowCards: 0,
          redCards: 0,
        },
      });
      continue;
    }

    if (!entry) {
      continue;
    }

    await tx.matchPlayerParticipation.upsert({
      where: {
        matchId_playerId_teamId: {
          matchId,
          playerId: entry.playerId,
          teamId: entry.teamId,
        },
      },
      update: {
        goals: entry.goals,
        yellowCards: entry.yellowCards,
        redCards: entry.redCards,
      },
      create: {
        matchId,
        playerId: entry.playerId,
        teamId: entry.teamId,
        goals: entry.goals,
        yellowCards: entry.yellowCards,
        redCards: entry.redCards,
      },
    });
  }
}

function redirectWithError(message: string): never {
  redirect(`${getTioHugoAdminMatchesPath()}?error=${encodeURIComponent(message)}`);
}
