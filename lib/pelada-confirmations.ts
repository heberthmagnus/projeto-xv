import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

type SyncGuestConfirmationsInput = {
  confirmationId: string;
  peladaId: string;
  hostFullName: string;
  preferredPosition:
    | "GOLEIRO"
    | "LATERAL"
    | "ZAGUEIRO"
    | "VOLANTE"
    | "MEIA"
    | "ATACANTE";
  guestCount: number;
  createdByAdmin: boolean;
};

export function buildGuestPlaceholderName(hostFullName: string, guestOrder: number) {
  return `Convidado ${guestOrder} de ${hostFullName}`;
}

export function generateCancelToken() {
  return randomUUID();
}

export async function syncGuestConfirmations({
  confirmationId,
  peladaId,
  hostFullName,
  preferredPosition,
  guestCount,
  createdByAdmin,
}: SyncGuestConfirmationsInput) {
  const existingGuests = await prisma.peladaConfirmation.findMany({
    where: {
      parentConfirmationId: confirmationId,
    },
    include: {
      arrivals: {
        select: { id: true },
      },
    },
    orderBy: { guestOrder: "asc" },
  });

  if (existingGuests.length > guestCount) {
    const guestsToRemove = existingGuests.slice(guestCount);
    const guestWithArrival = guestsToRemove.find((guest) => guest.arrivals.length > 0);

    if (guestWithArrival) {
      throw new Error(
        "Não é possível reduzir a quantidade de convidados porque um dos convidados já foi marcado como chegada.",
      );
    }

    await prisma.peladaConfirmation.deleteMany({
      where: {
        id: {
          in: guestsToRemove.map((guest) => guest.id),
        },
      },
    });
  }

  if (existingGuests.length < guestCount) {
    const payload = Array.from(
      { length: guestCount - existingGuests.length },
      (_, index) => {
        const guestOrder = existingGuests.length + index + 1;

        return {
          peladaId,
          parentConfirmationId: confirmationId,
          cancelToken: generateCancelToken(),
          fullName: buildGuestPlaceholderName(hostFullName, guestOrder),
          preferredPosition,
          age: null,
          level: null,
          guestCount: 0,
          goalkeeperSide: null,
          createdByAdmin,
          guestOrder,
        };
      },
    );

    if (payload.length > 0) {
      await prisma.peladaConfirmation.createMany({
        data: payload,
      });
    }
  }
}
