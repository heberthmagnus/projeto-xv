import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const championshipSlug = "tio-hugo-2026";
const clubName = "Clube XV Veranistas";

const teams = [
  {
    code: "A",
    name: "JORDÂNIA",
    shortName: "Jordânia",
    icon: "🇯🇴",
    slug: "tio-hugo-2026-time-a",
    duplicateSlugs: ["jordenia"],
    players: ["Gabriel (Amigo Pepe)", "Calango", "City", "Davi", "Haendel", "Damiany", "Rafa DJ"],
  },
  {
    code: "B",
    name: "SENEGAL",
    shortName: "Senegal",
    icon: "🇸🇳",
    slug: "tio-hugo-2026-time-b",
    duplicateSlugs: ["senegal"],
    players: ["Ricardo", "Bê Bastos", "Fred", "Dinho", "Vitinho", "Pedrinho", "Paulista"],
  },
  {
    code: "C",
    name: "CABO VERDE",
    shortName: "Cabo Verde",
    icon: "🇨🇻",
    slug: "tio-hugo-2026-time-c",
    duplicateSlugs: ["cabo-verde"],
    players: ["Anderson", "F2", "Saymon", "Iguin", "Carlos", "Gordo", "Filho do Gordo"],
  },
  {
    code: "D",
    name: "CURAÇAU",
    shortName: "Curaçau",
    icon: "🇨🇼",
    slug: "tio-hugo-2026-time-d",
    duplicateSlugs: ["curacau"],
    players: ["Igor Quintão", "Melinho", "Caverna", "Danny", "Lucca", "Gilbertinho", "Dadá"],
  },
  {
    code: "E",
    name: "BÓSNIA",
    shortName: "Bósnia",
    icon: "🇧🇦",
    slug: "tio-hugo-2026-time-e",
    duplicateSlugs: ["bosnia"],
    players: ["Samyr", "Loco Abreu", "Farmácia", "Edinho", "Pepe", "Jairinho", "Watson"],
  },
] as const;

const regularMatches = [
  { round: 1, date: "2026-06-25", home: "JORDÂNIA", away: "CABO VERDE", bye: "BÓSNIA" },
  { round: 1, date: "2026-06-25", home: "SENEGAL", away: "CURAÇAU", bye: "BÓSNIA" },
  { round: 2, date: "2026-07-02", home: "BÓSNIA", away: "JORDÂNIA", bye: "SENEGAL" },
  { round: 2, date: "2026-07-02", home: "CABO VERDE", away: "CURAÇAU", bye: "SENEGAL" },
  { round: 3, date: "2026-07-09", home: "SENEGAL", away: "BÓSNIA", bye: "CABO VERDE" },
  { round: 3, date: "2026-07-09", home: "JORDÂNIA", away: "CURAÇAU", bye: "CABO VERDE" },
  { round: 4, date: "2026-07-16", home: "SENEGAL", away: "CABO VERDE", bye: "JORDÂNIA" },
  { round: 4, date: "2026-07-16", home: "BÓSNIA", away: "CURAÇAU", bye: "JORDÂNIA" },
  { round: 5, date: "2026-07-23", home: "SENEGAL", away: "JORDÂNIA", bye: "CURAÇAU" },
  { round: 5, date: "2026-07-23", home: "BÓSNIA", away: "CABO VERDE", bye: "CURAÇAU" },
] as const;

const placeholderBirthDate = new Date("1900-01-01T12:00:00.000Z");

