import type { PlayerLevel, PreferredPosition } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function normalizeFullName(fullName: string) {
  return fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getAgeFromBirthDate(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function getAthleteProfileAge(input: {
  birthDate?: Date | null;
  lastKnownAge?: number | null;
}) {
  if (input.birthDate) {
    return getAgeFromBirthDate(input.birthDate);
  }

  return input.lastKnownAge ?? null;
}

export type AthleteProfilePrefillOption = {
  id: string;
  fullName: string;
  nickname: string | null;
  preferredPosition: PreferredPosition | null;
  age: number | null;
  defaultLevel: PlayerLevel | null;
};

export async function listAthleteProfilePrefillOptions() {
  const profiles = await prisma.athleteProfile.findMany({
    orderBy: [{ nickname: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      nickname: true,
      preferredPosition: true,
      birthDate: true,
      lastKnownAge: true,
      defaultLevel: true,
    },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.fullName,
    nickname: profile.nickname,
    preferredPosition: profile.preferredPosition,
    age: getAthleteProfileAge(profile),
    defaultLevel: profile.defaultLevel,
  })) satisfies AthleteProfilePrefillOption[];
}

export async function syncAthleteProfileFromRegistration(input: {
  fullName: string;
  nickname?: string | null;
  preferredPosition: PreferredPosition;
  birthDate: Date;
  phone: string;
  email?: string | null;
  level?: PlayerLevel | null;
}) {
  const normalizedFullName = normalizeFullName(input.fullName);

  const profile = await prisma.athleteProfile.upsert({
    where: {
      normalizedFullName,
    },
    update: {
      fullName: input.fullName,
      nickname: input.nickname || null,
      preferredPosition: input.preferredPosition,
      birthDate: input.birthDate,
      phone: input.phone,
      email: input.email || null,
      defaultLevel: input.level ?? undefined,
    },
    create: {
      fullName: input.fullName,
      normalizedFullName,
      nickname: input.nickname || null,
      preferredPosition: input.preferredPosition,
      birthDate: input.birthDate,
      phone: input.phone,
      email: input.email || null,
      defaultLevel: input.level ?? null,
    },
    select: {
      id: true,
    },
  });

  return profile.id;
}

export async function syncAthleteProfileFromPeladaConfirmation(input: {
  athleteProfileId?: string | null;
  fullName: string;
  preferredPosition: PreferredPosition;
  age?: number | null;
  level?: PlayerLevel | null;
}) {
  const normalizedFullName = normalizeFullName(input.fullName);

  if (input.athleteProfileId) {
    const profile = await prisma.athleteProfile.update({
      where: {
        id: input.athleteProfileId,
      },
      data: {
        fullName: input.fullName,
        normalizedFullName,
        preferredPosition: input.preferredPosition,
        lastKnownAge: input.age ?? undefined,
        defaultLevel: input.level ?? undefined,
      },
      select: {
        id: true,
      },
    });

    return profile.id;
  }

  const profile = await prisma.athleteProfile.upsert({
    where: {
      normalizedFullName,
    },
    update: {
      fullName: input.fullName,
      preferredPosition: input.preferredPosition,
      lastKnownAge: input.age ?? undefined,
      defaultLevel: input.level ?? undefined,
    },
    create: {
      fullName: input.fullName,
      normalizedFullName,
      preferredPosition: input.preferredPosition,
      lastKnownAge: input.age ?? null,
      defaultLevel: input.level ?? null,
    },
    select: {
      id: true,
    },
  });

  return profile.id;
}

export async function syncAthleteProfileFromPeladaArrival(input: {
  athleteProfileId?: string | null;
  fullName: string;
  preferredPosition: PreferredPosition;
  age?: number | null;
}) {
  const normalizedFullName = normalizeFullName(input.fullName);

  if (input.athleteProfileId) {
    const profile = await prisma.athleteProfile.update({
      where: {
        id: input.athleteProfileId,
      },
      data: {
        fullName: input.fullName,
        normalizedFullName,
        preferredPosition: input.preferredPosition,
        lastKnownAge: input.age ?? undefined,
      },
      select: {
        id: true,
      },
    });

    return profile.id;
  }

  const profile = await prisma.athleteProfile.upsert({
    where: {
      normalizedFullName,
    },
    update: {
      fullName: input.fullName,
      preferredPosition: input.preferredPosition,
      lastKnownAge: input.age ?? undefined,
    },
    create: {
      fullName: input.fullName,
      normalizedFullName,
      preferredPosition: input.preferredPosition,
      lastKnownAge: input.age ?? null,
    },
    select: {
      id: true,
    },
  });

  return profile.id;
}
