export const PELADA_TYPE_OPTIONS = [
  { value: "CAMPINHO", label: "Campinho" },
  { value: "CAMPAO", label: "Campão" },
] as const;

export const FIRST_GAME_RULE_OPTIONS = [
  { value: "SORTEIO", label: "Sorteio" },
  { value: "ORDEM_DE_CHEGADA", label: "Ordem de chegada" },
] as const;

export const PELADA_STATUS_OPTIONS = [
  { value: "ABERTA", label: "Aberta" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
] as const;

export const GOALKEEPER_SIDE_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: "GOLEIRO_A", label: "Goleiro A" },
  { value: "GOLEIRO_B", label: "Goleiro B" },
] as const;

export const PLAYER_LEVEL_OPTIONS = [
  { value: "", label: "Sem nível" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
] as const;

export type PeladaTypeValue = (typeof PELADA_TYPE_OPTIONS)[number]["value"];
export type FirstGameRuleValue =
  (typeof FIRST_GAME_RULE_OPTIONS)[number]["value"];
export type PeladaStatusValue =
  (typeof PELADA_STATUS_OPTIONS)[number]["value"];

const CLUB_TIME_ZONE = "America/Sao_Paulo";
const CLUB_UTC_OFFSET = "-03:00";
const CLUB_DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLUB_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const DEFAULT_PELADA_RULES: Record<
  PeladaTypeValue,
  {
    firstGameRule: FirstGameRuleValue;
    arrivalCutoffTime: string;
    maxFirstGamePlayers: string;
    roundDurationMinutes: string;
    linePlayersCount: string;
  }
> = {
  CAMPINHO: {
    firstGameRule: "SORTEIO",
    arrivalCutoffTime: "19:15",
    maxFirstGamePlayers: "",
    roundDurationMinutes: "20",
    linePlayersCount: "6",
  },
  CAMPAO: {
    firstGameRule: "ORDEM_DE_CHEGADA",
    arrivalCutoffTime: "",
    maxFirstGamePlayers: "16",
    roundDurationMinutes: "35",
    linePlayersCount: "8",
  },
};

export function getPeladaTypeLabel(type: string) {
  return PELADA_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getFirstGameRuleLabel(rule: string) {
  return (
    FIRST_GAME_RULE_OPTIONS.find((option) => option.value === rule)?.label ?? rule
  );
}

export function getPeladaStatusLabel(status: string) {
  return (
    PELADA_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
  );
}

export function getPositionLabel(position: string) {
  switch (position) {
    case "GOLEIRO":
      return "Goleiro";
    case "LATERAL":
      return "Lateral";
    case "ZAGUEIRO":
      return "Zagueiro";
    case "VOLANTE":
      return "Volante";
    case "MEIA":
      return "Meia";
    case "ATACANTE":
      return "Atacante";
    default:
      return position;
  }
}

export function getGoalkeeperSideLabel(side: string | null) {
  if (side === "GOLEIRO_A") {
    return "Goleiro A";
  }

  if (side === "GOLEIRO_B") {
    return "Goleiro B";
  }

  return "Nenhum";
}

export function getPlayerLevelLabel(level: string | null) {
  return level || "Sem nível";
}

export function isLinePlayerPosition(position: string) {
  return position !== "GOLEIRO";
}

export function getFirstGamePlayersLimit(pelada: {
  maxFirstGamePlayers: number | null;
  linePlayersCount: number;
}) {
  return pelada.maxFirstGamePlayers ?? pelada.linePlayersCount * 2;
}

export function getFormationSlotLabel(
  linePlayersCount: number,
  displayOrder: number,
) {
  if (linePlayersCount >= 8) {
    const campaoSlots = ["L", "Z", "Z", "L", "V", "M", "M", "A"];
    return campaoSlots[displayOrder - 1] || `${displayOrder}`;
  }

  const campinhoSlots = ["Z", "L", "L", "M", "M", "A"];
  return campinhoSlots[displayOrder - 1] || `${displayOrder}`;
}

export function getPeladaRoundDurationMinutes(args: {
  type: PeladaTypeValue;
  roundNumber: number;
}) {
  if (args.type === "CAMPAO") {
    return args.roundNumber <= 1 ? 35 : 30;
  }

  return 20;
}

export function getPeladaDurationRuleLabel(type: PeladaTypeValue) {
  return type === "CAMPAO" ? "35 / 30 min" : "20 min";
}

export function getClubDateInputValue(date: Date) {
  const parts = getClubDateTimeParts(date);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getClubTimeInputValue(date: Date) {
  const parts = getClubDateTimeParts(date);

  return `${parts.hour}:${parts.minute}`;
}

export function parseClubDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00${CLUB_UTC_OFFSET}`);
}

export function buildArrivalDateTimeInput(date: Date) {
  const parts = getClubDateTimeParts(date);

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseClubDateTimeLocalInput(value: string) {
  if (!value) {
    return new Date(Number.NaN);
  }

  return new Date(`${value}:00${CLUB_UTC_OFFSET}`);
}

function getClubDateTimeParts(date: Date) {
  const parts = CLUB_DATE_TIME_PARTS_FORMATTER.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    hour: parts.find((part) => part.type === "hour")?.value ?? "00",
    minute: parts.find((part) => part.type === "minute")?.value ?? "00",
  };
}