function atClubTime(date: string, hour = "20:00") {
  return new Date(`${date}T${hour}:00-03:00`);
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueRegistrationKey(championshipId: string, fullName: string) {
  return `seed:${championshipId}:${normalizeName(fullName)}`;
}

async function upsertRegistration(championshipId: string, fullName: string) {
  const athleteProfile = await upsertAthleteProfile(fullName);

  const existing = await prisma.registration.findFirst({
    where: {
      championshipId,
      athleteProfileId: athleteProfile.id,
    },
  });

  const data = {
    championshipId,
    fullName,
    nickname: fullName,
    preferredPosition: "MEIA",
    birthDate: placeholderBirthDate,
    phone: uniqueRegistrationKey(championshipId, fullName),
    email: null,
    level: null,
    confirmedRules: true,
    paymentStatus: "PAGO",
    athleteProfileId: athleteProfile.id,
  } satisfies Prisma.RegistrationUncheckedCreateInput;

  if (existing) {
    return prisma.registration.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.registration.create({ data });
}

async function upsertAthleteProfile(fullName: string) {
  const normalizedFullName = normalizeName(fullName);

  return prisma.athleteProfile.upsert({
    where: { normalizedFullName },
    update: {
      fullName,
    },
    create: {
      fullName,
      normalizedFullName,
    },
  });
}

async function upsertMatch(data: Prisma.MatchUncheckedCreateInput) {
  const existing = await prisma.match.findFirst({
    where: {
      championshipId: data.championshipId,
      stageId: data.stageId,
      round: data.round,
      roundNumber: data.roundNumber,
    },
    select: {
      id: true,
      status: true,
      homeScore: true,
      awayScore: true,
      referee: true,
    },
  });

  if (existing) {
    const updateData = { ...data };

    if (existing.status === "FINALIZADO") {
      delete updateData.homeScore;
      delete updateData.awayScore;
      delete updateData.status;
      delete updateData.referee;
    }

    return prisma.match.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  return prisma.match.create({ data });
}

async function findMatch(championshipId: string, homeTeamId: string, awayTeamId: string) {
  const match = await prisma.match.findFirst({
    where: {
      championshipId,
      homeTeamId,
      awayTeamId,
    },
  });

  if (!match) {
    throw new Error(`Match not found for ${homeTeamId} x ${awayTeamId}.`);
  }

  return match;
}

async function upsertParticipation(args: {
  matchId: string;
  playerName: string;
  teamId: string;
  starter?: boolean;
  bionic?: boolean;
  goals?: number;
  assists?: number | null;
  yellowCards?: number;
  redCards?: number;
  ownGoals?: number;
  mvp?: boolean;
  minutesPlayed?: number | null;
}) {
  const player = await upsertAthleteProfile(args.playerName);

  return prisma.matchPlayerParticipation.upsert({
    where: {
      matchId_playerId_teamId: {
        matchId: args.matchId,
        playerId: player.id,
        teamId: args.teamId,
      },
    },
    update: {
      starter: args.starter ?? false,
      bionic: args.bionic ?? false,
      goals: args.goals ?? 0,
      assists: args.assists ?? null,
      yellowCards: args.yellowCards ?? 0,
      redCards: args.redCards ?? 0,
      ownGoals: args.ownGoals ?? 0,
      mvp: args.mvp ?? false,
      minutesPlayed: args.minutesPlayed ?? null,
    },
    create: {
      matchId: args.matchId,
      playerId: player.id,
      teamId: args.teamId,
      starter: args.starter ?? false,
      bionic: args.bionic ?? false,
      goals: args.goals ?? 0,
      assists: args.assists ?? null,
      yellowCards: args.yellowCards ?? 0,
      redCards: args.redCards ?? 0,
      ownGoals: args.ownGoals ?? 0,
      mvp: args.mvp ?? false,
      minutesPlayed: args.minutesPlayed ?? null,
    },
  });
}

async function registerTeamParticipations(args: {
  matchId: string;
  teamId: string;
  players: readonly string[];
  stats?: Record<
    string,
    { goals?: number; yellowCards?: number; redCards?: number; mvp?: boolean }
  >;
}) {
  for (const playerName of args.players) {
    const stats = args.stats?.[playerName];
    await upsertParticipation({
      matchId: args.matchId,
      playerName,
      teamId: args.teamId,
      starter: true,
      goals: stats?.goals ?? 0,
      yellowCards: stats?.yellowCards ?? 0,
      redCards: stats?.redCards ?? 0,
      mvp: stats?.mvp ?? false,
    });
  }
}

async function recalculateStandings(championshipId: string, teamIds: string[]) {
  const matches = await prisma.match.findMany({
    where: {
      championshipId,
      status: "FINALIZADO",
      stage: {
        stageType: "GRUPO",
      },
      homeScore: {
        not: null,
      },
      awayScore: {
        not: null,
      },
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  const table = new Map(
    teamIds.map((teamId) => [
      teamId,
      {
        teamId,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    ]),
  );

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);

    if (!home || !away) {
      continue;
    }

    home.gamesPlayed += 1;
    away.gamesPlayed += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const ranked = Array.from(table.values()).sort((left, right) => {
    const leftGoalDifference = left.goalsFor - left.goalsAgainst;
    const rightGoalDifference = right.goalsFor - right.goalsAgainst;

    if (right.points !== left.points) return right.points - left.points;
    if (rightGoalDifference !== leftGoalDifference) return rightGoalDifference - leftGoalDifference;
    if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
    return teamIds.indexOf(left.teamId) - teamIds.indexOf(right.teamId);
  });

  for (const [index, entry] of ranked.entries()) {
    const goalDifference = entry.goalsFor - entry.goalsAgainst;

    await prisma.standing.upsert({
      where: {
        championshipId_teamId: {
          championshipId,
          teamId: entry.teamId,
        },
      },
      update: {
        rank: index + 1,
        points: entry.points,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference,
        winRate:
          entry.gamesPlayed > 0
            ? Math.round((entry.points / (entry.gamesPlayed * 3)) * 100)
            : 0,
      },
      create: {
        championshipId,
        teamId: entry.teamId,
        rank: index + 1,
        points: entry.points,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference,
        winRate:
          entry.gamesPlayed > 0
            ? Math.round((entry.points / (entry.gamesPlayed * 3)) * 100)
            : 0,
      },
    });
  }
}

async function main() {
  console.log("🏆 Upserting Copa Tio Hugo 2026 championship...");

  const championship = await prisma.championship.upsert({
    where: { slug: championshipSlug },
    update: {
      name: "Copa Tio Hugo",
      description:
        "Clube: Clube XV Veranistas. Temporada/ano: 2026. Formato: 5 times, todos contra todos em turno único; top 4 classificados; semifinais 1º x 4º e 2º x 3º; final; equipe de melhor campanha tem vantagem do empate no mata-mata; jogos com 2 tempos de 20 minutos. Jogadores biônicos devem ser cadastrados como BIONICO apenas quando usados para completar uma equipe por ausência de jogador original.",
      format: "MISTO",
      registrationMode: "FECHADO",
      seasonLabel: "2026",
      startsAt: atClubTime("2026-06-25"),
      endsAt: atClubTime("2026-08-06"),
      status: "ATIVO",
    },
    create: {
      name: "Copa Tio Hugo",
      slug: championshipSlug,
      description:
        "Clube: Clube XV Veranistas. Temporada/ano: 2026. Formato: 5 times, todos contra todos em turno único; top 4 classificados; semifinais 1º x 4º e 2º x 3º; final; equipe de melhor campanha tem vantagem do empate no mata-mata; jogos com 2 tempos de 20 minutos. Jogadores biônicos devem ser cadastrados como BIONICO apenas quando usados para completar uma equipe por ausência de jogador original.",
      format: "MISTO",
      registrationMode: "FECHADO",
      seasonLabel: "2026",
      startsAt: atClubTime("2026-06-25"),
      endsAt: atClubTime("2026-08-06"),
      status: "ATIVO",
    },
  });

  console.log(`✅ Championship ready: ${championship.name} (${clubName})`);
  console.log("🧹 Removing duplicate country-team links from earlier seed attempts, if any...");

  const duplicateTeams = await prisma.team.findMany({
    where: {
      slug: {
        in: teams.flatMap((team) => team.duplicateSlugs),
      },
    },
    select: { id: true },
  });
  const duplicateTeamIds = duplicateTeams.map((team) => team.id);

  if (duplicateTeamIds.length > 0) {
    await prisma.match.deleteMany({
      where: {
        championshipId: championship.id,
        OR: [{ homeTeamId: { in: duplicateTeamIds } }, { awayTeamId: { in: duplicateTeamIds } }],
        homeScore: null,
        awayScore: null,
      },
    });
    await prisma.championshipTeam.deleteMany({
      where: {
        championshipId: championship.id,
        teamId: { in: duplicateTeamIds },
      },
    });
    await prisma.standing.deleteMany({
      where: {
        championshipId: championship.id,
        teamId: { in: duplicateTeamIds },
      },
    });
  }

  console.log("👕 Upserting teams, championship teams, standings, and official rosters...");

  const teamByName = new Map<string, { id: string; seed: number }>();

  for (const [index, teamData] of teams.entries()) {
    const seed = index + 1;
    const team = await prisma.team.upsert({
      where: { slug: teamData.slug },
      update: {
        name: teamData.name,
        shortName: teamData.shortName,
        icon: teamData.icon,
      },
      create: {
        name: teamData.name,
        shortName: teamData.shortName,
        slug: teamData.slug,
        icon: teamData.icon,
      },
    });

    teamByName.set(teamData.name, { id: team.id, seed });

    await prisma.championshipTeam.upsert({
      where: {
        championshipId_teamId: {
          championshipId: championship.id,
          teamId: team.id,
        },
      },
      update: {
        seed,
        displayOrder: seed,
        groupLabel: "Único",
      },
      create: {
        championshipId: championship.id,
        teamId: team.id,
        seed,
        displayOrder: seed,
        groupLabel: "Único",
      },
    });

    await prisma.standing.upsert({
      where: {
        championshipId_teamId: {
          championshipId: championship.id,
          teamId: team.id,
        },
      },
      update: {
        rank: seed,
      },
      create: {
        championshipId: championship.id,
        teamId: team.id,
        rank: seed,
      },
    });

    for (const [playerIndex, playerName] of teamData.players.entries()) {
      const registration = await upsertRegistration(championship.id, playerName);

      await prisma.championshipPlayer.upsert({
        where: { registrationId: registration.id },
        update: {
          championshipId: championship.id,
          teamId: team.id,
          rosterOrder: playerIndex + 1,
          status: "ATIVO",
        },
        create: {
          championshipId: championship.id,
          registrationId: registration.id,
          teamId: team.id,
          rosterOrder: playerIndex + 1,
          status: "ATIVO",
        },
      });
    }
  }

  console.log("✅ Official roster players ready. No bionic players were created.");
  console.log("🧩 Upserting stages...");

  const groupStage = await prisma.championshipStage.upsert({
    where: { championshipId_order: { championshipId: championship.id, order: 1 } },
    update: {
      name: "Fase classificatória",
      stageType: "GRUPO",
      startsAt: atClubTime("2026-06-25"),
      endsAt: atClubTime("2026-07-23"),
    },
    create: {
      championshipId: championship.id,
      name: "Fase classificatória",
      order: 1,
      stageType: "GRUPO",
      startsAt: atClubTime("2026-06-25"),
      endsAt: atClubTime("2026-07-23"),
    },
  });

  const semifinalStage = await prisma.championshipStage.upsert({
    where: { championshipId_order: { championshipId: championship.id, order: 2 } },
    update: {
      name: "Semifinais",
      stageType: "SEMIFINAL",
      startsAt: atClubTime("2026-07-30"),
      endsAt: atClubTime("2026-07-30"),
    },
    create: {
      championshipId: championship.id,
      name: "Semifinais",
      order: 2,
      stageType: "SEMIFINAL",
      startsAt: atClubTime("2026-07-30"),
      endsAt: atClubTime("2026-07-30"),
    },
  });

  const finalStage = await prisma.championshipStage.upsert({
    where: { championshipId_order: { championshipId: championship.id, order: 3 } },
    update: {
      name: "Final",
      stageType: "FINAL",
      startsAt: atClubTime("2026-08-06"),
      endsAt: atClubTime("2026-08-06"),
    },
    create: {
      championshipId: championship.id,
      name: "Final",
      order: 3,
      stageType: "FINAL",
      startsAt: atClubTime("2026-08-06"),
      endsAt: atClubTime("2026-08-06"),
    },
  });

  console.log("📅 Upserting regular stage matches...");

  for (const [index, match] of regularMatches.entries()) {
    const homeTeam = teamByName.get(match.home);
    const awayTeam = teamByName.get(match.away);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Team not found for match ${match.home} x ${match.away}.`);
    }

    await upsertMatch({
      championshipId: championship.id,
      stageId: groupStage.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      round: match.round,
      roundNumber: (index % 2) + 1,
      scheduledAt: atClubTime(match.date),
      status: "AGENDADO",
      homeScore: null,
      awayScore: null,
      notes: `Rodada ${match.round}. Folga: ${match.bye}.`,
    });
  }

  console.log("🥅 Upserting knockout placeholders...");

  const seed = (value: number) => {
    const found = [...teamByName.values()].find((team) => team.seed === value);
    if (!found) {
      throw new Error(`Seed ${value} not found.`);
    }
    return found;
  };

  await upsertMatch({
    championshipId: championship.id,
    stageId: semifinalStage.id,
    homeTeamId: seed(1).id,
    awayTeamId: seed(4).id,
    round: 6,
    roundNumber: 1,
    scheduledAt: atClubTime("2026-07-30"),
    status: "AGENDADO",
    homeScore: null,
    awayScore: null,
    notes:
      "Placeholder da semifinal: atualizar participantes após a fase classificatória (1º x 4º). O melhor classificado tem vantagem do empate.",
  });

  await upsertMatch({
    championshipId: championship.id,
    stageId: semifinalStage.id,
    homeTeamId: seed(2).id,
    awayTeamId: seed(3).id,
    round: 6,
    roundNumber: 2,
    scheduledAt: atClubTime("2026-07-30"),
    status: "AGENDADO",
    homeScore: null,
    awayScore: null,
    notes:
      "Placeholder da semifinal: atualizar participantes após a fase classificatória (2º x 3º). O melhor classificado tem vantagem do empate.",
  });

  await upsertMatch({
    championshipId: championship.id,
    stageId: finalStage.id,
    homeTeamId: seed(1).id,
    awayTeamId: seed(2).id,
    round: 7,
    roundNumber: 1,
    scheduledAt: atClubTime("2026-08-06"),
    status: "AGENDADO",
    homeScore: null,
    awayScore: null,
    notes:
      "Placeholder da final: atualizar finalistas após as semifinais. O melhor classificado na fase classificatória tem vantagem do empate.",
  });

  console.log("📝 Registering Round 1 results, participations, and cards...");

  const jordania = teamByName.get("JORDÂNIA");
  const senegal = teamByName.get("SENEGAL");
  const caboVerde = teamByName.get("CABO VERDE");
  const curacao = teamByName.get("CURAÇAU");

  if (!jordania || !senegal || !caboVerde || !curacao) {
    throw new Error("Round 1 teams were not found.");
  }

  const jordaniaTeam = teams.find((team) => team.name === "JORDÂNIA");
  const senegalTeam = teams.find((team) => team.name === "SENEGAL");
  const caboVerdeTeam = teams.find((team) => team.name === "CABO VERDE");

  if (!jordaniaTeam || !senegalTeam || !caboVerdeTeam) {
    throw new Error("Round 1 roster definitions were not found.");
  }

  const jordaniaCaboVerde = await findMatch(championship.id, jordania.id, caboVerde.id);
  const senegalCuracao = await findMatch(championship.id, senegal.id, curacao.id);

  await prisma.match.update({
    where: { id: jordaniaCaboVerde.id },
    data: {
      homeScore: 2,
      awayScore: 5,
      status: "FINALIZADO",
      referee: "Diego S. Vieira",
      scheduledAt: atClubTime("2026-06-25", "20:15"),
      notes: "Rodada 1. Folga: BÓSNIA.",
    },
  });

  await prisma.match.update({
    where: { id: senegalCuracao.id },
    data: {
      homeScore: 8,
      awayScore: 3,
      status: "FINALIZADO",
      referee: "Diego S. Vieira",
      scheduledAt: atClubTime("2026-06-25", "20:15"),
      notes: "Rodada 1. Folga: BÓSNIA.",
    },
  });

  await registerTeamParticipations({
    matchId: jordaniaCaboVerde.id,
    teamId: jordania.id,
    players: jordaniaTeam.players,
    stats: {
      "Gabriel (Amigo Pepe)": { goals: 1 },
      Haendel: { goals: 1 },
    },
  });
  await registerTeamParticipations({
    matchId: jordaniaCaboVerde.id,
    teamId: caboVerde.id,
    players: caboVerdeTeam.players,
    stats: {
      Gordo: { goals: 1, yellowCards: 1 },
      F2: { goals: 2, mvp: true },
      Iguin: { goals: 2 },
      Carlos: { yellowCards: 1 },
    },
  });

  await registerTeamParticipations({
    matchId: senegalCuracao.id,
    teamId: senegal.id,
    players: senegalTeam.players,
    stats: {
      Dinho: { goals: 4 },
      Fred: { goals: 1 },
      Pedrinho: { goals: 3, yellowCards: 1, mvp: true },
    },
  });

  await registerTeamParticipations({
    matchId: senegalCuracao.id,
    teamId: curacao.id,
    players: ["Melinho", "Danny", "Lucca", "Gilbertinho", "Dadá"],
    stats: {
      Danny: { yellowCards: 2, redCards: 1 },
      Lucca: { goals: 1 },
      Gilbertinho: { goals: 2 },
    },
  });

  await upsertParticipation({
    matchId: senegalCuracao.id,
    playerName: "Wandinho",
    teamId: curacao.id,
    starter: false,
    bionic: true,
  });

  console.log("📊 Recalculating standings from finalized group matches...");
  await recalculateStandings(
    championship.id,
    teams.map((team) => {
      const seededTeam = teamByName.get(team.name);
      if (!seededTeam) {
        throw new Error(`Seeded team not found for standings: ${team.name}.`);
      }
      return seededTeam.id;
    }),
  );

  console.log("✅ Copa Tio Hugo 2026 seed completed with schedule and Round 1 history.");
}

main()
  .catch((error) => {
    console.error("❌ Failed to seed Copa Tio Hugo 2026.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
