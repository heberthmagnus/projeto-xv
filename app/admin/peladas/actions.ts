"use server";

import { redirect } from "next/navigation";
import { AuthDatabaseUnavailableError, requireAdmin } from "@/lib/auth";
import {
  getAthleteProfileAge,
  syncAthleteProfileFromPeladaArrival,
  syncAthleteProfileFromPeladaConfirmation,
} from "@/lib/athlete-profiles";
import {
  generateCancelToken,
  syncGuestConfirmations,
} from "@/lib/pelada-confirmations";
import { getNextRoundPlayers } from "@/lib/pelada-rounds";
import {
  buildPeladaTeams,
  buildPeladaTeamsWarningsSummary,
} from "@/lib/pelada-teams";
import {
  getFirstGamePlayersLimit,
  isLinePlayerPosition,
  parseClubDateTimeLocalInput,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_PELADAS_PATH,
  getAdminPeladaChegadaPath,
  getAdminPeladaConfirmadosPath,
  getAdminPeladaPeladasDoDiaPath,
  getAdminPeladaResultadosPath,
} from "@/lib/routes";
import { parsePeladaFormData } from "./pelada-form-values";

export async function createPelada(formData: FormData) {
  await requireAdminForAction(ADMIN_PELADAS_PATH);

  const data = parsePeladaFormData(formData);

  await prisma.pelada.create({
    data,
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=create`);
}

export async function updatePelada(formData: FormData) {
  await requireAdminForAction(ADMIN_PELADAS_PATH);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Pelada não encontrada.");
  }

  const data = parsePeladaFormData(formData);

  await prisma.pelada.update({
    where: { id },
    data,
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=update`);
}

export async function updatePeladaStatus(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const returnTo = getSafeReturnTo(formData, ADMIN_PELADAS_PATH);

  await requireAdminForAction(returnTo);

  if (!id) {
    throw new Error("Pelada não encontrada.");
  }

  if (!["ABERTA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"].includes(status)) {
    throw new Error("Status de pelada inválido.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.pelada.update({
      where: { id },
      data: {
        status: status as "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA",
      },
    });

    if (status === "FINALIZADA" || status === "CANCELADA") {
      const txWithRounds = tx as unknown as {
        peladaRound: {
          updateMany(args: unknown): Promise<unknown>;
        };
      };

      await txWithRounds.peladaRound.updateMany({
        where: {
          peladaId: id,
          status: "ATIVA",
        },
        data: {
          status: "FINALIZADA",
        },
      });
    }
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "status-update",
    }),
  );
}

