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

function finish(notice?: string) { revalidatePath("/admin/atletas"); revalidatePath("/admin/interno-campao-2026/ids-jogadores"); revalidatePath("/admin/interno-campao-2026/pendencias"); revalidatePath("/campeonatos/interno-campao-2026"); revalidatePath("/campeonatos/tio-hugo-2026"); redirect(`/admin/atletas${notice ? `?notice=${notice}` : ""}`); }

export async function createAthlete(formData: FormData) { await requireAdmin(); await prisma.athleteProfile.create({ data: profileData(formData) }); finish(); }

export async function updateAthlete(formData: FormData) { await requireAdmin(); const id = optional(formData.get("id")); if (!id) throw new Error("Atleta não encontrado."); await prisma.athleteProfile.update({ where: { id }, data: profileData(formData) }); finish(); }

export async function deleteAthlete(formData: FormData) {
  await requireAdmin(); const id = optional(formData.get("id")); if (!id) throw new Error("Atleta não encontrado.");
  const counts = await prisma.athleteProfile.findUnique({ where: { id }, select: { _count: { select: { registrations: true, peladaArrivals: true, peladaConfirmations: true, matchEvents: true, matchParticipations: true, suspensions: true } } } });
  if (!counts) throw new Error("Atleta não encontrado.");
  if (Object.values(counts._count).some(Boolean)) finish("historico-preservado");
  await prisma.athleteProfile.delete({ where: { id } }); finish();
}

export async function deleteAthleteAssumingRisk(formData: FormData) {
  await requireAdmin();
  const id = optional(formData.get("id"));
  const acknowledged = formData.get("acknowledgeRisk") === "yes";
  if (!id || !acknowledged) throw new Error("Confirme que entende a exclusão antes de continuar.");

  await prisma.$transaction(async (tx) => {
    const athlete = await tx.athleteProfile.findUnique({ where: { id }, select: { id: true } });
    if (!athlete) throw new Error("Atleta não encontrado.");

    // Preserva o texto da súmula e o elenco inscrito, mas remove os vínculos
    // pessoais que não podem apontar para um cadastro excluído.
    await Promise.all([
      tx.matchPlayerParticipation.deleteMany({ where: { playerId: id } }),
      tx.suspension.deleteMany({ where: { playerId: id } }),
      tx.matchEvent.updateMany({ where: { playerId: id }, data: { playerId: null } }),
      tx.registration.updateMany({ where: { athleteProfileId: id }, data: { athleteProfileId: null } }),
      tx.peladaConfirmation.updateMany({ where: { athleteProfileId: id }, data: { athleteProfileId: null } }),
      tx.peladaArrival.updateMany({ where: { athleteProfileId: id }, data: { athleteProfileId: null } }),
    ]);
    await tx.athleteProfile.delete({ where: { id } });
  });
  finish("exclusao-assumida");
}

export async function mergeAthletes(formData: FormData) {
  await requireAdmin(); const firstId = optional(formData.get("firstId")); const secondId = optional(formData.get("secondId"));
  if (!firstId || !secondId || firstId === secondId) throw new Error("Selecione dois atletas diferentes.");
  await mergeAthleteProfiles([firstId, secondId]);
  finish("perfis-integrados");
}

export async function mergeSelectedAthletes(formData: FormData) {
  await requireAdmin();
  if (formData.get("acknowledgeMerge") !== "yes") throw new Error("Confirme que os cadastros selecionados são da mesma pessoa.");
  const athleteIds = [...new Set(formData.getAll("athleteIds").map((value) => String(value).trim()).filter(Boolean))];
  if (athleteIds.length < 2) throw new Error("Selecione pelo menos dois cadastros para integrar.");
  await mergeAthleteProfiles(athleteIds);
  finish("perfis-integrados");
}

