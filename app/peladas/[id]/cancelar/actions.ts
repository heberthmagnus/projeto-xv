"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type CancelPeladaConfirmationParams = {
  peladaId: string;
};

export async function cancelPeladaConfirmation(
  { peladaId }: CancelPeladaConfirmationParams,
  formData: FormData,
) {
  const token = String(formData.get("token") || "").trim();

  if (!token) {
    redirect(`/peladas/${peladaId}/cancelar?error=invalid`);
  }

  const confirmation = await prisma.peladaConfirmation.findFirst({
    where: {
      peladaId,
      cancelToken: token,
      parentConfirmationId: null,
    },
    select: {
      id: true,
      canceledAt: true,
      guests: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!confirmation) {
    redirect(`/peladas/${peladaId}/cancelar?error=invalid`);
  }

  if (confirmation.canceledAt) {
    redirect(`/peladas/${peladaId}/cancelar?token=${encodeURIComponent(token)}&status=already-canceled`);
  }

  await prisma.peladaConfirmation.updateMany({
    where: {
      id: {
        in: [confirmation.id, ...confirmation.guests.map((guest) => guest.id)],
      },
    },
    data: {
      canceledAt: new Date(),
    },
  });

  revalidatePath(`/peladas/${peladaId}`);
  revalidatePath("/peladas");
  revalidatePath(`/admin/peladas/${peladaId}/confirmados`);
  revalidatePath(`/admin/peladas/${peladaId}/chegada`);

  redirect(`/peladas/${peladaId}/cancelar?token=${encodeURIComponent(token)}&status=success`);
}
