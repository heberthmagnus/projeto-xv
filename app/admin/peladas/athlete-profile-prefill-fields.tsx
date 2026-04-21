"use client";

import { useId, useMemo, useState } from "react";
import type { AthleteProfilePrefillOption } from "@/lib/athlete-profiles";
import { PLAYER_LEVEL_OPTIONS, getPositionLabel } from "@/lib/peladas";

const POSITION_OPTIONS = [
  "GOLEIRO",
  "LATERAL",
  "ZAGUEIRO",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
] as const;

type AthleteProfilePrefillFieldsProps = {
  athleteProfiles: AthleteProfilePrefillOption[];
  initialValues?: {
    athleteProfileId?: string;
    fullName: string;
    preferredPosition: string;
    age: number | string;
    level?: string | null;
  };
  fullNameLabel?: string;
  includeLevel?: boolean;
  ageRequired?: boolean;
};

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function AthleteProfilePrefillFields({
  athleteProfiles,
  initialValues,
  fullNameLabel = "Nome ou apelido",
  includeLevel = true,
  ageRequired = false,
}: AthleteProfilePrefillFieldsProps) {
  const dataListId = useId();
  const [fullName, setFullName] = useState(initialValues?.fullName || "");
  const [athleteProfileId, setAthleteProfileId] = useState(
    initialValues?.athleteProfileId || "",
  );
  const [preferredPosition, setPreferredPosition] = useState(
    initialValues?.preferredPosition || "",
  );
  const [age, setAge] = useState(
    initialValues?.age === null || initialValues?.age === undefined
      ? ""
      : String(initialValues.age),
  );
  const [level, setLevel] = useState(initialValues?.level || "");
  const [manualPosition, setManualPosition] = useState(
    Boolean(initialValues?.preferredPosition),
  );
  const [manualAge, setManualAge] = useState(
    initialValues?.age !== "" &&
      initialValues?.age !== null &&
      initialValues?.age !== undefined,
  );
  const [manualLevel, setManualLevel] = useState(Boolean(initialValues?.level));

  const profilesBySearchTerm = useMemo(() => {
    const entries = new Map<string, AthleteProfilePrefillOption>();

    for (const profile of athleteProfiles) {
      entries.set(normalizeValue(profile.fullName), profile);

      if (profile.nickname) {
        entries.set(normalizeValue(profile.nickname), profile);
      }
    }

    return entries;
  }, [athleteProfiles]);

  const matchedProfile = useMemo(() => {
    const normalizedName = normalizeValue(fullName);

    if (!normalizedName) {
      return null;
    }

    return profilesBySearchTerm.get(normalizedName) || null;
  }, [fullName, profilesBySearchTerm]);

  function applyMatchedProfile(profile: AthleteProfilePrefillOption | null) {
    if (!profile) {
      setAthleteProfileId("");
      return;
    }

    setAthleteProfileId(profile.id);

    if (!manualPosition && !preferredPosition && profile.preferredPosition) {
      setPreferredPosition(profile.preferredPosition);
    }

    if (!manualAge && !age && profile.age !== null) {
      setAge(String(profile.age));
    }

    if (includeLevel && !manualLevel && !level && profile.defaultLevel) {
      setLevel(profile.defaultLevel);
    }
  }

  return (
    <>
      <input type="hidden" name="athleteProfileId" value={athleteProfileId} />

      <FormField label={fullNameLabel}>
        <input
          name="fullName"
          type="text"
          value={fullName}
          onChange={(event) => {
            const nextFullName = event.target.value;
            const nextMatch =
              profilesBySearchTerm.get(normalizeValue(nextFullName)) || null;

            setFullName(nextFullName);
            applyMatchedProfile(nextMatch);
          }}
          list={dataListId}
          required
          style={inputStyle}
        />
        <datalist id={dataListId}>
          {athleteProfiles.flatMap((profile) => {
            const options = [
              <option key={`${profile.id}-full`} value={profile.fullName} />,
            ];

            if (profile.nickname) {
              options.push(
                <option key={`${profile.id}-nick`} value={profile.nickname} />,
              );
            }

            return options;
          })}
        </datalist>
        {matchedProfile ? (
          <span style={hintStyle}>
            Perfil-base encontrado:{" "}
            <strong>
              {matchedProfile.nickname
                ? `${matchedProfile.nickname} (${matchedProfile.fullName})`
                : matchedProfile.fullName}
            </strong>
          </span>
        ) : null}
      </FormField>

      <FormField label="Posição">
        <select
          name="preferredPosition"
          value={preferredPosition}
          onChange={(event) => {
            setManualPosition(true);
            setPreferredPosition(event.target.value);
          }}
          required
          style={inputStyle}
        >
          <option value="" disabled>
            Selecione
          </option>
          {POSITION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {getPositionLabel(option)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Idade">
        <input
          name="age"
          type="number"
          min={1}
          max={99}
          value={age}
          onChange={(event) => {
            setManualAge(true);
            setAge(event.target.value);
          }}
          required={ageRequired}
          style={inputStyle}
        />
      </FormField>

      {includeLevel ? (
        <FormField label="Nível">
          <select
            name="level"
            value={level}
            onChange={(event) => {
              setManualLevel(true);
              setLevel(event.target.value);
            }}
            style={inputStyle}
          >
            {PLAYER_LEVEL_OPTIONS.map((option) => (
              <option key={option.value || "NONE"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}
    </>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#101010",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6B7280",
};
