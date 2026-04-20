import { notFound } from "next/navigation";
import { syncGuestConfirmations } from "@/lib/pelada-confirmations";
import { prisma } from "@/lib/prisma";

export type PageGuestConfirmation = {
  id: string;
  fullName: string;
  preferredPosition: string;
  age: number | null;
  level: "A" | "B" | "C" | "D" | "E" | null;
  createdAt: Date;
  arrivals: Array<{ id: string }>;
};

export type PageConfirmation = {
  id: string;
  fullName: string;
  preferredPosition: string;
  age: number | null;
  level: "A" | "B" | "C" | "D" | "E" | null;
  guestCount: number;
  goalkeeperSide: string | null;
  createdByAdmin: boolean;
  createdAt: Date;
  arrivals: Array<{ id: string }>;
  guests: PageGuestConfirmation[];
};

export type PageArrival = {
  id: string;
  fullName: string;
  isGuest: boolean;
  guestInvitedBy: string | null;
  preferredPosition: string;
  age: number | null;
  level: "A" | "B" | "C" | "D" | "E" | null;
  arrivedAt: Date;
  arrivalOrder: number;
  playsFirstGame: boolean;
  playsSecondGame: boolean;
  availableForNextRound: boolean;
  confirmation: {
    id: string;
    createdByAdmin: boolean;
  } | null;
};

export type PageTeamAssignment = {
  id: string;
  teamColor: "AMARELO" | "PRETO";
  assignedPosition: string | null;
  isFallback: boolean;
  displayOrder: number;
  arrival: PageArrival;
};

export type PageRound = {
  id: string;
  roundNumber: number;
  status: "ATIVA" | "FINALIZADA";
  createdAt: Date;
  blackScore: number;
  yellowScore: number;
  notes: string | null;
  goals: Array<{
    id: string;
    scorerName: string;
    teamColor: "AMARELO" | "PRETO";
    minute: number | null;
  }>;
  players: Array<{
    id: string;
    queueOrder: number;
    source: "FILA" | "REPESCAGEM";
    teamColor: "AMARELO" | "PRETO" | null;
    arrivalId: string;
    arrival: PageArrival;
  }>;
};

export type PeladaAdminData = {
  id: string;
  scheduledAt: Date;
  type: "CAMPINHO" | "CAMPAO";
  firstGameRule: "SORTEIO" | "ORDEM_DE_CHEGADA";
  arrivalCutoffTime: string | null;
  maxFirstGamePlayers: number | null;
  linePlayersCount: number;
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
  notes: string | null;
  confirmations: PageConfirmation[];
  arrivals: PageArrival[];
  teamAssignments: PageTeamAssignment[];
  rounds: PageRound[];
};

export async function loadPeladaAdminData(id: string) {
  const hostConfirmations = await prisma.peladaConfirmation.findMany({
    where: {
      peladaId: id,
      parentConfirmationId: null,
      guestCount: {
        gt: 0,
      },
    },
    select: {
      id: true,
      peladaId: true,
      fullName: true,
      preferredPosition: true,
      guestCount: true,
      createdByAdmin: true,
    },
  });

  await Promise.allSettled(
    hostConfirmations.map((confirmation) =>
      syncGuestConfirmations({
        confirmationId: confirmation.id,
        peladaId: confirmation.peladaId,
        hostFullName: confirmation.fullName,
        preferredPosition: confirmation.preferredPosition,
        guestCount: confirmation.guestCount,
        createdByAdmin: confirmation.createdByAdmin,
      }),
    ),
  );

  const peladaDelegate = prisma.pelada as unknown as {
    findUnique(args: unknown): Promise<PeladaAdminData | null>;
  };

  const pelada = await peladaDelegate.findUnique({
    where: { id },
    include: {
      confirmations: {
        where: {
          parentConfirmationId: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          arrivals: {
            select: { id: true },
          },
          guests: {
            orderBy: { guestOrder: "asc" },
            include: {
              arrivals: {
                select: { id: true },
              },
            },
          },
        },
      },
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
        include: {
          confirmation: {
            select: {
              id: true,
              createdByAdmin: true,
            },
          },
        },
      },
      teamAssignments: {
        orderBy: [{ teamColor: "asc" }, { displayOrder: "asc" }],
        include: {
          arrival: true,
        },
      },
      rounds: {
        orderBy: {
          roundNumber: "desc",
        },
        include: {
          goals: {
            orderBy: [{ teamColor: "asc" }, { createdAt: "asc" }],
          },
          players: {
            orderBy: {
              queueOrder: "asc",
            },
            include: {
              arrival: true,
            },
          },
        },
      },
    },
  });

  if (!pelada) {
    notFound();
  }

  return {
    ...pelada,
    confirmations: Array.isArray(pelada.confirmations)
      ? pelada.confirmations
      : [],
    arrivals: Array.isArray(pelada.arrivals) ? pelada.arrivals : [],
    teamAssignments: Array.isArray(pelada.teamAssignments)
      ? pelada.teamAssignments
      : [],
    rounds: Array.isArray(pelada.rounds) ? pelada.rounds : [],
  };
}

export function formatPeladaDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