async function mergeAthleteProfiles(ids: string[]) {
  await prisma.$transaction(async (tx) => {
    const athletes = await tx.athleteProfile.findMany({ where: { id: { in: ids } }, include: { _count: { select: { registrations: true, peladaArrivals: true, peladaConfirmations: true, matchEvents: true, matchParticipations: true, suspensions: true } } } });
    if (athletes.length !== ids.length) throw new Error("Um ou mais atletas não foram encontrados.");
    const score = (athlete: typeof athletes[number]) => [athlete.nickname, athlete.birthDate, athlete.phone, athlete.email, athlete.preferredPosition, athlete.defaultLevel, athlete.lastKnownAge].filter(Boolean).length + Object.values(athlete._count).reduce((total, count) => total + count, 0) * 2;
    const [primary, ...duplicates] = [...athletes].sort((a, b) => score(b) - score(a));
    const participations = await tx.matchPlayerParticipation.findMany({ where: { playerId: { in: ids } }, select: { id: true, playerId: true, matchId: true, teamId: true, starter: true, bionic: true, goals: true, assists: true, yellowCards: true, redCards: true, ownGoals: true, mvp: true, minutesPlayed: true } });
    const groups = new Map<string, typeof participations>();
    participations.forEach((item) => { const key = `${item.matchId}:${item.teamId}`; groups.set(key, [...(groups.get(key) ?? []), item]); });
    for (const entries of groups.values()) {
      const keeper = entries.find((item) => item.playerId === primary.id) ?? entries[0];
      const hasAssists = entries.some((item) => item.assists !== null);
      const hasMinutes = entries.some((item) => item.minutesPlayed !== null);
      await tx.matchPlayerParticipation.update({ where: { id: keeper.id }, data: { playerId: primary.id, starter: entries.some((item) => item.starter), bionic: entries.some((item) => item.bionic), goals: entries.reduce((total, item) => total + item.goals, 0), assists: hasAssists ? entries.reduce((total, item) => total + (item.assists ?? 0), 0) : null, yellowCards: entries.reduce((total, item) => total + item.yellowCards, 0), redCards: entries.reduce((total, item) => total + item.redCards, 0), ownGoals: entries.reduce((total, item) => total + item.ownGoals, 0), mvp: entries.some((item) => item.mvp), minutesPlayed: hasMinutes ? Math.max(...entries.map((item) => item.minutesPlayed ?? 0)) : null } });
      const duplicateIds = entries.filter((item) => item.id !== keeper.id).map((item) => item.id);
      if (duplicateIds.length) await tx.matchPlayerParticipation.deleteMany({ where: { id: { in: duplicateIds } } });
    }
    const merged = athletes.reduce((current, athlete) => ({ nickname: current.nickname || athlete.nickname, birthDate: current.birthDate || athlete.birthDate, lastKnownAge: current.lastKnownAge || athlete.lastKnownAge, phone: current.phone || athlete.phone, email: current.email || athlete.email, preferredPosition: current.preferredPosition || athlete.preferredPosition, defaultLevel: current.defaultLevel || athlete.defaultLevel }), primary);
    await Promise.all([
      tx.registration.updateMany({ where: { athleteProfileId: { in: duplicates.map((athlete) => athlete.id) } }, data: { athleteProfileId: primary.id } }),
      tx.peladaConfirmation.updateMany({ where: { athleteProfileId: { in: duplicates.map((athlete) => athlete.id) } }, data: { athleteProfileId: primary.id } }),
      tx.peladaArrival.updateMany({ where: { athleteProfileId: { in: duplicates.map((athlete) => athlete.id) } }, data: { athleteProfileId: primary.id } }),
      tx.matchEvent.updateMany({ where: { playerId: { in: duplicates.map((athlete) => athlete.id) } }, data: { playerId: primary.id } }),
      tx.suspension.updateMany({ where: { playerId: { in: duplicates.map((athlete) => athlete.id) } }, data: { playerId: primary.id } }),
    ]);
    await tx.athleteProfile.update({ where: { id: primary.id }, data: merged });
    await tx.athleteProfile.deleteMany({ where: { id: { in: duplicates.map((athlete) => athlete.id) } } });
  });
}
