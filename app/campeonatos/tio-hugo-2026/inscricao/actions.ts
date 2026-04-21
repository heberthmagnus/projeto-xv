"use server";

import { redirect } from "next/navigation";
import {
  getRequiredChampionshipBySlug,
  TIO_HUGO_2026_SLUG,
  getTioHugoRegistrationPath,
} from "@/lib/championships";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";
import { isValidBrazilPhone, PHONE_ERROR_MESSAGE } from "@/lib/phone";
import { RegistrationFormState } from "./form-state";

export async function createRegistration(
  _prevState: RegistrationFormState,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const confirmedRules = formData.get("confirmedRules") === "on";

  if (!fullName) {
    return { error: "Informe seu nome completo." };
  }

  if (!preferredPosition) {
    return { error: "Selecione sua posição preferida." };
  }

  if (!birthDate) {
    return { error: "Informe sua data de nascimento." };
  }

  if (!isValidBrazilPhone(phone)) {
    return { error: PHONE_ERROR_MESSAGE };
  }

  if (!confirmedRules) {
    return { error: "Confirme a leitura das regras para continuar." };
  }

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
    birthDate: new Date(birthDate),
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
      birthDate: new Date(birthDate),
      phone,
      email: email || null,
      confirmedRules,
    },
  });

  redirect(`${getTioHugoRegistrationPath()}/sucesso`);
}