export async function deletePelada(formData: FormData) {
  await requireAdminForAction(ADMIN_PELADAS_PATH);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Pelada não encontrada.");
  }

  await prisma.pelada.delete({
    where: { id },
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=delete`);
}

function getSafeReturnTo(
  formData: FormData,
  fallback: string,
) {
  const returnTo = String(formData.get("returnTo") || "").trim();

  if (returnTo.startsWith(ADMIN_PELADAS_PATH)) {
    return returnTo;
  }

  return fallback;
}

function buildRedirectPath(path: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params);
  const query = search.toString();

  return `${path}${query ? `?${query}` : ""}`;
}

async function getPeladaConfirmationOrRedirect(args: {
  peladaId: string;
  confirmationId: string;
  returnTo: string;
}) {
  const confirmation = await prisma.peladaConfirmation.findUnique({
    where: { id: args.confirmationId },
    select: {
      id: true,
      peladaId: true,
      parentConfirmationId: true,
      guestOrder: true,
      fullName: true,
      preferredPosition: true,
      guestCount: true,
      createdByAdmin: true,
      parentConfirmation: {
        select: {
          id: true,
          guestCount: true,
        },
      },
    },
  });

  if (!confirmation || confirmation.peladaId !== args.peladaId) {
    redirect(
      buildRedirectPath(args.returnTo, {
        error: "Confirmado não encontrado para esta pelada.",
      }),
    );
  }

  return confirmation;
}

async function getPeladaArrivalOrRedirect(args: {
  peladaId: string;
  arrivalId: string;
  returnTo: string;
}) {
  const arrival = await prisma.peladaArrival.findUnique({
    where: { id: args.arrivalId },
    select: {
      id: true,
      peladaId: true,
      confirmationId: true,
    },
  });

  if (!arrival || arrival.peladaId !== args.peladaId) {
    redirect(
      buildRedirectPath(args.returnTo, {
        error: "Chegada não encontrada para esta pelada.",
      }),
    );
  }

  return arrival;
}

async function getPeladaRoundOrRedirect(args: {
  peladaId: string;
  roundId: string;
  returnTo: string;
}) {
  const prismaWithRounds = prisma as unknown as {
    peladaRound: {
      findUnique(args: unknown): Promise<{
        id: string;
        peladaId: string;
      } | null>;
    };
  };

  const round = await prismaWithRounds.peladaRound.findUnique({
    where: { id: args.roundId },
    select: {
      id: true,
      peladaId: true,
    },
  });

  if (!round || round.peladaId !== args.peladaId) {
    redirect(
      buildRedirectPath(args.returnTo, {
        error: "Pelada do dia não encontrada para este evento.",
      }),
    );
  }

  return round;
}

async function assertArrivalOrderAvailable(args: {
  peladaId: string;
  arrivalOrder: number;
  returnTo: string;
  arrivalId?: string;
}) {
  const conflict = await prisma.peladaArrival.findFirst({
    where: {
      peladaId: args.peladaId,
      arrivalOrder: args.arrivalOrder,
      ...(args.arrivalId
        ? {
            id: {
              not: args.arrivalId,
            },
          }
        : {}),
    },
    select: { id: true },
  });

  if (conflict) {
    redirect(
      buildRedirectPath(args.returnTo, {
        error: "Esta ordem de chegada já está sendo usada por outro jogador.",
      }),
    );
  }
}

async function clearPeladaTeamsState(peladaId: string) {
  await prisma.$transaction(async (tx) => {
    const txWithRoundPlayers = tx as unknown as {
      peladaTeamAssignment: {
        deleteMany(args: unknown): Promise<unknown>;
      };
      peladaRoundPlayer: {
        updateMany(args: unknown): Promise<unknown>;
      };
    };

    await txWithRoundPlayers.peladaTeamAssignment.deleteMany({
      where: { peladaId },
    });

    await txWithRoundPlayers.peladaRoundPlayer.updateMany({
      where: {
        round: {
          peladaId,
          status: "ATIVA",
        },
      },
      data: {
        teamColor: null,
      },
    });
  });
}

async function syncPeladaRoundScoreWithGoals(roundId: string) {
  const goals = await prisma.peladaRoundGoal.findMany({
    where: {
      roundId,
    },
    select: {
      teamColor: true,
    },
  });

  const blackScore = goals.filter((goal) => goal.teamColor === "PRETO").length;
  const yellowScore = goals.filter((goal) => goal.teamColor === "AMARELO").length;

  const prismaWithRoundResult = prisma as unknown as {
    peladaRound: {
      update(args: unknown): Promise<unknown>;
    };
  };

  await prismaWithRoundResult.peladaRound.update({
    where: { id: roundId },
    data: {
      blackScore,
      yellowScore,
    },
  });
}

async function requireAdminForAction(returnTo: string) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthDatabaseUnavailableError) {
      redirect(
        buildRedirectPath(returnTo, {
          error:
            "Não foi possível conectar ao banco agora. Tente novamente em instantes.",
        }),
      );
    }

    throw error;
  }
}

async function getPeladaStatusOrRedirect(args: {
  peladaId: string;
  returnTo: string;
}) {
  const pelada = await prisma.pelada.findUnique({
    where: { id: args.peladaId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!pelada) {
    redirect(
      buildRedirectPath(args.returnTo, {
        error: "Pelada não encontrada.",
      }),
    );
  }

  return pelada;
}

function assertPeladaStatusAllowed(args: {
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
  allowed: Array<"ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA">;
  returnTo: string;
  customMessage?: string;
}) {
  if (args.allowed.includes(args.status)) {
    return;
  }

  redirect(
    buildRedirectPath(args.returnTo, {
      error:
        args.customMessage ||
        `Esta ação não está disponível quando a pelada está ${args.status.toLowerCase().replace("_", " ")}.`,
    }),
  );
}

type ActionArrival = {
  id: string;
  fullName: string;
  isGuest: boolean;
  guestInvitedBy: string | null;
  preferredPosition: "GOLEIRO" | "LATERAL" | "ZAGUEIRO" | "VOLANTE" | "MEIA" | "ATACANTE";
  age: number | null;
  arrivalOrder: number;
  arrivedAt: Date;
  playsFirstGame: boolean;
  availableForNextRound: boolean;
  outForDay: boolean;
  level: "A" | "B" | "C" | "D" | "E" | null;
};

type ActionRound = {
  id: string;
  roundNumber: number;
  status?: "ATIVA" | "FINALIZADA";
  players: Array<{
    arrivalId: string;
    queueOrder: number;
  }>;
};

type ActionPeladaForTeams = {
  id: string;
  type: "CAMPINHO" | "CAMPAO";
  linePlayersCount: number;
  maxFirstGamePlayers: number | null;
  firstGameRule: "SORTEIO" | "ORDEM_DE_CHEGADA";
  arrivalCutoffTime: string | null;
  scheduledAt: Date;
  arrivals: ActionArrival[];
  rounds: ActionRound[];
  teamAssignments?: Array<{
    id: string;
  }>;
};

const peladaDelegate = prisma.pelada as unknown as {
  findUnique(args: unknown): Promise<ActionPeladaForTeams | null>;
};

const peladaArrivalDelegate = prisma.peladaArrival as unknown as {
  update(args: unknown): Promise<unknown>;
};

const prismaWithRounds = prisma as unknown as {
  peladaRound: {
    updateMany(args: unknown): Promise<unknown>;
  };
};

function parseConfirmationFormData(formData: FormData) {
  const athleteProfileIdRaw = String(formData.get("athleteProfileId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const ageValue = String(formData.get("age") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const guestCount = Number.parseInt(
    String(formData.get("guestCount") || "0").trim(),
    10,
  );
  const goalkeeperSide = String(formData.get("goalkeeperSide") || "").trim();

  if (!fullName) {
    throw new Error("Informe o nome completo do confirmado.");
  }

  if (!preferredPosition) {
    throw new Error("Selecione a posição do confirmado.");
  }

  const age = ageValue ? Number.parseInt(ageValue, 10) : null;

  if (age !== null && (!Number.isInteger(age) || age <= 0 || age > 99)) {
    throw new Error("Informe uma idade válida para o confirmado.");
  }

  if (level && !["A", "B", "C", "D", "E"].includes(level)) {
    throw new Error("Selecione um nível válido.");
  }

  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 5) {
    throw new Error("A quantidade de convidados deve ficar entre 0 e 5.");
  }

  if (
    goalkeeperSide &&
    goalkeeperSide !== "GOLEIRO_A" &&
    goalkeeperSide !== "GOLEIRO_B"
  ) {
    throw new Error("Selecione um goleiro válido.");
  }

  return {
    athleteProfileId: athleteProfileIdRaw || null,
    fullName,
    preferredPosition: preferredPosition as
      | "GOLEIRO"
      | "LATERAL"
      | "ZAGUEIRO"
      | "VOLANTE"
      | "MEIA"
      | "ATACANTE",
    age,
    level: level ? (level as "A" | "B" | "C" | "D" | "E") : null,
    guestCount,
    goalkeeperSide: goalkeeperSide
      ? (goalkeeperSide as "GOLEIRO_A" | "GOLEIRO_B")
      : null,
  };
}

export async function createAdminPeladaConfirmation(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível mexer nos confirmados quando a pelada está finalizada ou cancelada.",
  });

  let data;

  try {
    data = parseConfirmationFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível adicionar o confirmado.";
    redirect(
      buildRedirectPath(returnTo, {
        error: message,
      }),
    );
  }

  const athleteProfileId = await syncAthleteProfileFromPeladaConfirmation({
    athleteProfileId: data.athleteProfileId,
    fullName: data.fullName,
    preferredPosition: data.preferredPosition,
    age: data.age,
    level: data.level,
  });

  const confirmation = await prisma.peladaConfirmation.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      athleteProfile: {
        connect: {
          id: athleteProfileId,
        },
      },
      fullName: data.fullName,
      preferredPosition: data.preferredPosition,
      age: data.age,
      level: data.level,
      cancelToken: generateCancelToken(),
      guestCount: data.guestCount,
      goalkeeperSide: data.goalkeeperSide,
      createdByAdmin: true,
    },
  });

  await syncGuestConfirmations({
    confirmationId: confirmation.id,
    peladaId,
    hostFullName: confirmation.fullName,
    preferredPosition: confirmation.preferredPosition,
    guestCount: confirmation.guestCount,
    createdByAdmin: true,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "confirmed-add",
    }),
  );
}

export async function updateAdminPeladaConfirmation(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível mexer nos confirmados quando a pelada está finalizada ou cancelada.",
  });

  let data;

  try {
    data = parseConfirmationFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o confirmado.";
    redirect(
      buildRedirectPath(returnTo, {
        error: message,
      }),
    );
  }

  const existingConfirmation = await getPeladaConfirmationOrRedirect({
    peladaId,
    confirmationId,
    returnTo,
  });

  if (!existingConfirmation.parentConfirmationId) {
    const guestsWithArrivalCount = await prisma.peladaConfirmation.count({
      where: {
        parentConfirmationId: confirmationId,
        arrivals: {
          some: {},
        },
      },
    });

  if (data.guestCount < guestsWithArrivalCount) {
      redirect(
        buildRedirectPath(returnTo, {
          error:
            "Não é possível reduzir a quantidade de convidados porque um dos convidados já foi marcado como chegada.",
        }),
      );
    }
  }

  const athleteProfileId = await syncAthleteProfileFromPeladaConfirmation({
    athleteProfileId: data.athleteProfileId,
    fullName: data.fullName,
    preferredPosition: data.preferredPosition,
    age: data.age,
    level: data.level,
  });

  const confirmation = await prisma.peladaConfirmation.update({
    where: { id: confirmationId },
    data: {
      fullName: data.fullName,
      preferredPosition: data.preferredPosition,
      age: data.age,
      level: data.level,
      guestCount: data.guestCount,
      goalkeeperSide: data.goalkeeperSide,
      athleteProfile: {
        connect: {
          id: athleteProfileId,
        },
      },
    },
  });

  if (!confirmation.parentConfirmationId) {
    try {
      await syncGuestConfirmations({
        confirmationId: confirmation.id,
        peladaId,
        hostFullName: confirmation.fullName,
        preferredPosition: confirmation.preferredPosition,
        guestCount: confirmation.guestCount,
        createdByAdmin: confirmation.createdByAdmin,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os convidados deste confirmado.";
      redirect(
        buildRedirectPath(returnTo, {
          error: message,
        }),
      );
    }
  }

  redirect(
    buildRedirectPath(returnTo, {
      success: "confirmed-update",
    }),
  );
}

export async function addGuestToAdminPeladaConfirmation(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível adicionar convidado quando a pelada está finalizada ou cancelada.",
  });

  const confirmation = await getPeladaConfirmationOrRedirect({
    peladaId,
    confirmationId,
    returnTo,
  });

  if (confirmation.parentConfirmationId) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Só é possível adicionar convidado a um confirmado principal.",
      }),
    );
  }

  if (confirmation.guestCount >= 5) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Cada confirmado pode ter no máximo 5 convidados.",
      }),
    );
  }

  const updatedConfirmation = await prisma.peladaConfirmation.update({
    where: { id: confirmationId },
    data: {
      guestCount: confirmation.guestCount + 1,
    },
  });

  await syncGuestConfirmations({
    confirmationId: updatedConfirmation.id,
    peladaId,
    hostFullName: updatedConfirmation.fullName,
    preferredPosition: updatedConfirmation.preferredPosition,
    guestCount: updatedConfirmation.guestCount,
    createdByAdmin: updatedConfirmation.createdByAdmin,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "guest-add",
    }),
  );
}

export async function deleteAdminPeladaConfirmation(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível mexer nos confirmados quando a pelada está finalizada ou cancelada.",
  });

  const confirmation = await getPeladaConfirmationOrRedirect({
    peladaId,
    confirmationId,
    returnTo,
  });

  const confirmationWithDependencies = await prisma.peladaConfirmation.findUnique({
    where: { id: confirmationId },
    select: {
      id: true,
      arrivals: {
        select: { id: true },
      },
      guests: {
        select: {
          id: true,
          arrivals: {
            select: { id: true },
          },
        },
      },
    },
  });

  const hasArrivalDependencies =
    (confirmationWithDependencies?.arrivals.length || 0) > 0 ||
    (confirmationWithDependencies?.guests.some((guest) => guest.arrivals.length > 0) ||
      false);

  if (hasArrivalDependencies) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          "Não é possível excluir este confirmado porque ele ou um dos convidados já foi marcado como chegada.",
      }),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.peladaConfirmation.delete({
      where: { id: confirmationId },
    });

    if (confirmation.parentConfirmationId && confirmation.parentConfirmation) {
      const remainingGuests = await tx.peladaConfirmation.findMany({
        where: {
          parentConfirmationId: confirmation.parentConfirmationId,
        },
        orderBy: { guestOrder: "asc" },
        select: {
          id: true,
        },
      });

      await Promise.all(
        remainingGuests.map((guest, index) =>
          tx.peladaConfirmation.update({
            where: { id: guest.id },
            data: { guestOrder: index + 1 },
          }),
        ),
      );

      await tx.peladaConfirmation.update({
        where: { id: confirmation.parentConfirmationId },
        data: {
          guestCount: remainingGuests.length,
        },
      });
    }
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "confirmed-delete",
    }),
  );
}

async function getNextArrivalOrder(peladaId: string) {
  const lastArrival = await prisma.peladaArrival.findFirst({
    where: { peladaId },
    orderBy: { arrivalOrder: "desc" },
    select: { arrivalOrder: true },
  });

  return (lastArrival?.arrivalOrder || 0) + 1;
}

function parseArrivalFormData(formData: FormData) {
  const athleteProfileIdRaw = String(formData.get("athleteProfileId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const isGuest = formData.get("isGuest") === "on";
  const guestInvitedBy = String(formData.get("guestInvitedBy") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const age = Number.parseInt(String(formData.get("age") || "").trim(), 10);
  const arrivalOrder = Number.parseInt(
    String(formData.get("arrivalOrder") || "").trim(),
    10,
  );
  const arrivedAtRaw = String(formData.get("arrivedAt") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const playsFirstGame = formData.get("playsFirstGame") === "on";
  const playsSecondGame = formData.get("playsSecondGame") === "on";

  if (!fullName) {
    throw new Error("Informe o nome do jogador que chegou.");
  }

  if (guestInvitedBy && !isGuest) {
    throw new Error("Marque que o jogador é convidado para informar quem convidou.");
  }

  if (!preferredPosition) {
    throw new Error("Selecione a posição do jogador que chegou.");
  }

  if (!Number.isInteger(age) || age <= 0 || age > 99) {
    throw new Error("Informe uma idade válida para o jogador que chegou.");
  }

  if (!Number.isInteger(arrivalOrder) || arrivalOrder <= 0) {
    throw new Error("A ordem de chegada precisa ser um número válido.");
  }

  const arrivedAt = parseClubDateTimeLocalInput(arrivedAtRaw);

  if (!arrivedAtRaw || Number.isNaN(arrivedAt.getTime())) {
    throw new Error("Informe um horário de chegada válido.");
  }

  if (level && !["A", "B", "C", "D", "E"].includes(level)) {
    throw new Error("Selecione um nível válido.");
  }

  return {
    athleteProfileId: athleteProfileIdRaw || null,
    fullName,
    isGuest,
    guestInvitedBy: isGuest ? guestInvitedBy || null : null,
    preferredPosition: preferredPosition as
      | "GOLEIRO"
      | "LATERAL"
      | "ZAGUEIRO"
      | "VOLANTE"
      | "MEIA"
      | "ATACANTE",
    age,
    arrivalOrder,
    arrivedAt,
    level: level ? (level as "A" | "B" | "C" | "D" | "E") : null,
    playsFirstGame,
    playsSecondGame,
  };
}

export async function registerArrivalFromConfirmation(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível registrar chegadas quando a pelada está finalizada ou cancelada.",
  });

  const existingArrival = await prisma.peladaArrival.findFirst({
    where: {
      peladaId,
      confirmationId,
    },
    select: { id: true },
  });

  if (existingArrival) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Este confirmado já foi marcado como chegada.",
      }),
    );
  }

  const confirmation = await prisma.peladaConfirmation.findUnique({
    where: { id: confirmationId },
    include: {
      athleteProfile: {
        select: {
          id: true,
          birthDate: true,
          lastKnownAge: true,
          defaultLevel: true,
        },
      },
      parentConfirmation: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!confirmation || confirmation.peladaId !== peladaId) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Confirmado não encontrado para esta pelada.",
      }),
    );
  }

  const arrivalOrder = await getNextArrivalOrder(peladaId);

  await prisma.peladaArrival.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      confirmation: {
        connect: {
          id: confirmationId,
        },
      },
      athleteProfile: confirmation.athleteProfile
        ? {
            connect: {
              id: confirmation.athleteProfile.id,
            },
          }
        : undefined,
      fullName: confirmation.fullName,
      isGuest: Boolean(confirmation.parentConfirmationId),
      guestInvitedBy: confirmation.parentConfirmation?.fullName || null,
      preferredPosition: confirmation.preferredPosition,
      age:
        confirmation.age ??
        getAthleteProfileAge(confirmation.athleteProfile || {}) ??
        null,
      arrivalOrder,
      arrivedAt: new Date(),
      level: confirmation.level ?? confirmation.athleteProfile?.defaultLevel ?? null,
    },
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-add",
    }),
  );
}

export async function createManualPeladaArrival(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível registrar chegadas quando a pelada está finalizada ou cancelada.",
  });

  let data;

  try {
    data = parseArrivalFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível registrar a chegada.";
    redirect(
      buildRedirectPath(returnTo, {
        error: message,
      }),
    );
  }

  await assertArrivalOrderAvailable({
    peladaId,
    arrivalOrder: data.arrivalOrder,
    returnTo,
  });

  const athleteProfileId = await syncAthleteProfileFromPeladaArrival({
    athleteProfileId: data.athleteProfileId,
    fullName: data.fullName,
    preferredPosition: data.preferredPosition,
    age: data.age,
  });

  await prisma.peladaArrival.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      athleteProfile: {
        connect: {
          id: athleteProfileId,
        },
      },
      fullName: data.fullName,
      isGuest: data.isGuest,
      guestInvitedBy: data.guestInvitedBy,
      preferredPosition: data.preferredPosition,
      age: data.age,
      arrivalOrder: data.arrivalOrder,
      arrivedAt: data.arrivedAt,
      level: data.level,
      playsFirstGame: data.playsFirstGame,
      playsSecondGame: data.playsSecondGame,
    },
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-add",
    }),
  );
}

export async function updatePeladaArrival(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !arrivalId) {
    throw new Error("Chegada não encontrada.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível editar chegadas quando a pelada está finalizada ou cancelada.",
  });

  let data;

  try {
    data = parseArrivalFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar a chegada.";
    redirect(
      buildRedirectPath(returnTo, {
        error: message,
      }),
    );
  }

  await getPeladaArrivalOrRedirect({
    peladaId,
    arrivalId,
    returnTo,
  });

  await assertArrivalOrderAvailable({
    peladaId,
    arrivalOrder: data.arrivalOrder,
    arrivalId,
    returnTo,
  });

  const athleteProfileId = await syncAthleteProfileFromPeladaArrival({
    athleteProfileId: data.athleteProfileId,
    fullName: data.fullName,
    preferredPosition: data.preferredPosition,
    age: data.age,
  });

  await prisma.peladaArrival.update({
    where: { id: arrivalId },
    data: {
      fullName: data.fullName,
      isGuest: data.isGuest,
      guestInvitedBy: data.guestInvitedBy,
      preferredPosition: data.preferredPosition,
      age: data.age,
      arrivalOrder: data.arrivalOrder,
      arrivedAt: data.arrivedAt,
      level: data.level,
      playsFirstGame: data.playsFirstGame,
      playsSecondGame: data.playsSecondGame,
      athleteProfile: {
        connect: {
          id: athleteProfileId,
        },
      },
    },
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-update",
    }),
  );
}

export async function deletePeladaArrival(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !arrivalId) {
    throw new Error("Chegada não encontrada.");
  }

  const pelada = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: pelada.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível editar chegadas quando a pelada está finalizada ou cancelada.",
  });

  await getPeladaArrivalOrRedirect({
    peladaId,
    arrivalId,
    returnTo,
  });

  await prisma.peladaArrival.delete({
    where: { id: arrivalId },
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-delete",
    }),
  );
}

function shuffleArray<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function buildCutoffDate(scheduledAt: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  const cutoff = new Date(scheduledAt);
  cutoff.setHours(hours, minutes, 0, 0);
  return cutoff;
}

function preparePeladaTeamsForArrivals(args: {
  peladaId: string;
  arrivals: ActionArrival[];
  linePlayersCount: number;
  variationSeed?: number;
}) {
  const result = buildPeladaTeams(args.arrivals, args.linePlayersCount, {
    variationSeed: args.variationSeed,
  });

  if (result.assignments.length === 0) {
    return {
      success: false as const,
      warning:
        result.warnings[0] || "Não foi possível gerar os times agora.",
      assignments: [] as typeof result.assignments,
    };
  }

  return {
    success: true as const,
    warning: buildPeladaTeamsWarningsSummary(result.warnings),
    assignments: result.assignments,
  };
}

async function persistPreparedPeladaTeams(args: {
  peladaId: string;
  assignments: Array<Record<string, unknown>>;
  roundId?: string | null;
  tx?: {
    peladaTeamAssignment: {
      deleteMany(args: unknown): Promise<unknown>;
      createMany(args: unknown): Promise<unknown>;
    };
    peladaRoundPlayer?: unknown;
  };
}) {
  const persistAssignments = async (txWithRoundPlayers: {
    peladaTeamAssignment: {
      deleteMany(args: unknown): Promise<unknown>;
      createMany(args: unknown): Promise<unknown>;
    };
    peladaRoundPlayer?: unknown;
  }) => {
    await txWithRoundPlayers.peladaTeamAssignment.deleteMany({
      where: { peladaId: args.peladaId },
    });

    await txWithRoundPlayers.peladaTeamAssignment.createMany({
      data: args.assignments.map((assignment) => ({
        ...assignment,
        peladaId: args.peladaId,
      })),
    });

    const roundPlayerDelegate =
      txWithRoundPlayers.peladaRoundPlayer &&
      typeof txWithRoundPlayers.peladaRoundPlayer === "object" &&
      "updateMany" in txWithRoundPlayers.peladaRoundPlayer
        ? (txWithRoundPlayers.peladaRoundPlayer as {
            updateMany(args: unknown): Promise<unknown>;
          })
        : null;

    if (args.roundId && roundPlayerDelegate) {
      await Promise.all(
        args.assignments.map((assignment) =>
          roundPlayerDelegate.updateMany({
            where: {
              roundId: args.roundId ?? undefined,
              arrivalId: assignment.arrivalId,
            },
            data: {
              teamColor: assignment.teamColor,
            },
          }),
        ),
      );
    }
  };

  if (args.tx) {
    await persistAssignments(args.tx);
  } else {
    await prisma.$transaction(async (tx) => {
      const txWithRoundPlayers = tx as unknown as {
        peladaTeamAssignment: {
          deleteMany(args: unknown): Promise<unknown>;
          createMany(args: unknown): Promise<unknown>;
        };
        peladaRoundPlayer?: unknown;
      };

      await persistAssignments(txWithRoundPlayers);
    });
  }
}

export async function defineFirstGame(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível definir a primeira pelada quando o evento está finalizado ou cancelado.",
  });

  const pelada = await peladaDelegate.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  const limit = getFirstGamePlayersLimit(pelada);

  if (pelada.arrivals.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Registre pelo menos uma chegada antes de definir a primeira pelada.",
      }),
    );
  }

  let firstGameIds: string[] = [];

  if (pelada.firstGameRule === "SORTEIO") {
    const cutoff =
      pelada.arrivalCutoffTime
        ? buildCutoffDate(pelada.scheduledAt, pelada.arrivalCutoffTime)
        : null;
    const eligibleArrivals = (cutoff
      ? pelada.arrivals.filter((arrival) => arrival.arrivedAt <= cutoff)
      : pelada.arrivals).filter((arrival) =>
      isLinePlayerPosition(arrival.preferredPosition),
    );

    if (eligibleArrivals.length === 0) {
      redirect(
        buildRedirectPath(returnTo, {
          error: "Nenhum jogador chegou dentro do horário limite para participar do sorteio.",
        }),
      );
    }

    firstGameIds = shuffleArray(eligibleArrivals)
      .slice(0, limit)
      .map((arrival) => arrival.id);
  } else {
    firstGameIds = pelada.arrivals
      .filter((arrival) => isLinePlayerPosition(arrival.preferredPosition))
      .slice(0, limit)
      .map((arrival) => arrival.id);
  }

  await prisma.$transaction(
    pelada.arrivals.map((arrival) =>
      prisma.peladaArrival.update({
        where: { id: arrival.id },
        data: {
          playsFirstGame: firstGameIds.includes(arrival.id),
          playsSecondGame: !firstGameIds.includes(arrival.id),
        },
      }),
    ),
  );

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success:
        pelada.firstGameRule === "SORTEIO"
          ? "first-game-draw"
          : "first-game-order",
    }),
  );
}

export async function generatePeladaTeams(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível dividir times quando a pelada está finalizada ou cancelada.",
  });

  const pelada = await peladaDelegate.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
      },
      rounds: {
        where: {
          status: "ATIVA",
        },
        orderBy: {
          roundNumber: "desc",
        },
        take: 1,
        include: {
          players: true,
        },
      },
      teamAssignments: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  const activeRound = pelada.rounds[0] || null;

  const explicitFirstGameArrivals = pelada.arrivals.filter((arrival) =>
    activeRound
      ? activeRound.players.some((player) => player.arrivalId === arrival.id)
      : arrival.playsFirstGame,
  );

  const inferredFirstGameArrivals =
    pelada.type === "CAMPAO" && explicitFirstGameArrivals.length === 0
      ? pelada.arrivals
          .filter((arrival) => isLinePlayerPosition(arrival.preferredPosition))
          .slice(0, getFirstGamePlayersLimit(pelada))
      : explicitFirstGameArrivals;

  if (inferredFirstGameArrivals.length < 2) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          pelada.type === "CAMPAO"
            ? "Registre as chegadas para que o sistema use os primeiros da lista na divisão."
            : "Defina primeiro quem joga a primeira pelada para gerar os times.",
      }),
    );
  }

  const teamPreparation = preparePeladaTeamsForArrivals({
    peladaId,
    arrivals: inferredFirstGameArrivals,
    linePlayersCount: pelada.linePlayersCount,
    variationSeed: (pelada.teamAssignments?.length || 0) > 0 ? Date.now() : 0,
  });

  if (!teamPreparation.success) {
    redirect(
      buildRedirectPath(returnTo, {
        warning: teamPreparation.warning,
      }),
    );
  }

  await persistPreparedPeladaTeams({
    peladaId,
    assignments: teamPreparation.assignments,
    roundId: activeRound?.id || null,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-generated",
      ...(teamPreparation.warning
        ? { warning: teamPreparation.warning }
        : {}),
    }),
  );
}

export async function openFirstPeladaRoundAndGenerateTeams(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível subir a pelada do dia quando o evento está finalizado ou cancelado.",
  });

  const pelada = await prisma.pelada.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
      },
      rounds: {
        orderBy: {
          roundNumber: "desc",
        },
        take: 1,
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  if (pelada.rounds.length > 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "A primeira pelada do dia já foi criada.",
      }),
    );
  }

  const explicitFirstGameArrivals = pelada.arrivals.filter(
    (arrival) => arrival.playsFirstGame,
  );

  const firstRoundArrivals =
    pelada.type === "CAMPAO" && explicitFirstGameArrivals.length === 0
      ? pelada.arrivals
          .filter((arrival) => isLinePlayerPosition(arrival.preferredPosition))
          .slice(0, getFirstGamePlayersLimit(pelada))
      : explicitFirstGameArrivals;

  if (firstRoundArrivals.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          pelada.type === "CAMPAO"
            ? "Registre as chegadas para subir a primeira pelada."
            : "Defina primeiro quem joga a primeira pelada.",
      }),
    );
  }

  const preparedTeamResult = preparePeladaTeamsForArrivals({
    peladaId,
    arrivals: firstRoundArrivals,
    linePlayersCount: pelada.linePlayersCount,
  });

  if (!preparedTeamResult.success) {
    redirect(
      buildRedirectPath(returnTo, {
        warning: preparedTeamResult.warning,
      }),
    );
  }

  await prisma.$transaction(async (tx) => {
    const txWithRounds = tx as unknown as {
      peladaRound: {
        create(args: unknown): Promise<{ id: string }>;
      };
      peladaRoundPlayer: {
        createMany(args: unknown): Promise<unknown>;
      };
      peladaTeamAssignment: {
        deleteMany(args: unknown): Promise<unknown>;
        createMany(args: unknown): Promise<unknown>;
      };
    };

    const round = await txWithRounds.peladaRound.create({
      data: {
        pelada: {
          connect: {
            id: peladaId,
          },
        },
        startedAt: null,
        roundNumber: 1,
      },
    });

    await txWithRounds.peladaRoundPlayer.createMany({
      data: firstRoundArrivals.map((arrival, index) => ({
        roundId: round.id,
        arrivalId: arrival.id,
        source: "FILA",
        queueOrder: index + 1,
      })),
    });

    await tx.pelada.update({
      where: { id: peladaId },
      data: {
        status: "EM_ANDAMENTO",
      },
    });

    await persistPreparedPeladaTeams({
      peladaId,
      assignments: preparedTeamResult.assignments,
      roundId: round.id,
      tx: txWithRounds,
    });
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-opened-teams",
      ...(preparedTeamResult.warning ? { warning: preparedTeamResult.warning } : {}),
    }),
  );
}

export async function openFirstPeladaRound(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível subir a pelada do dia quando o evento está finalizado ou cancelado.",
  });

  const pelada = await prisma.pelada.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
      },
      rounds: {
        orderBy: {
          roundNumber: "desc",
        },
        take: 1,
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  if (pelada.rounds.length > 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "A primeira rodada da pelada já foi criada.",
      }),
    );
  }

  const explicitFirstGameArrivals = pelada.arrivals.filter(
    (arrival) => arrival.playsFirstGame,
  );

  const firstRoundArrivals =
    pelada.type === "CAMPAO" && explicitFirstGameArrivals.length === 0
      ? pelada.arrivals
          .filter((arrival) => isLinePlayerPosition(arrival.preferredPosition))
          .slice(0, getFirstGamePlayersLimit(pelada))
      : explicitFirstGameArrivals;

  if (firstRoundArrivals.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          pelada.type === "CAMPAO"
            ? "Registre as chegadas para criar a primeira rodada."
            : "Defina primeiro quem joga a primeira pelada.",
      }),
    );
  }

  await prisma.$transaction(async (tx) => {
    const txWithRounds = tx as unknown as {
      peladaRound: {
        create(args: unknown): Promise<{ id: string }>;
      };
      peladaRoundPlayer: {
        createMany(args: unknown): Promise<unknown>;
      };
    };

    const round = await txWithRounds.peladaRound.create({
      data: {
        pelada: {
          connect: {
            id: peladaId,
          },
        },
        startedAt: null,
        roundNumber: 1,
      },
    });

    await txWithRounds.peladaRoundPlayer.createMany({
      data: firstRoundArrivals.map((arrival, index) => ({
        roundId: round.id,
        arrivalId: arrival.id,
        source: "FILA",
        queueOrder: index + 1,
      })),
    });

    await tx.pelada.update({
      where: { id: peladaId },
      data: {
        status: "EM_ANDAMENTO",
      },
    });
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-opened",
    }),
  );
}

export async function markArrivalAvailableForNextRound(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const available = String(formData.get("available") || "").trim() === "true";
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !arrivalId) {
    throw new Error("Jogador não encontrado.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível mexer na repescagem quando a pelada está finalizada ou cancelada.",
  });

  await getPeladaArrivalOrRedirect({
    peladaId,
    arrivalId,
    returnTo,
  });

  await peladaArrivalDelegate.update({
    where: { id: arrivalId },
    data: {
      availableForNextRound: available,
      ...(available ? { outForDay: false } : {}),
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: available ? "round-availability-on" : "round-availability-clear",
    }),
  );
}

export async function markArrivalOutForDay(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const outForDay = String(formData.get("outForDay") || "").trim() === "true";
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !arrivalId) {
    throw new Error("Jogador não encontrado.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível mexer no status do dia quando a pelada está finalizada ou cancelada.",
  });

  await getPeladaArrivalOrRedirect({
    peladaId,
    arrivalId,
    returnTo,
  });

  await peladaArrivalDelegate.update({
    where: { id: arrivalId },
    data: {
      outForDay,
      ...(outForDay ? { availableForNextRound: false } : {}),
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: outForDay ? "round-out-for-day-on" : "round-out-for-day-off",
    }),
  );
}

export async function startCurrentPeladaRound(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível iniciar a pelada quando o evento está finalizado ou cancelado.",
  });

  const activeRound = await prisma.peladaRound.findFirst({
    where: {
      peladaId,
      status: "ATIVA",
    },
    select: {
      id: true,
      startedAt: true,
    },
  });

  if (!activeRound) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Não há pelada ativa para iniciar agora.",
      }),
    );
  }

  if (activeRound.startedAt) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "A pelada ativa já foi iniciada.",
      }),
    );
  }

  const assignmentsCount = await prisma.peladaTeamAssignment.count({
    where: {
      peladaId,
    },
  });

  if (assignmentsCount === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Divida os times antes de começar a pelada.",
      }),
    );
  }

  await prisma.peladaRound.update({
    where: { id: activeRound.id },
    data: {
      startedAt: new Date(),
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-started",
    }),
  );
}

export async function closeCurrentPeladaRound(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível encerrar pelada quando o evento está finalizado ou cancelado.",
  });

  const activeRound = await prisma.peladaRound.findFirst({
    where: {
      peladaId,
      status: "ATIVA",
    },
    select: {
      id: true,
    },
  });

  if (!activeRound) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Não há pelada ativa para encerrar agora.",
      }),
    );
  }

  await prismaWithRounds.peladaRound.updateMany({
    where: {
      peladaId,
      status: "ATIVA",
    },
    data: {
      status: "FINALIZADA",
    },
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-closed",
    }),
  );
}

export async function generateNextPeladaRound(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível subir a próxima pelada quando o evento está finalizado ou cancelado.",
  });

  const pelada = await peladaDelegate.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: {
          arrivalOrder: "asc",
        },
      },
      rounds: {
        orderBy: {
          roundNumber: "desc",
        },
        take: 1,
        include: {
          players: true,
        },
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  const latestRound = pelada.rounds[0] || null;

  if (!latestRound) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Crie ou defina a primeira pelada antes de montar a próxima.",
      }),
    );
  }

  const selectedPlayers = getNextRoundPlayers({
    pelada,
    arrivals: pelada.arrivals,
    latestRound,
  });

  if (selectedPlayers.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          "Não há jogadores suficientes para montar a próxima pelada. Marque quem topa jogar outra.",
      }),
    );
  }

  const nextRoundNumber = latestRound.roundNumber + 1;

  await prisma.$transaction(async (tx) => {
    const txWithRounds = tx as unknown as {
      peladaRound: {
        update(args: unknown): Promise<unknown>;
        create(args: unknown): Promise<{ id: string }>;
      };
      peladaRoundPlayer: {
        createMany(args: unknown): Promise<unknown>;
      };
      peladaArrival: {
        updateMany(args: unknown): Promise<unknown>;
      };
      peladaTeamAssignment: {
        deleteMany(args: unknown): Promise<unknown>;
      };
    };

    await txWithRounds.peladaRound.update({
      where: { id: latestRound.id },
      data: {
        status: "FINALIZADA",
      },
    });

    const nextRound = await txWithRounds.peladaRound.create({
      data: {
        pelada: {
          connect: {
            id: peladaId,
          },
        },
        startedAt: null,
        roundNumber: nextRoundNumber,
      },
    });

    await txWithRounds.peladaRoundPlayer.createMany({
      data: selectedPlayers.map((player) => ({
        roundId: nextRound.id,
        arrivalId: player.arrivalId,
        source: player.source,
        queueOrder: player.queueOrder,
      })),
    });

    await txWithRounds.peladaArrival.updateMany({
      where: {
        peladaId,
      },
      data: {
        availableForNextRound: false,
      },
    });

    await txWithRounds.peladaTeamAssignment.deleteMany({
      where: { peladaId },
    });

    await tx.pelada.update({
      where: { id: peladaId },
      data: {
        status: "EM_ANDAMENTO",
      },
    });
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-next",
    }),
  );
}

export async function generateNextPeladaRoundAndGenerateTeams(
  formData: FormData,
) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível subir a próxima pelada quando o evento está finalizado ou cancelado.",
  });

  const pelada = await peladaDelegate.findUnique({
    where: { id: peladaId },
    include: {
      arrivals: {
        orderBy: {
          arrivalOrder: "asc",
        },
      },
      rounds: {
        orderBy: {
          roundNumber: "desc",
        },
        take: 1,
        include: {
          players: true,
        },
      },
    },
  });

  if (!pelada) {
    throw new Error("Pelada não encontrada.");
  }

  const latestRound = pelada.rounds[0] || null;

  if (!latestRound) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Crie ou defina a primeira pelada antes de montar a próxima.",
      }),
    );
  }

  const selectedPlayers = getNextRoundPlayers({
    pelada,
    arrivals: pelada.arrivals,
    latestRound,
  });

  if (selectedPlayers.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          "Não há jogadores suficientes para montar a próxima pelada. Marque quem topa jogar outra.",
      }),
    );
  }

  const nextRoundNumber = latestRound.roundNumber + 1;

  const createdRoundId = await prisma.$transaction(async (tx) => {
    const txWithRounds = tx as unknown as {
      peladaRound: {
        update(args: unknown): Promise<unknown>;
        create(args: unknown): Promise<{ id: string }>;
      };
      peladaRoundPlayer: {
        createMany(args: unknown): Promise<unknown>;
      };
      peladaArrival: {
        updateMany(args: unknown): Promise<unknown>;
      };
      peladaTeamAssignment: {
        deleteMany(args: unknown): Promise<unknown>;
      };
    };

    await txWithRounds.peladaRound.update({
      where: { id: latestRound.id },
      data: {
        status: "FINALIZADA",
      },
    });

    const nextRound = await txWithRounds.peladaRound.create({
      data: {
        pelada: {
          connect: {
            id: peladaId,
          },
        },
        startedAt: null,
        roundNumber: nextRoundNumber,
      },
    });

    await txWithRounds.peladaRoundPlayer.createMany({
      data: selectedPlayers.map((player) => ({
        roundId: nextRound.id,
        arrivalId: player.arrivalId,
        source: player.source,
        queueOrder: player.queueOrder,
      })),
    });

    await txWithRounds.peladaArrival.updateMany({
      where: {
        peladaId,
      },
      data: {
        availableForNextRound: false,
      },
    });

    await txWithRounds.peladaTeamAssignment.deleteMany({
      where: { peladaId },
    });

    await tx.pelada.update({
      where: { id: peladaId },
      data: {
        status: "EM_ANDAMENTO",
      },
    });

    return nextRound.id;
  });

  const selectedArrivals = selectedPlayers
    .map((player) =>
      pelada.arrivals.find((arrival) => arrival.id === player.arrivalId),
    )
    .filter((arrival): arrival is ActionArrival => Boolean(arrival));

  const teamPreparation = preparePeladaTeamsForArrivals({
    peladaId,
    arrivals: selectedArrivals,
    linePlayersCount: pelada.linePlayersCount,
  });

  if (!teamPreparation.success) {
    redirect(
      buildRedirectPath(returnTo, {
        warning: teamPreparation.warning,
      }),
    );
  }

  await persistPreparedPeladaTeams({
    peladaId,
    assignments: teamPreparation.assignments,
    roundId: createdRoundId,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-next-teams",
      ...(teamPreparation.warning ? { warning: teamPreparation.warning } : {}),
    }),
  );
}

export async function updatePeladaRoundResult(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const roundId = String(formData.get("roundId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );
  await requireAdminForAction(returnTo);
  const blackScore = Number.parseInt(
    String(formData.get("blackScore") || "0").trim(),
    10,
  );
  const yellowScore = Number.parseInt(
    String(formData.get("yellowScore") || "0").trim(),
    10,
  );
  const notes = String(formData.get("notes") || "").trim();

  if (!peladaId || !roundId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["EM_ANDAMENTO", "FINALIZADA"],
    returnTo,
    customMessage:
      "Só é possível registrar resultado quando a pelada está em andamento ou finalizada.",
  });

  await getPeladaRoundOrRedirect({
    peladaId,
    roundId,
    returnTo,
  });

  if (
    !Number.isInteger(blackScore) ||
    blackScore < 0 ||
    !Number.isInteger(yellowScore) ||
    yellowScore < 0
  ) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Informe um placar válido para os dois times.",
      }),
    );
  }

  const prismaWithRoundResult = prisma as unknown as {
    peladaRound: {
      update(args: unknown): Promise<unknown>;
    };
  };

  await prismaWithRoundResult.peladaRound.update({
    where: { id: roundId },
    data: {
      blackScore,
      yellowScore,
      notes: notes || null,
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-result-update",
    }),
  );
}

export async function createPeladaRoundGoal(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const roundId = String(formData.get("roundId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );
  await requireAdminForAction(returnTo);
  const roundPlayerId = String(formData.get("roundPlayerId") || "").trim();
  const quantityRaw = String(formData.get("quantity") || "1").trim();
  const minuteRaw = String(formData.get("minute") || "").trim();

  if (!peladaId || !roundId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["EM_ANDAMENTO", "FINALIZADA"],
    returnTo,
    customMessage:
      "Só é possível registrar gols quando a pelada está em andamento ou finalizada.",
  });

  await getPeladaRoundOrRedirect({
    peladaId,
    roundId,
    returnTo,
  });

  if (!roundPlayerId) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Selecione o jogador que fez o gol.",
      }),
    );
  }

  const roundPlayer = await prisma.peladaRoundPlayer.findUnique({
    where: { id: roundPlayerId },
    select: {
      id: true,
      roundId: true,
      teamColor: true,
      arrival: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!roundPlayer || roundPlayer.roundId !== roundId) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Não foi possível localizar o jogador dessa pelada.",
      }),
    );
  }

  if (!roundPlayer.teamColor) {
    redirect(
      buildRedirectPath(returnTo, {
        error:
          "Esta pelada ainda não tem os times salvos por jogador. Gere ou refaça a divisão antes de lançar os gols.",
      }),
    );
  }

  const minute = minuteRaw ? Number.parseInt(minuteRaw, 10) : null;
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : 1;

  if (minuteRaw && (!Number.isInteger(minute) || minute! < 0 || minute! > 120)) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Informe um minuto válido para o gol.",
      }),
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Informe uma quantidade válida de gols para o jogador.",
      }),
    );
  }

  const prismaWithRoundGoals = prisma as unknown as {
    peladaRoundGoal: {
      create(args: unknown): Promise<unknown>;
    };
  };

  for (let index = 0; index < quantity; index += 1) {
    await prismaWithRoundGoals.peladaRoundGoal.create({
      data: {
        round: {
          connect: {
            id: roundId,
          },
        },
        scorerName: roundPlayer.arrival.fullName,
        teamColor: roundPlayer.teamColor,
        minute,
      },
    });
  }

  await syncPeladaRoundScoreWithGoals(roundId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-goal-add",
    }),
  );
}

export async function deletePeladaRoundGoal(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const goalId = String(formData.get("goalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );
  await requireAdminForAction(returnTo);

  if (!peladaId || !goalId) {
    throw new Error("Gol não encontrado.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["EM_ANDAMENTO", "FINALIZADA"],
    returnTo,
    customMessage:
      "Só é possível editar gols quando a pelada está em andamento ou finalizada.",
  });

  const goal = await prisma.peladaRoundGoal.findUnique({
    where: { id: goalId },
    select: {
      id: true,
      roundId: true,
      round: {
        select: {
          peladaId: true,
        },
      },
    },
  });

  if (!goal || goal.round.peladaId !== peladaId) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Gol não encontrado para esta pelada.",
      }),
    );
  }

  const prismaWithRoundGoals = prisma as unknown as {
    peladaRoundGoal: {
      delete(args: unknown): Promise<unknown>;
    };
  };

  await prismaWithRoundGoals.peladaRoundGoal.delete({
    where: { id: goalId },
  });

  await syncPeladaRoundScoreWithGoals(goal.roundId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-goal-delete",
    }),
  );
}

export async function swapPeladaTeamPlayers(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const yellowAssignmentId = String(formData.get("yellowAssignmentId") || "").trim();
  const blackAssignmentId = String(formData.get("blackAssignmentId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId || !yellowAssignmentId || !blackAssignmentId) {
    throw new Error("Selecione os dois jogadores para concluir a troca.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível trocar jogadores quando a pelada está finalizada ou cancelada.",
  });

  const assignments = await prisma.peladaTeamAssignment.findMany({
    where: {
      id: {
        in: [yellowAssignmentId, blackAssignmentId],
      },
      peladaId,
    },
  });

  if (assignments.length !== 2) {
    throw new Error("Não foi possível localizar os jogadores da troca.");
  }

  const yellow = assignments.find((assignment) => assignment.id === yellowAssignmentId);
  const black = assignments.find((assignment) => assignment.id === blackAssignmentId);

  if (!yellow || !black) {
    throw new Error("Não foi possível localizar os jogadores da troca.");
  }

  if (yellow.teamColor !== "AMARELO" || black.teamColor !== "PRETO") {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Selecione um jogador do time Amarelo e outro do time Preto.",
      }),
    );
  }

  const activeRound = await prisma.peladaRound.findFirst({
    where: {
      peladaId,
      status: "ATIVA",
    },
    select: {
      id: true,
    },
  });

  const highestDisplayOrderAssignment = await prisma.peladaTeamAssignment.findFirst({
    where: {
      peladaId,
    },
    orderBy: {
      displayOrder: "desc",
    },
    select: {
      displayOrder: true,
    },
  });

  const temporaryDisplayOrder = (highestDisplayOrderAssignment?.displayOrder || 0) + 100;

  await prisma.$transaction(async (tx) => {
    const txWithRoundPlayers = tx as unknown as {
      peladaTeamAssignment: {
        update(args: unknown): Promise<unknown>;
      };
      peladaRoundPlayer: {
        updateMany(args: unknown): Promise<unknown>;
      };
    };

    await txWithRoundPlayers.peladaTeamAssignment.update({
      where: { id: yellow.id },
      data: {
        displayOrder: temporaryDisplayOrder,
      },
    });

    await txWithRoundPlayers.peladaTeamAssignment.update({
      where: { id: black.id },
      data: {
        teamColor: "AMARELO",
        displayOrder: yellow.displayOrder,
      },
    });

    await txWithRoundPlayers.peladaTeamAssignment.update({
      where: { id: yellow.id },
      data: {
        teamColor: "PRETO",
        displayOrder: black.displayOrder,
      },
    });

    if (activeRound) {
      await txWithRoundPlayers.peladaRoundPlayer.updateMany({
        where: {
          roundId: activeRound.id,
          arrivalId: yellow.arrivalId,
        },
        data: {
          teamColor: "PRETO",
        },
      });

      await txWithRoundPlayers.peladaRoundPlayer.updateMany({
        where: {
          roundId: activeRound.id,
          arrivalId: black.arrivalId,
        },
        data: {
          teamColor: "AMARELO",
        },
      });
    }
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-swapped",
    }),
  );
}

export async function clearPeladaTeams(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível limpar a divisão quando a pelada está finalizada ou cancelada.",
  });

  await clearPeladaTeamsState(peladaId);

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-cleared",
    }),
  );
}

export async function resetPeladaProgress(formData: FormData) {
  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  await requireAdminForAction(returnTo);

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  const peladaStatus = await getPeladaStatusOrRedirect({
    peladaId,
    returnTo,
  });

  assertPeladaStatusAllowed({
    status: peladaStatus.status,
    allowed: ["ABERTA", "EM_ANDAMENTO"],
    returnTo,
    customMessage:
      "Não é possível resetar o andamento quando a pelada está finalizada ou cancelada.",
  });

  await prisma.$transaction(async (tx) => {
    const txWithRounds = tx as unknown as {
      peladaRound: {
        deleteMany(args: unknown): Promise<unknown>;
      };
      peladaArrival: {
        updateMany(args: unknown): Promise<unknown>;
      };
      peladaTeamAssignment: {
        deleteMany(args: unknown): Promise<unknown>;
      };
    };

    await txWithRounds.peladaTeamAssignment.deleteMany({
      where: { peladaId },
    });

    await txWithRounds.peladaRound.deleteMany({
      where: { peladaId },
    });

    await txWithRounds.peladaArrival.updateMany({
      where: { peladaId },
      data: {
        availableForNextRound: false,
        outForDay: false,
        playsFirstGame: false,
        playsSecondGame: false,
      },
    });
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "pelada-progress-reset",
    }),
  );
}
