"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncAthleteProfileFromPeladaConfirmation } from "@/lib/athlete-profiles";
import { generateCancelToken } from "@/lib/pelada-confirmations";
import { prisma } from "@/lib/prisma";
import { PeladaConfirmationFormState } from "./form-state";

type Params = {
  peladaId: string;
};

type PreferredPositionValue =
  | "GOLEIRO"
  | "LATERAL"
  | "ZAGUEIRO"
  | "VOLANTE"
  | "MEIA"
  | "ATACANTE";

const preferredPositionValues = new Set<string>([
  "GOLEIRO",
  "LATERAL",
  "ZAGUEIRO",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
]);

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

  const parsedPreferredPosition = parsePreferredPosition(preferredPosition);

  if (!parsedPreferredPosition) {
    return { error: "Selecione uma posição válida." };
  }

  const guests = [];

  for (let guestOrder = 1; guestOrder <= guestCount; guestOrder += 1) {
    const guestFullName = String(
      formData.get(`guestFullName_${guestOrder}`) || "",
    ).trim();
    const guestPreferredPosition = String(
      formData.get(`guestPreferredPosition_${guestOrder}`) || "",
    ).trim();
    const guestAge = Number.parseInt(
      String(formData.get(`guestAge_${guestOrder}`) || "").trim(),
      10,
    );
    const parsedGuestPreferredPosition = parsePreferredPosition(guestPreferredPosition);

    if (!guestFullName) {
      return { error: `Informe o nome ou apelido do convidado ${guestOrder}.` };
    }

    if (!parsedGuestPreferredPosition) {
      return { error: `Selecione a posição do convidado ${guestOrder}.` };
    }

    if (!Number.isInteger(guestAge) || guestAge <= 0 || guestAge > 99) {
      return { error: `Informe uma idade válida para o convidado ${guestOrder}.` };
    }

    guests.push({
      guestOrder,
      fullName: guestFullName,
      preferredPosition: parsedGuestPreferredPosition,
      age: guestAge,
    });
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
    preferredPosition: parsedPreferredPosition,
    age,
    level: null,
  });

  const guestAthleteProfiles = await Promise.all(
    guests.map(async (guest) => ({
      ...guest,
      athleteProfileId: await syncAthleteProfileFromPeladaConfirmation({
        athleteProfileId: null,
        fullName: guest.fullName,
        preferredPosition: guest.preferredPosition,
        age: guest.age,
        level: null,
      }),
    })),
  );

  const cancelToken = generateCancelToken();

  await prisma.$transaction(async (tx) => {
    const confirmation = await tx.peladaConfirmation.create({
      data: {
        peladaId,
        athleteProfileId,
        fullName,
        preferredPosition: parsedPreferredPosition,
        cancelToken,
        age,
        guestCount: guests.length,
        createdByAdmin: false,
      },
      select: {
        id: true,
      },
    });

    if (guestAthleteProfiles.length > 0) {
      await tx.peladaConfirmation.createMany({
        data: guestAthleteProfiles.map((guest) => ({
          peladaId,
          parentConfirmationId: confirmation.id,
          athleteProfileId: guest.athleteProfileId,
          cancelToken: generateCancelToken(),
          fullName: guest.fullName,
          preferredPosition: guest.preferredPosition,
          age: guest.age,
          guestCount: 0,
          createdByAdmin: false,
          guestOrder: guest.guestOrder,
        })),
      });
    }
  });

  revalidatePath(`/peladas/${peladaId}`);
  revalidatePath("/peladas");

  redirect(`/peladas/${peladaId}/sucesso?token=${encodeURIComponent(cancelToken)}`);
}

function parsePreferredPosition(value: string): PreferredPositionValue | null {
  return preferredPositionValues.has(value) ? (value as PreferredPositionValue) : null;
}
