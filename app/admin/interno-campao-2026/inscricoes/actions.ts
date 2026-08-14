"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { syncAthleteProfileFromRegistration } from "@/lib/athlete-profiles";
import {
  getInternoCampao2026AdminRegistrationsPath,
  INTERNO_CAMPAO_2026_SLUG,
} from "@/lib/championships";
import { isValidBrazilPhone, PHONE_ERROR_MESSAGE } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const POSITIONS = ["GOLEIRO", "LATERAL", "ZAGUEIRO", "VOLANTE", "MEIA", "ATACANTE"] as const;
const registrationsPath = getInternoCampao2026AdminRegistrationsPath();

function redirectBack(formData: FormData, success: string) {
  const returnTo = String(formData.get("returnTo") || "");
  const safePath = returnTo.startsWith(`${registrationsPath}?`) || returnTo === registrationsPath ? returnTo : registrationsPath;
  const separator = safePath.includes("?") ? "&" : "?";
  redirect(`${safePath}${separator}success=${success}`);
}

function parseCategory(value: string) {
  if (value === "UNDEFINED" || value === "") return null;
  if (value === "ADULTO" || value === "MASTER") return value;
  throw new Error("Categoria inválida.");
}

async function requireInternoRegistration(id: string) {
  const registration = await prisma.registration.findFirst({
    where: { id, championship: { slug: INTERNO_CAMPAO_2026_SLUG } },
  });

  if (!registration) throw new Error("Inscrição não encontrada.");
  return registration;
}

export async function updateRegistrationCategoryAndLevel(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const rawCategory = String(formData.get("category") || "").trim();
  const rawLevel = String(formData.get("level") || "").trim();

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  const category = parseCategory(rawCategory);

  const level =
    rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
      ? (rawLevel as "A" | "B" | "C" | "D" | "E")
      : null;

  await requireInternoRegistration(id);

  const registration = await prisma.registration.update({
    where: { id },
    data: {
      category,
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

  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/admin/interno-campao-2026/inscricoes");

  redirectBack(formData, "save");
}

export async function updateRegistration(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(formData.get("preferredPosition") || "").trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const rawCategory = String(formData.get("category") || "").trim();
  const rawLevel = String(formData.get("level") || "").trim();
  const adminNotes = String(formData.get("adminNotes") || "").trim();

  if (!id || !fullName || !birthDate || !phone) throw new Error("Preencha os campos obrigatórios.");
  if (!POSITIONS.includes(preferredPosition as (typeof POSITIONS)[number])) throw new Error("Posição inválida.");
  const category = parseCategory(rawCategory);
  if (!isValidBrazilPhone(phone)) throw new Error(PHONE_ERROR_MESSAGE);

  // Browsers submit YYYY-MM-DD, but an edited value can also arrive as an ISO
  // timestamp after hydration. Keep only the calendar date before parsing it.
  const birthDateOnly = birthDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateOnly)) {
    throw new Error("Data de nascimento inválida.");
  }
  const parsedBirthDate = new Date(`${birthDateOnly}T12:00:00`);
  if (Number.isNaN(parsedBirthDate.getTime())) throw new Error("Data de nascimento inválida.");

  const level = rawLevel && ["A", "B", "C", "D", "E"].includes(rawLevel)
    ? (rawLevel as "A" | "B" | "C" | "D" | "E")
    : null;

  await requireInternoRegistration(id);
  const athleteProfileId = await syncAthleteProfileFromRegistration({
    fullName,
    nickname: nickname || null,
    preferredPosition: preferredPosition as (typeof POSITIONS)[number],
    birthDate: parsedBirthDate,
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
      preferredPosition: preferredPosition as (typeof POSITIONS)[number],
      birthDate: parsedBirthDate,
      phone,
      email: email || null,
      category,
      level,
      adminNotes: adminNotes || null,
    },
  });

  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/admin/interno-campao-2026/inscricoes");
  redirectBack(formData, "edit");
}

export async function deleteRegistration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Inscrição não encontrada.");

  await requireInternoRegistration(id);
  await prisma.registration.delete({ where: { id } });

  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/admin/interno-campao-2026/inscricoes");
  redirectBack(formData, "delete");
}
