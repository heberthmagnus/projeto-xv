import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { CampaoSimulationClient } from "./simulation-client";

const ageReferenceTime = Date.now();

export default async function CampaoAdvancedSimulationPage() {
  await requireAdmin(); const championship = await ensureInternoCampao2026Championship();
  const registrations = await prisma.registration.findMany({ where: { championshipId: championship.id, category: { in: ["ADULTO", "MASTER"] } }, select: { id: true, fullName: true, birthDate: true, phone: true, preferredPosition: true, level: true, category: true, adminNotes: true }, orderBy: { fullName: "asc" } });
  let relationships: Awaited<ReturnType<typeof prisma.teamRelationship.findMany>> = [];
  let simulations: Awaited<ReturnType<typeof prisma.teamSimulation.findMany>> = [];
  let persistenceUnavailable = false;
  try {
    [relationships, simulations] = await Promise.all([
      prisma.teamRelationship.findMany({ where: { championshipId: championship.id }, orderBy: { updatedAt: "desc" } }),
      prisma.teamSimulation.findMany({ where: { championshipId: championship.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    ]);
  } catch {
    persistenceUnavailable = true;
  }
  const age = (birthDate: Date) => Math.floor((ageReferenceTime - birthDate.getTime()) / 31557600000);
  return <CampaoSimulationClient persistenceUnavailable={persistenceUnavailable} players={registrations.map((r) => ({ id: r.id, fullName: r.fullName, age: age(r.birthDate), phone: r.phone, position: r.preferredPosition, level: r.level, adminNotes: r.adminNotes, category: r.category! }))} relationships={relationships} simulations={simulations.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }))} />;
}
