import {
  PrismaClient,
  type AthleteProfile,
  type PeladaConfirmation,
  type Prisma,
} from "@prisma/client";

const prisma = new PrismaClient();

type ProfileMatchSource = "normalizedFullName" | "fullName" | "nickname";

type ProfileCandidate = Pick<
  AthleteProfile,
  "id" | "fullName" | "normalizedFullName" | "nickname" | "preferredPosition" | "defaultLevel"
>;

type ConfirmationCandidate = Pick<
  PeladaConfirmation,
  "id" | "fullName" | "athleteProfileId" | "level" | "preferredPosition" | "parentConfirmationId"
>;

type MatchResult =
  | {
      status: "FOUND";
      profile: ProfileCandidate;
      source: ProfileMatchSource | "existingLink";
    }
  | {
      status: "NOT_FOUND";
    }
  | {
      status: "AMBIGUOUS";
      source: ProfileMatchSource;
      profiles: ProfileCandidate[];
    };

type Stats = {
  linked: number;
  updated: number;
  skippedNotFound: number;
  skippedAmbiguous: number;
  notFoundExamples: string[];
  ambiguousExamples: string[];
};

async function main() {
  const [profiles, confirmations] = await Promise.all([
    prisma.athleteProfile.findMany({
      select: {
        id: true,
        fullName: true,
        normalizedFullName: true,
        nickname: true,
        preferredPosition: true,
        defaultLevel: true,
      },
      orderBy: [{ fullName: "asc" }],
    }),
    prisma.peladaConfirmation.findMany({
      select: {
        id: true,
        fullName: true,
        athleteProfileId: true,
        level: true,
        preferredPosition: true,
        parentConfirmationId: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const stats: Stats = {
    linked: 0,
    updated: 0,
    skippedNotFound: 0,
    skippedAmbiguous: 0,
    notFoundExamples: [],
    ambiguousExamples: [],
  };

  console.log(`Loaded ${profiles.length} athlete profiles.`);
  console.log(`Processing ${confirmations.length} pelada confirmations.`);
  console.log("");

  for (const confirmation of confirmations) {
    const match = findProfileMatch(confirmation, profiles, profileById);
    const role = confirmation.parentConfirmationId ? "guest" : "main";

    if (match.status === "NOT_FOUND") {
      stats.skippedNotFound += 1;
      pushExample(stats.notFoundExamples, confirmation.fullName);
      console.log(`${confirmation.fullName} (${role}) - NOT_FOUND`);
      continue;
    }

    if (match.status === "AMBIGUOUS") {
      stats.skippedAmbiguous += 1;
      pushExample(
        stats.ambiguousExamples,
        `${confirmation.fullName} via ${match.source}: ${match.profiles
          .map((profile) => profile.fullName)
          .join(" | ")}`,
      );
      console.log(`${confirmation.fullName} (${role}) - AMBIGUOUS (${match.source})`);
      continue;
    }

    const updateData = buildUpdateData(confirmation, match.profile);

    if (Object.keys(updateData).length === 0) {
      console.log(`${confirmation.fullName} (${role}) - SKIPPED (already linked/current)`);
      continue;
    }

    await prisma.peladaConfirmation.update({
      where: { id: confirmation.id },
      data: updateData,
    });

    if (!confirmation.athleteProfileId) {
      stats.linked += 1;
      console.log(
        `${confirmation.fullName} (${role}) - LINKED (${match.source} -> ${match.profile.fullName})`,
      );
    } else {
      console.log(
        `${confirmation.fullName} (${role}) - UPDATED (${match.source} -> ${match.profile.fullName})`,
      );
    }

    if (filledMissingPlayerData(confirmation, match.profile)) {
      stats.updated += 1;
    }
  }

  console.log("");
  console.log("Backfill summary");
  console.log(`Linked: ${stats.linked}`);
  console.log(`Updated missing player data: ${stats.updated}`);
  console.log(`Skipped NOT_FOUND: ${stats.skippedNotFound}`);
  console.log(`Skipped AMBIGUOUS: ${stats.skippedAmbiguous}`);

  if (stats.notFoundExamples.length > 0) {
    console.log("");
    console.log("Examples NOT_FOUND");
    for (const example of stats.notFoundExamples) {
      console.log(`- ${example}`);
    }
  }

  if (stats.ambiguousExamples.length > 0) {
    console.log("");
    console.log("Examples AMBIGUOUS");
    for (const example of stats.ambiguousExamples) {
      console.log(`- ${example}`);
    }
  }
}

function findProfileMatch(
  confirmation: ConfirmationCandidate,
  profiles: ProfileCandidate[],
  profileById: Map<string, ProfileCandidate>,
): MatchResult {
  if (confirmation.athleteProfileId) {
    const profile = profileById.get(confirmation.athleteProfileId);

    if (profile) {
      return {
        status: "FOUND",
        profile,
        source: "existingLink",
      };
    }
  }

  const normalizedConfirmationName = normalizeName(confirmation.fullName);

  return (
    matchBySource(
      profiles,
      normalizedConfirmationName,
      "normalizedFullName",
      (profile) => profile.normalizedFullName,
    ) ||
    matchBySource(
      profiles,
      normalizedConfirmationName,
      "fullName",
      (profile) => profile.fullName,
    ) ||
    matchBySource(
      profiles,
      normalizedConfirmationName,
      "nickname",
      (profile) => profile.nickname,
    ) || { status: "NOT_FOUND" }
  );
}

function matchBySource(
  profiles: ProfileCandidate[],
  normalizedConfirmationName: string,
  source: ProfileMatchSource,
  getValue: (profile: ProfileCandidate) => string | null,
): MatchResult | null {
  const matches = profiles.filter(
    (profile) => normalizeName(getValue(profile) || "") === normalizedConfirmationName,
  );

  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return {
      status: "FOUND",
      profile: matches[0],
      source,
    };
  }

  return {
    status: "AMBIGUOUS",
    source,
    profiles: matches,
  };
}

function buildUpdateData(
  confirmation: ConfirmationCandidate,
  profile: ProfileCandidate,
) {
  const data: Prisma.PeladaConfirmationUncheckedUpdateInput = {};

  if (!confirmation.athleteProfileId) {
    data.athleteProfileId = profile.id;
  }

  if (!confirmation.level && profile.defaultLevel) {
    data.level = profile.defaultLevel;
  }

  if (!confirmation.preferredPosition && profile.preferredPosition) {
    data.preferredPosition = profile.preferredPosition;
  }

  return data;
}

function filledMissingPlayerData(
  confirmation: ConfirmationCandidate,
  profile: ProfileCandidate,
) {
  return (
    (!confirmation.level && Boolean(profile.defaultLevel)) ||
    (!confirmation.preferredPosition && Boolean(profile.preferredPosition))
  );
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function pushExample(examples: string[], value: string) {
  if (examples.length < 10) {
    examples.push(value);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
