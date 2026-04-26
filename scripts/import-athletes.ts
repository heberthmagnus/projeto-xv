import { PrismaClient, type PlayerLevel, type PreferredPosition } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const validPreferredPositions = new Set<PreferredPosition>([
  "GOLEIRO",
  "LATERAL",
  "ZAGUEIRO",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
]);

const validPlayerLevels = new Set<PlayerLevel>(["A", "B", "C", "D", "E"]);

type CsvRow = Record<string, string>;

type ImportStats = {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const csvCandidates = [
  path.join(projectRoot, "data", "SociosDoXVAtualizados.csv"),
  path.join(projectRoot, "data", "SóciosDoXVAtualizados.csv"),
  path.join(projectRoot, "data", "SóciosDoXVAtualizados.csv"),
];

async function main() {
  const csvPath = csvCandidates.find((candidate) => existsSync(candidate));

  if (!csvPath) {
    throw new Error(
      `CSV file not found. Tried: ${csvCandidates
        .map((candidate) => path.relative(projectRoot, candidate))
        .join(", ")}`,
    );
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const stats: ImportStats = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`Importing active athlete profiles from ${path.relative(projectRoot, csvPath)}`);

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;
    const fullName = clean(row.fullName);
    const normalizedFullName =
      clean(row.normalizedFullName) || normalizeFullName(fullName);
    const nickname = clean(row.nickname);
    const preferredPosition = parsePreferredPosition(row.preferredPosition);
    const defaultLevel = parsePlayerLevel(row.defaultLevel);
    const birthDate = parseBirthDate(row.birthDate);
    const lastKnownAge = parseOptionalInteger(row.lastKnownAge);
    const phone = clean(row.phone);
    const email = clean(row.email);
    const logName = fullName || `(row ${rowNumber})`;

    try {
      if (!fullName) {
        stats.skipped += 1;
        console.log(`${logName} - SKIPPED (missing fullName)`);
        continue;
      }

      if (!nickname || !clean(row.preferredPosition) || !clean(row.defaultLevel)) {
        stats.skipped += 1;
        console.log(`${fullName} - SKIPPED (missing player data)`);
        continue;
      }

      if (!preferredPosition) {
        stats.skipped += 1;
        console.log(`${fullName} - SKIPPED (invalid preferredPosition)`);
        continue;
      }

      if (!defaultLevel) {
        stats.skipped += 1;
        console.log(`${fullName} - SKIPPED (invalid defaultLevel)`);
        continue;
      }

      const existingProfile = await findExistingProfile({
        normalizedFullName,
        fullName,
      });

      if (existingProfile) {
        const data = removeUndefined({
          fullName,
          normalizedFullName,
          nickname,
          preferredPosition,
          birthDate,
          lastKnownAge,
          defaultLevel,
          phone,
          email,
        });

        await prisma.athleteProfile.update({
          where: { id: existingProfile.id },
          data,
        });

        stats.updated += 1;
        console.log(`${fullName} - UPDATED`);
        continue;
      }

      await prisma.athleteProfile.create({
        data: removeUndefined({
          fullName,
          normalizedFullName,
          nickname,
          preferredPosition,
          birthDate,
          lastKnownAge,
          defaultLevel,
          phone,
          email,
        }),
      });

      stats.imported += 1;
      console.log(`${fullName} - CREATED`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push(`${fullName || `row ${rowNumber}`}: ${message}`);
      console.log(`${logName} - SKIPPED (error)`);
    }
  }

  console.log("");
  console.log("Import summary");
  console.log(`Imported: ${stats.imported}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("");
    console.log("Errors");
    for (const error of stats.errors) {
      console.log(`- ${error}`);
    }
  }
}

async function findExistingProfile(input: {
  normalizedFullName: string;
  fullName: string;
}) {
  if (input.normalizedFullName) {
    const profile = await prisma.athleteProfile.findUnique({
      where: { normalizedFullName: input.normalizedFullName },
      select: { id: true },
    });

    if (profile) {
      return profile;
    }
  }

  return prisma.athleteProfile.findFirst({
    where: { fullName: input.fullName },
    select: { id: true },
  });
}

function parseCsv(content: string) {
  const records = parseDelimited(content.trim());
  const headerIndex = records.findIndex((record) => record.includes("fullName"));

  if (headerIndex === -1) {
    throw new Error("CSV header row not found.");
  }

  const headers = records[headerIndex].map(clean);

  return records.slice(headerIndex + 1).flatMap((record) => {
    if (record.every((value) => !clean(value))) {
      return [];
    }

    return [
      headers.reduce<CsvRow>((row, header, columnIndex) => {
        row[header] = record[columnIndex] ?? "";
        return row;
      }, {}),
    ];
  });
}

function parseDelimited(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ";" && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);

  return rows;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeFullName(fullName: string) {
  return fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parsePreferredPosition(value: unknown) {
  const parsed = clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase() as PreferredPosition;

  return validPreferredPositions.has(parsed) ? parsed : null;
}

function parsePlayerLevel(value: unknown) {
  const parsed = clean(value).toUpperCase() as PlayerLevel;
  return validPlayerLevels.has(parsed) ? parsed : null;
}

function parseBirthDate(value: unknown) {
  const raw = clean(value);

  if (!raw) {
    return undefined;
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseOptionalInteger(value: unknown) {
  const raw = clean(value);

  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function removeUndefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== ""),
  ) as T;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
