"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import { getTioHugoAdminRegistrationsPath } from "@/lib/championships";
import { isValidBrazilPhone, PHONE_ERROR_MESSAGE } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function updateRegistrationLevel(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const rawLevel = String(formData.get("level") || "").trim();

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

  const registration = await prisma.registration.update({
    where: { id },
    data: { level },
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

  redirect(`${getTioHugoAdminRegistrationsPath()}?success=level`);
}

export async function updateRegistrationQuickFields(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const rawLevel = String(formData.get("level") || "").trim();
  const paymentPaid = formData.get("paymentPaid") === "on";

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;
  const paymentStatus = paymentPaid ? "PAGO" : "PENDENTE";

  const registration = await prisma.registration.update({
    where: { id },
    data: {
      level,
      paymentStatus,
      paidAt: paymentStatus === "PAGO" ? new Date() : null,
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

  redirect(`${getTioHugoAdminRegistrationsPath()}?success=quick-save`);
}

export async function updateRegistration(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const rawLevel = String(formData.get("level") || "").trim();

  if (!id) throw new Error("Inscrição não encontrada.");
  if (!fullName) throw new Error("Nome completo é obrigatório.");
  if (!preferredPosition) throw new Error("Posição é obrigatória.");
  if (!birthDate) throw new Error("Data de nascimento é obrigatória.");
  if (!phone) throw new Error("Telefone é obrigatório.");
  if (!isValidBrazilPhone(phone)) {
    redirect(
      `${getTioHugoAdminRegistrationsPath()}?error=${encodeURIComponent(
        PHONE_ERROR_MESSAGE,
      )}&open=${id}`,
    );
  }

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

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
    level,
  });

  await prisma.registration.update({
    where: { id },
    data: {
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
      level,
    },
  });

  redirect(`${getTioHugoAdminRegistrationsPath()}?success=edit&open=${id}`);
}

export async function deleteRegistration(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  await prisma.registration.delete({
    where: { id },
  });

  redirect(`${getTioHugoAdminRegistrationsPath()}?success=delete`);
}
