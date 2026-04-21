"use server";

import { redirect } from "next/navigation";
import { syncAthleteProfileFromPeladaConfirmation } from "@/lib/athlete-profiles";
import { syncGuestConfirmations } from "@/lib/pelada-confirmations";
import { prisma } from "@/lib/prisma";
import { PeladaConfirmationFormState } from "./form-state";

type Params = {
  peladaId: string;
};

export async function createPeladaConfirmation(
  { peladaId }: Params,
  _prevState: PeladaConfirmationFormState,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const age = Number.parseInt(String(formData.get("age") || "").trim(), 10);
  const guestCount = Number.parseInt(
    String(formData.get("guestCount") || "0").trim(),
    10,
  );

  if (!fullName) {
    return { error: "Informe seu nome ou apelido." };
  }

  if (!preferredPosition) {
    return { error: "Selecione sua posição." };
  }

  if (!Number.isInteger(age) || age <= 0 || age > 99) {
    return { error: "Informe uma idade válida." };
  }

  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 5) {
    return { error: "A quantidade de convidados deve ficar entre 0 e 5." };
  }

  const pelada = await prisma.pelada.findUnique({
    where: { id: peladaId },
    select: { id: true, status: true },
  });

  if (!pelada) {
    return { error: "Pelada não encontrada." };
  }

  if (pelada.status === "FINALIZADA" || pelada.status === "CANCELADA") {
    return { error: "Esta pelada não está mais aberta para confirmação." };
  }

  const athleteProfileId = await syncAthleteProfileFromPeladaConfirmation({
    athleteProfileId: null,
    fullName,
    preferredPosition: preferredPosition as
      | "GOLEIRO"
      | "LATERAL"
      | "ZAGUEIRO"
      | "VOLANTE"
      | "MEIA"
      | "ATACANTE",
    age,
    level: null,
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
      fullName,
      preferredPosition: preferredPosition as
        | "GOLEIRO"
        | "LATERAL"
        | "ZAGUEIRO"
        | "VOLANTE"
        | "MEIA"
        | "ATACANTE",
      age,
      guestCount,
      createdByAdmin: false,
    },
  });

  await syncGuestConfirmations({
    confirmationId: confirmation.id,
    peladaId,
    hostFullName: fullName,
    preferredPosition: preferredPosition as
      | "GOLEIRO"
      | "LATERAL"
      | "ZAGUEIRO"
      | "VOLANTE"
      | "MEIA"
      | "ATACANTE",
    guestCount,
    createdByAdmin: false,
  });

  redirect(`/peladas/${peladaId}/sucesso`);
}
