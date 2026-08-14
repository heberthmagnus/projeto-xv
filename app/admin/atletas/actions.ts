"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeFullName } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";

const positions = ["GOLEIRO", "LATERAL", "ZAGUEIRO", "VOLANTE", "MEIA", "ATACANTE"] as const;
const levels = ["A", "B", "C", "D", "E"] as const;

function optional(value: FormDataEntryValue | null) { const text = String(value || "").trim(); return text || null; }
function optionalDate(value: FormDataEntryValue | null) { const text = optional(value); if (!text) return null; const date = new Date(`${text}T12:00:00`); if (Number.isNaN(date.getTime())) throw new Error("Data de nascimento inválida."); return date; }
function profileData(formData: FormData) {
  const fullName = optional(formData.get("fullName"));
  const preferredPosition = optional(formData.get("preferredPosition"));
  const defaultLevel = optional(formData.get("defaultLevel"));
  const lastKnownAge = optional(formData.get("lastKnownAge"));
  if (!fullName) throw new Error("Informe o nome completo do atleta.");
  if (preferredPosition && !positions.includes(preferredPosition as (typeof positions)[number])) throw new Error("Posição inválida.");
  if (defaultLevel && !levels.includes(defaultLevel as (typeof levels)[number])) throw new Error("Nível inválido.");
  const age = lastKnownAge ? Number(lastKnownAge) : null;
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) throw new Error("Idade inválida.");
  return { fullName, normalizedFullName: normalizeFullName(fullName), nickname: optional(formData.get("nickname")), birthDate: optionalDate(formData.get("birthDate")), lastKnownAge: age, phone: optional(formData.get("phone")), email: optional(formData.get("email")), preferredPosition: preferredPosition as (typeof positions)[number] | null, defaultLevel: defaultLevel as (typeof levels)[number] | null };
}

function finish() { revalidatePath("/admin/atletas"); redirect("/admin/atletas"); }

export async function createAthlete(formData: FormData) { await requireAdmin(); await prisma.athleteProfile.create({ data: profileData(formData) }); finish(); }

export async function updateAthlete(formData: FormData) { await requireAdmin(); const id = optional(formData.get("id")); if (!id) throw new Error("Atleta não encontrado."); await prisma.athleteProfile.update({ where: { id }, data: profileData(formData) }); finish(); }

export async function deleteAthlete(formData: FormData) {
  await requireAdmin(); const id = optional(formData.get("id")); if (!id) throw new Error("Atleta não encontrado.");
  const counts = await prisma.athleteProfile.findUnique({ where: { id }, select: { _count: { select: { registrations: true, peladaArrivals: true, peladaConfirmations: true, matchEvents: true, matchParticipations: true, suspensions: true } } } });
  if (!counts) throw new Error("Atleta não encontrado.");
  if (Object.values(counts._count).some(Boolean)) throw new Error("Este atleta possui histórico. Use a mesclagem para preservar seus dados.");
  await prisma.athleteProfile.delete({ where: { id } }); finish();
}

export async function mergeAthletes(formData: FormData) {
  await requireAdmin(); const firstId = optional(formData.get("firstId")); const secondId = optional(formData.get("secondId"));
  if (!firstId || !secondId || firstId === secondId) throw new Error("Selecione dois atletas diferentes.");
  await prisma.$transaction(async (tx) => {
    const athletes = await tx.athleteProfile.findMany({ where: { id: { in: [firstId, secondId] } }, include: { _count: { select: { registrations: true, peladaArrivals: true, peladaConfirmations: true, matchEvents: true, matchParticipations: true, suspensions: true } } } });
    if (athletes.length !== 2) throw new Error("Atletas não encontrados.");
    const score = (athlete: typeof athletes[number]) => [athlete.nickname, athlete.birthDate, athlete.phone, athlete.email, athlete.preferredPosition, athlete.defaultLevel, athlete.lastKnownAge].filter(Boolean).length + Object.values(athlete._count).reduce((total, count) => total + count, 0) * 2;
    const [primary, duplicate] = [...athletes].sort((a, b) => score(b) - score(a));
    const duplicateParticipations = await tx.matchPlayerParticipation.findMany({ where: { playerId: duplicate.id }, select: { id: true, matchId: true, teamId: true } });
    const existingParticipations = await tx.matchPlayerParticipation.findMany({ where: { playerId: primary.id }, select: { matchId: true, teamId: true } });
    const occupied = new Set(existingParticipations.map((item) => `${item.matchId}:${item.teamId}`));
    const conflictingIds = duplicateParticipations.filter((item) => occupied.has(`${item.matchId}:${item.teamId}`)).map((item) => item.id);
    if (conflictingIds.length) await tx.matchPlayerParticipation.deleteMany({ where: { id: { in: conflictingIds } } });
    await Promise.all([
      tx.registration.updateMany({ where: { athleteProfileId: duplicate.id }, data: { athleteProfileId: primary.id } }),
      tx.peladaConfirmation.updateMany({ where: { athleteProfileId: duplicate.id }, data: { athleteProfileId: primary.id } }),
      tx.peladaArrival.updateMany({ where: { athleteProfileId: duplicate.id }, data: { athleteProfileId: primary.id } }),
      tx.matchEvent.updateMany({ where: { playerId: duplicate.id }, data: { playerId: primary.id } }),
      tx.matchPlayerParticipation.updateMany({ where: { playerId: duplicate.id }, data: { playerId: primary.id } }),
      tx.suspension.updateMany({ where: { playerId: duplicate.id }, data: { playerId: primary.id } }),
    ]);
    await tx.athleteProfile.update({ where: { id: primary.id }, data: { nickname: primary.nickname || duplicate.nickname, birthDate: primary.birthDate || duplicate.birthDate, lastKnownAge: primary.lastKnownAge || duplicate.lastKnownAge, phone: primary.phone || duplicate.phone, email: primary.email || duplicate.email, preferredPosition: primary.preferredPosition || duplicate.preferredPosition, defaultLevel: primary.defaultLevel || duplicate.defaultLevel } });
    await tx.athleteProfile.delete({ where: { id: duplicate.id } });
  });
  finish();
}
