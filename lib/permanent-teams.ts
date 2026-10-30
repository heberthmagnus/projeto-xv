import { PermanentTeamCategory, PrismaClient } from "@prisma/client";

export const permanentTeamDefinitions: Array<{ category: PermanentTeamCategory; name: string; label: string }> = [
  { category: "LIVRE", name: "Clube XV Livre", label: "Livre (18–37 anos)" },
  { category: "MAIS_38", name: "Clube XV 38+", label: "38+" },
  { category: "MAIS_48", name: "Clube XV 48+", label: "48+" },
  { category: "MAIS_58", name: "Clube XV 58+", label: "58+" },
];

export const permanentTeamLabels = Object.fromEntries(permanentTeamDefinitions.map((team) => [team.category, team.label])) as Record<PermanentTeamCategory, string>;

export async function ensurePermanentTeams(client: PrismaClient) {
  await Promise.all(permanentTeamDefinitions.map((team) => client.permanentTeam.upsert({
    where: { category: team.category },
    update: {},
    create: { category: team.category, name: team.name },
  })));
}
