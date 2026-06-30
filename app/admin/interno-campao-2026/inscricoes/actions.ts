"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";

export async function updateRegistrationCategoryAndLevel(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const rawCategory = String(formData.get("category") || "").trim();
  const rawLevel = String(formData.get("level") || "").trim();

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  if (!["ADULTO", "MASTER"].includes(rawCategory)) {
    throw new Error("Categoria inválida.");
  }

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

  const registration = await prisma.registration.update({
    where: { id },
    data: {
      category: rawCategory as "ADULTO" | "MASTER",
      level,
    },
  });

  const athleteProfileId = await syncAthleteProfileFromRegistration({
    fullName: registration.fullName,
    nickname: registration.nickname,
    preferredPosition: registration.preferredPosition,
    birthDate: registration.birthDate,
    phone: registration.phone,
    email: registration.email,
    level: registration.level,
  });

  await prisma.registration.update({
    where: { id },
    data: { athleteProfileId },
  });

  redirect(`${getInternoCampao2026AdminRegistrationsPath()}?success=save`);
}
