"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveMatchResult } from "@/app/admin/interno-campao-2026/jogos/actions";

export async function registrarPlacar(formData: FormData) {
  const actor = await requirePermission("match.result.manage");
  const id = String(formData.get("matchId") ?? "").trim();
  const homeRaw = String(formData.get("homeScore") ?? "").trim();
  const awayRaw = String(formData.get("awayScore") ?? "").trim();
  if (!id || !/^\d+$/.test(homeRaw) || !/^\d+$/.test(awayRaw)) throw new Error("Informe placares válidos.");
  const homeScore = Number(homeRaw), awayScore = Number(awayRaw);
  if (!Number.isSafeInteger(homeScore) || !Number.isSafeInteger(awayScore) || homeScore > 999 || awayScore > 999) throw new Error("Informe placares válidos.");
  const match = await prisma.match.findUnique({ where: { id }, select: { championship: { select: { slug: true } } } });
  if (match?.championship.slug === "interno-campao-2026") {
    await saveMatchResult(formData);
  } else if (match?.championship.slug === "tio-hugo-2026") {
    await prisma.$transaction(async (tx) => {
      const before = await tx.match.findFirst({ where: { id, championship: { slug: "tio-hugo-2026" } }, select: { homeScore: true, awayScore: true, status: true } });
      if (!before) throw new Error("Partida não encontrada.");
      await tx.match.update({ where: { id }, data: { homeScore, awayScore, status: MatchStatus.FINALIZADO } });
      await tx.administrativeAudit.create({ data: { actorId: actor.id, action: "match.result.update", target: `Match:${id}`, previous: before, next: { homeScore, awayScore, status: MatchStatus.FINALIZADO } } });
    });
  } else {
    throw new Error("Partida não encontrada.");
  }
  revalidatePath("/resultados-admin");
  revalidatePath("/campeonatos", "layout");
}
