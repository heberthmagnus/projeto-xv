"use server";

import { redirect } from "next/navigation";
import {
  getRequiredChampionshipBySlug,
  TIO_HUGO_2026_SLUG,
  getTioHugoRegistrationPath,
} from "@/lib/championships";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";
import { getFriendlyDatabaseErrorMessage } from "@/lib/prisma-safe";
import { isValidBrazilPhone, PHONE_ERROR_MESSAGE } from "@/lib/phone";
import { RegistrationFormState } from "./form-state";
import { isRateLimited } from "@/lib/request-rate-limit";

const validPositions = new Set([
  "GOLEIRO",
  "LATERAL",
  "ZAGUEIRO",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
]);

export async function createRegistration(
  _prevState: RegistrationFormState,
  formData: FormData,
) {
  if (await isRateLimited("tio-hugo-registration", 10, 60 * 60 * 1000)) {
    return { error: "Muitas tentativas de inscrição. Tente novamente mais tarde." };
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const confirmedRules = formData.get("confirmedRules") === "on";
  const parsedBirthDate = new Date(`${birthDate}T12:00:00`);

  if (!fullName) {
    return { error: "Informe seu nome completo." };
  }

  if (!preferredPosition) {
    return { error: "Selecione sua posição preferida." };
  }

  if (!validPositions.has(preferredPosition)) {
    return { error: "Selecione uma posição válida." };
  }

  if (!birthDate) {
    return { error: "Informe sua data de nascimento." };
  }

  if (Number.isNaN(parsedBirthDate.getTime())) {
    return { error: "Informe uma data de nascimento válida." };
  }

  if (fullName.length > 120 || nickname.length > 80 || phone.length > 32 || email.length > 160) {
    return { error: "Uma das informações excede o tamanho permitido." };
  }

  if (!isValidBrazilPhone(phone)) {
    return { error: PHONE_ERROR_MESSAGE };
  }

  if (!confirmedRules) {
    return { error: "Confirme a leitura das regras para continuar." };
  }

  try {
    const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
    const athleteProfileId = await syncAthleteProfileFromRegistration({
      fullName,
      nickname: nickname || null,
      preferredPosition: preferredPosition as
        | "GOLEIRO"
        | "LATERAL"
        | "ZAGUEIRO"
        | "VOLANTE"
        | "MEIA"
        | "ATACANTE",
      birthDate: parsedBirthDate,
      phone,
      email: email || null,
      level: null,
    });

    await prisma.registration.create({
      data: {
        championshipId: championship.id,
        athleteProfileId,
        fullName,
        nickname: nickname || null,
        preferredPosition: preferredPosition as
          | "GOLEIRO"
          | "LATERAL"
          | "ZAGUEIRO"
          | "VOLANTE"
          | "MEIA"
          | "ATACANTE",
        birthDate: parsedBirthDate,
        phone,
        email: email || null,
        confirmedRules,
      },
    });
  } catch (error) {
    const databaseMessage = getFriendlyDatabaseErrorMessage(error);

    if (databaseMessage) {
      return { error: databaseMessage };
    }

    throw error;
  }

  redirect(`${getTioHugoRegistrationPath()}/sucesso`);
}
