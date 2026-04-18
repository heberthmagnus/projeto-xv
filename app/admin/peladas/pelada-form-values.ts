import { DEFAULT_PELADA_RULES, type FirstGameRuleValue, type PeladaStatusValue, type PeladaTypeValue } from "@/lib/peladas";

export type PeladaFormValues = {
  id?: string;
  date: string;
  time: string;
  type: PeladaTypeValue;
  firstGameRule: FirstGameRuleValue;
  arrivalCutoffTime: string;
  maxFirstGamePlayers: string;
  linePlayersCount: string;
  status: PeladaStatusValue;
  notes: string;
};

export const DEFAULT_PELADA_FORM_VALUES: PeladaFormValues = {
  date: "",
  time: "",
  type: "CAMPINHO",
  firstGameRule: DEFAULT_PELADA_RULES.CAMPINHO.firstGameRule,
  arrivalCutoffTime: DEFAULT_PELADA_RULES.CAMPINHO.arrivalCutoffTime,
  maxFirstGamePlayers: DEFAULT_PELADA_RULES.CAMPINHO.maxFirstGamePlayers,
  linePlayersCount: DEFAULT_PELADA_RULES.CAMPINHO.linePlayersCount,
  status: "ABERTA",
  notes: "",
};

export function buildPeladaFormValues(pelada: {
  id: string;
  scheduledAt: Date;
  type: PeladaTypeValue;
  firstGameRule: FirstGameRuleValue;
  arrivalCutoffTime: string | null;
  maxFirstGamePlayers: number | null;
  linePlayersCount: number;
  status: PeladaStatusValue;
  notes: string | null;
}): PeladaFormValues {
  return {
    id: pelada.id,
    date: formatDateInput(pelada.scheduledAt),
    time: formatTimeInput(pelada.scheduledAt),
    type: pelada.type,
    firstGameRule: pelada.firstGameRule,
    arrivalCutoffTime: pelada.arrivalCutoffTime || "",
    maxFirstGamePlayers:
      pelada.maxFirstGamePlayers === null ? "" : String(pelada.maxFirstGamePlayers),
    linePlayersCount: String(pelada.linePlayersCount),
    status: pelada.status,
    notes: pelada.notes || "",
  };
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function parsePeladaFormData(formData: FormData) {
  const date = String(formData.get("date") || "").trim();
  const time = String(formData.get("time") || "").trim();
  const type = String(formData.get("type") || "").trim() as PeladaTypeValue;
  const firstGameRule = String(
    formData.get("firstGameRule") || "",
  ).trim() as FirstGameRuleValue;
  const arrivalCutoffTime = String(formData.get("arrivalCutoffTime") || "").trim();
  const maxFirstGamePlayers = String(
    formData.get("maxFirstGamePlayers") || "",
  ).trim();
  const linePlayersCount = String(formData.get("linePlayersCount") || "").trim();
  const status = String(formData.get("status") || "").trim() as PeladaStatusValue;
  const notes = String(formData.get("notes") || "").trim();

  if (!date) {
    throw new Error("Informe a data da pelada.");
  }

  if (!time) {
    throw new Error("Informe o horário da pelada.");
  }

  if (type !== "CAMPINHO" && type !== "CAMPAO") {
    throw new Error("Tipo de pelada inválido.");
  }

  if (firstGameRule !== "SORTEIO" && firstGameRule !== "ORDEM_DE_CHEGADA") {
    throw new Error("Regra da primeira inválida.");
  }

  if (
    status !== "ABERTA" &&
    status !== "EM_ANDAMENTO" &&
    status !== "FINALIZADA" &&
    status !== "CANCELADA"
  ) {
    throw new Error("Status da pelada inválido.");
  }

  const scheduledAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Data ou horário inválidos.");
  }

  const parsedLinePlayersCount = Number.parseInt(linePlayersCount, 10);

  if (!Number.isInteger(parsedLinePlayersCount) || parsedLinePlayersCount <= 0) {
    throw new Error("A formação precisa ser um número válido de jogadores de linha.");
  }

  const parsedMaxFirstGamePlayers = maxFirstGamePlayers
    ? Number.parseInt(maxFirstGamePlayers, 10)
    : null;

  if (
    parsedMaxFirstGamePlayers !== null &&
    (!Number.isInteger(parsedMaxFirstGamePlayers) || parsedMaxFirstGamePlayers <= 0)
  ) {
    throw new Error("O limite da primeira precisa ser um número válido.");
  }

  return {
    scheduledAt,
    type,
    firstGameRule,
    arrivalCutoffTime: arrivalCutoffTime || null,
    maxFirstGamePlayers: parsedMaxFirstGamePlayers,
    linePlayersCount: parsedLinePlayersCount,
    status,
    notes: notes || null,
  };
}
