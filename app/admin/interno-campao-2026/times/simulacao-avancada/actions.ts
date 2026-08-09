"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { prisma } from "@/lib/prisma";

const path = "/admin/interno-campao-2026/times/simulacao-avancada";

export async function saveCampaoRelationship(input: { id?: string; category: "ADULTO" | "MASTER"; playerAId: string; playerBId: string; relationshipType: string; priorityWeight: number; notes?: string }) {
  await requireAdmin();
  if (input.playerAId === input.playerBId) throw new Error("Selecione dois jogadores diferentes.");
  const championship = await ensureInternoCampao2026Championship();
  const count = await prisma.registration.count({ where: { id: { in: [input.playerAId, input.playerBId] }, championshipId: championship.id, category: input.category } });
  if (count !== 2) throw new Error("Os jogadores devem pertencer à categoria selecionada.");
  const data = { championshipId: championship.id, category: input.category, playerAId: input.playerAId, playerBId: input.playerBId, relationshipType: input.relationshipType.trim() || "OTHER", priorityWeight: Math.min(3, Math.max(1, input.priorityWeight)), notes: input.notes?.trim() || null };
  if (input.id) await prisma.teamRelationship.update({ where: { id: input.id }, data });
  else await prisma.teamRelationship.create({ data });
  revalidatePath(path);
}

export async function deleteCampaoRelationship(id: string) { await requireAdmin(); await prisma.teamRelationship.delete({ where: { id } }); revalidatePath(path); }

export async function saveCampaoSimulation(input: { category: "ADULTO" | "MASTER"; name: string; teams: unknown; statistics: unknown; balanceScore: number }) {
  await requireAdmin(); const championship = await ensureInternoCampao2026Championship();
  await prisma.teamSimulation.create({ data: { championshipId: championship.id, category: input.category, name: input.name.trim() || `Simulação ${new Date().toLocaleString("pt-BR")}`, settings: { composition: "1-2-2-1-2-1" }, teams: input.teams as object, statistics: input.statistics as object, balanceScore: input.balanceScore } });
  revalidatePath(path);
}
