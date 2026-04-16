"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ADMIN_PATH = "/admin/tio-hugo-2026/inscricoes";

export async function updateRegistrationLevel(formData: FormData) {
  const id = String(formData.get("id") || "");
  const rawLevel = String(formData.get("level") || "").trim();

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

  await prisma.registration.update({
    where: { id },
    data: { level },
  });

  redirect(`${ADMIN_PATH}?success=level`);
}

export async function updateRegistration(formData: FormData) {
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

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

  await prisma.registration.update({
    where: { id },
    data: {
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

  redirect(`${ADMIN_PATH}?success=edit&open=${id}`);
}

export async function deleteRegistration(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  await prisma.registration.delete({
    where: { id },
  });

  redirect(`${ADMIN_PATH}?success=delete`);
}
