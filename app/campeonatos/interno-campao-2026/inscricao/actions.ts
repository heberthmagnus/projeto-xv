"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureInternoCampao2026Championship, getInternoCampao2026RegistrationPath } from "@/lib/championships";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { isValidBrazilPhone, PHONE_ERROR_MESSAGE } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getFriendlyDatabaseErrorMessage } from "@/lib/prisma-safe";
import { RegistrationFormState } from "./form-state";

export async function createRegistration(
  _prevState: RegistrationFormState,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(formData.get("preferredPosition") || "").trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const rawCategory = String(formData.get("category") || "").trim();
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

  if (!["ADULTO", "MASTER"].includes(rawCategory)) {
    return { error: "Selecione a categoria da inscrição." };
  }

  if (!confirmedRules) {
    return { error: "Confirme a leitura das regras para continuar." };
  }

  try {
    const championship = await ensureInternoCampao2026Championship();
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
        category: rawCategory as "ADULTO" | "MASTER",
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

    revalidatePath("/campeonatos/interno-campao-2026");
    revalidatePath("/admin/interno-campao-2026/inscricoes");
  } catch (error) {
    const databaseMessage = getFriendlyDatabaseErrorMessage(error);

    if (databaseMessage) {
      return { error: databaseMessage };
    }

    throw error;
  }

  redirect(`${getInternoCampao2026RegistrationPath()}/sucesso`);
}
