import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLUB_UTC_OFFSET = "-03:00";
const CLUB_TIME_ZONE = "America/Sao_Paulo";
const CAMPINHO_END_DATE = "2026-12-31";
const CAMPAO_END_DATE = "2026-07-26";

const HOLIDAY_KEYS_2026 = new Set([
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-04-03",
  "2026-04-21",
  "2026-05-01",
  "2026-06-04",
  "2026-09-07",
  "2026-10-12",
  "2026-11-02",
  "2026-11-15",
  "2026-12-25",
]);

const COPA_TIO_HUGO_THURSDAYS_2026 = new Set([
  "2026-05-07",
  "2026-05-14",
  "2026-05-21",
  "2026-05-28",
  "2026-06-11",
  "2026-06-18",
  "2026-06-25",
]);

async function main() {
  const todayKey = getClubDateKey(new Date());
  const peladas2026 = await prisma.pelada.findMany({
    where: {
      scheduledAt: {
        gte: buildDateTime("2026-01-01", "00:00"),
        lt: buildDateTime("2027-01-01", "00:00"),
      },
    },
    select: {
      id: true,
      type: true,
      scheduledAt: true,
    },
  });

  const existingKeys = new Set(
    peladas2026.map((pelada) => `${pelada.type}|${pelada.scheduledAt.toISOString()}`),
  );

  const toCreate = [
    ...buildCampinhoPeladas(todayKey),
    ...buildCampaoPeladas(todayKey),
  ].filter((pelada) => !existingKeys.has(`${pelada.type}|${pelada.scheduledAt.toISOString()}`));

  if (toCreate.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          created: 0,
          skippedBecauseExisting: peladas2026.length,
          message: "Nenhuma pelada nova precisava ser criada.",
        },
        null,
        2,
      ),
    );
    return;
  }

  await prisma.pelada.createMany({
    data: toCreate,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        created: toCreate.length,
        createdCampinho: toCreate.filter((pelada) => pelada.type === "CAMPINHO").length,
        createdCampao: toCreate.filter((pelada) => pelada.type === "CAMPAO").length,
        fromDate: todayKey,
        throughCampinho: CAMPINHO_END_DATE,
        throughCampao: CAMPAO_END_DATE,
      },
      null,
      2,
    ),
  );
}

function buildCampinhoPeladas(fromDateKey) {
  const candidates = [];

  for (const dateKey of iterateDateKeys(fromDateKey, CAMPINHO_END_DATE)) {
    if (getWeekday(dateKey) !== 4) {
      continue;
    }

    if (HOLIDAY_KEYS_2026.has(dateKey) || COPA_TIO_HUGO_THURSDAYS_2026.has(dateKey)) {
      continue;
    }

    candidates.push({
      scheduledAt: buildDateTime(dateKey, "19:30"),
      type: "CAMPINHO",
      firstGameRule: "SORTEIO",
      arrivalCutoffTime: "19:15",
      maxFirstGamePlayers: null,
      roundDurationMinutes: 20,
      linePlayersCount: 6,
      status: "ABERTA",
      notes: "Gerada automaticamente - Campinho 2026",
    });
  }

  return candidates;
}

function buildCampaoPeladas(fromDateKey) {
  const candidates = [];

  for (const dateKey of iterateDateKeys(fromDateKey, CAMPAO_END_DATE)) {
    if (getWeekday(dateKey) !== 0) {
      continue;
    }

    if (HOLIDAY_KEYS_2026.has(dateKey)) {
      continue;
    }

    candidates.push({
      scheduledAt: buildDateTime(dateKey, "09:00"),
      type: "CAMPAO",
      firstGameRule: "ORDEM_DE_CHEGADA",
      arrivalCutoffTime: "09:00",
      maxFirstGamePlayers: 16,
      roundDurationMinutes: 35,
      linePlayersCount: 8,
      status: "ABERTA",
      notes: "Gerada automaticamente - Campão 2026",
    });
  }

  return candidates;
}

function* iterateDateKeys(startKey, endKey) {
  let current = buildDateTime(startKey, "12:00");
  const end = buildDateTime(endKey, "12:00");

  while (current.getTime() <= end.getTime()) {
    yield getClubDateKey(current);
    current.setDate(current.getDate() + 1);
  }
}

function buildDateTime(dateKey, time) {
  return new Date(`${dateKey}T${time}:00${CLUB_UTC_OFFSET}`);
}

function getClubDateKey(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CLUB_TIME_ZONE,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getWeekday(dateKey) {
  return buildDateTime(dateKey, "12:00").getDay();
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
