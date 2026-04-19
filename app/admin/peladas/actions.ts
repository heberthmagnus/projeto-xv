"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { syncGuestConfirmations } from "@/lib/pelada-confirmations";
import { getNextRoundPlayers } from "@/lib/pelada-rounds";
import {
  buildPeladaTeams,
  buildPeladaTeamsWarningsSummary,
} from "@/lib/pelada-teams";
import { getFirstGamePlayersLimit } from "@/lib/peladas";
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
  await requireAdmin();

  const data = parsePeladaFormData(formData);

  await prisma.pelada.create({
    data,
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=create`);
}

export async function updatePelada(formData: FormData) {
  await requireAdmin();

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

export async function deletePelada(formData: FormData) {
  await requireAdmin();

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

type ActionArrival = {
  id: string;
  fullName: string;
  preferredPosition: "GOLEIRO" | "LATERAL" | "ZAGUEIRO" | "VOLANTE" | "MEIA" | "ATACANTE";
  age: number | null;
  arrivalOrder: number;
  arrivedAt: Date;
  playsFirstGame: boolean;
  availableForNextRound: boolean;
  level: "A" | "B" | "C" | "D" | "E" | null;
};

type ActionRound = {
  id: string;
  roundNumber: number;
  status?: "ATIVA" | "FINALIZADA";
  players: Array<{
    arrivalId: string;
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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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

  const confirmation = await prisma.peladaConfirmation.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      ...data,
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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

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

  const confirmation = await prisma.peladaConfirmation.update({
    where: { id: confirmationId },
    data,
  });

  if (!confirmation.parentConfirmationId) {
    await syncGuestConfirmations({
      confirmationId: confirmation.id,
      peladaId,
      hostFullName: confirmation.fullName,
      preferredPosition: confirmation.preferredPosition,
      guestCount: confirmation.guestCount,
      createdByAdmin: confirmation.createdByAdmin,
    });
  }

  redirect(
    buildRedirectPath(returnTo, {
      success: "confirmed-update",
    }),
  );
}

export async function deleteAdminPeladaConfirmation(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaConfirmadosPath(peladaId),
  );

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  const confirmation = await prisma.peladaConfirmation.findUnique({
    where: { id: confirmationId },
    select: {
      id: true,
      parentConfirmationId: true,
      guestOrder: true,
      parentConfirmation: {
        select: {
          id: true,
          guestCount: true,
        },
      },
    },
  });

  if (!confirmation) {
    throw new Error("Confirmado não encontrado.");
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
  const fullName = String(formData.get("fullName") || "").trim();
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

  if (!preferredPosition) {
    throw new Error("Selecione a posição do jogador que chegou.");
  }

  if (!Number.isInteger(age) || age <= 0 || age > 99) {
    throw new Error("Informe uma idade válida para o jogador que chegou.");
  }

  if (!Number.isInteger(arrivalOrder) || arrivalOrder <= 0) {
    throw new Error("A ordem de chegada precisa ser um número válido.");
  }

  const arrivedAt = new Date(arrivedAtRaw);

  if (!arrivedAtRaw || Number.isNaN(arrivedAt.getTime())) {
    throw new Error("Informe um horário de chegada válido.");
  }

  if (level && !["A", "B", "C", "D", "E"].includes(level)) {
    throw new Error("Selecione um nível válido.");
  }

  return {
    fullName,
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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

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
  });

  if (!confirmation) {
    throw new Error("Confirmado não encontrado.");
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
      fullName: confirmation.fullName,
      preferredPosition: confirmation.preferredPosition,
      age: confirmation.age,
      arrivalOrder,
      arrivedAt: new Date(),
    },
  });

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-add",
    }),
  );
}

export async function createManualPeladaArrival(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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

  await prisma.peladaArrival.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      ...data,
    },
  });

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-add",
    }),
  );
}

export async function updatePeladaArrival(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  if (!peladaId || !arrivalId) {
    throw new Error("Chegada não encontrada.");
  }

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

  await prisma.peladaArrival.update({
    where: { id: arrivalId },
    data,
  });

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "arrival-update",
    }),
  );
}

export async function deletePeladaArrival(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  if (!peladaId || !arrivalId) {
    throw new Error("Chegada não encontrada.");
  }

  await prisma.peladaArrival.delete({
    where: { id: arrivalId },
  });

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

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

async function persistPeladaTeamsForArrivals(args: {
  peladaId: string;
  arrivals: ActionArrival[];
  linePlayersCount: number;
}) {
  const result = buildPeladaTeams(args.arrivals, args.linePlayersCount);

  if (result.assignments.length === 0) {
    return {
      success: false as const,
      warning:
        result.warnings[0] || "Não foi possível gerar os times agora.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.peladaTeamAssignment.deleteMany({
      where: { peladaId: args.peladaId },
    });

    await tx.peladaTeamAssignment.createMany({
      data: result.assignments.map((assignment) => ({
        ...assignment,
        peladaId: args.peladaId,
      })),
    });
  });

  return {
    success: true as const,
    warning: buildPeladaTeamsWarningsSummary(result.warnings),
  };
}

export async function defineFirstGame(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaChegadaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
    const eligibleArrivals = cutoff
      ? pelada.arrivals.filter((arrival) => arrival.arrivedAt <= cutoff)
      : pelada.arrivals;

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
    firstGameIds = pelada.arrivals.slice(0, limit).map((arrival) => arrival.id);
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

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
      ? pelada.arrivals.slice(0, getFirstGamePlayersLimit(pelada))
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

  const result = buildPeladaTeams(
    inferredFirstGameArrivals,
    pelada.linePlayersCount,
  );

  if (result.assignments.length === 0) {
    redirect(
      buildRedirectPath(returnTo, {
        error: result.warnings[0] || "Não foi possível gerar os times agora.",
      }),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.peladaTeamAssignment.deleteMany({
      where: { peladaId },
    });

    await tx.peladaTeamAssignment.createMany({
      data: result.assignments.map((assignment) => ({
        ...assignment,
        peladaId,
      })),
    });
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-generated",
      ...(buildPeladaTeamsWarningsSummary(result.warnings)
        ? { error: buildPeladaTeamsWarningsSummary(result.warnings)! }
        : {}),
    }),
  );
}

export async function openFirstPeladaRoundAndGenerateTeams(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
      ? pelada.arrivals.slice(0, getFirstGamePlayersLimit(pelada))
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
  });

  const teamResult = await persistPeladaTeamsForArrivals({
    peladaId,
    arrivals: firstRoundArrivals,
    linePlayersCount: pelada.linePlayersCount,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-opened-teams",
      ...(teamResult.warning ? { error: teamResult.warning } : {}),
    }),
  );
}

export async function openFirstPeladaRound(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
      ? pelada.arrivals.slice(0, getFirstGamePlayersLimit(pelada))
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
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-opened",
    }),
  );
}

export async function markArrivalAvailableForNextRound(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const arrivalId = String(formData.get("arrivalId") || "").trim();
  const available = String(formData.get("available") || "").trim() === "true";
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId || !arrivalId) {
    throw new Error("Jogador não encontrado.");
  }

  await peladaArrivalDelegate.update({
    where: { id: arrivalId },
    data: {
      availableForNextRound: available,
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: available ? "round-availability-on" : "round-availability-off",
    }),
  );
}

export async function closeCurrentPeladaRound(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
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

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-closed",
    }),
  );
}

export async function generateNextPeladaRound(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
  });

  const selectedArrivals = selectedPlayers
    .map((player) =>
      pelada.arrivals.find((arrival) => arrival.id === player.arrivalId),
    )
    .filter((arrival): arrival is ActionArrival => Boolean(arrival));

  const teamResult = await persistPeladaTeamsForArrivals({
    peladaId,
    arrivals: selectedArrivals,
    linePlayersCount: pelada.linePlayersCount,
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-next-teams",
      ...(teamResult.warning ? { error: teamResult.warning } : {}),
    }),
  );
}

export async function updatePeladaRoundResult(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const roundId = String(formData.get("roundId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );
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
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const roundId = String(formData.get("roundId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );
  const scorerName = String(formData.get("scorerName") || "").trim();
  const teamColor = String(formData.get("teamColor") || "").trim();
  const minuteRaw = String(formData.get("minute") || "").trim();

  if (!peladaId || !roundId) {
    throw new Error("Pelada não encontrada.");
  }

  if (!scorerName) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Informe quem fez o gol.",
      }),
    );
  }

  if (teamColor !== "PRETO" && teamColor !== "AMARELO") {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Selecione o time do gol.",
      }),
    );
  }

  const minute = minuteRaw ? Number.parseInt(minuteRaw, 10) : null;

  if (minuteRaw && (!Number.isInteger(minute) || minute! < 0 || minute! > 120)) {
    redirect(
      buildRedirectPath(returnTo, {
        error: "Informe um minuto válido para o gol.",
      }),
    );
  }

  const prismaWithRoundGoals = prisma as unknown as {
    peladaRoundGoal: {
      create(args: unknown): Promise<unknown>;
    };
  };

  await prismaWithRoundGoals.peladaRoundGoal.create({
    data: {
      round: {
        connect: {
          id: roundId,
        },
      },
      scorerName,
      teamColor,
      minute,
    },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-goal-add",
    }),
  );
}

export async function deletePeladaRoundGoal(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const goalId = String(formData.get("goalId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaResultadosPath(peladaId),
  );

  if (!peladaId || !goalId) {
    throw new Error("Gol não encontrado.");
  }

  const prismaWithRoundGoals = prisma as unknown as {
    peladaRoundGoal: {
      delete(args: unknown): Promise<unknown>;
    };
  };

  await prismaWithRoundGoals.peladaRoundGoal.delete({
    where: { id: goalId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "round-goal-delete",
    }),
  );
}

export async function swapPeladaTeamPlayers(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const yellowAssignmentId = String(formData.get("yellowAssignmentId") || "").trim();
  const blackAssignmentId = String(formData.get("blackAssignmentId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId || !yellowAssignmentId || !blackAssignmentId) {
    throw new Error("Selecione os dois jogadores para concluir a troca.");
  }

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

  await prisma.$transaction([
    prisma.peladaTeamAssignment.update({
      where: { id: yellow.id },
      data: {
        teamColor: "PRETO",
      },
    }),
    prisma.peladaTeamAssignment.update({
      where: { id: black.id },
      data: {
        teamColor: "AMARELO",
      },
    }),
  ]);

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-swapped",
    }),
  );
}

export async function clearPeladaTeams(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  await prisma.peladaTeamAssignment.deleteMany({
    where: { peladaId },
  });

  redirect(
    buildRedirectPath(returnTo, {
      success: "teams-cleared",
    }),
  );
}

export async function resetPeladaProgress(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const returnTo = getSafeReturnTo(
    formData,
    getAdminPeladaPeladasDoDiaPath(peladaId),
  );

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

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
