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

export type PeladaTypeValue = (typeof PELADA_TYPE_OPTIONS)[number]["value"];
export type FirstGameRuleValue =
  (typeof FIRST_GAME_RULE_OPTIONS)[number]["value"];
export type PeladaStatusValue =
  (typeof PELADA_STATUS_OPTIONS)[number]["value"];

export const DEFAULT_PELADA_RULES: Record<
  PeladaTypeValue,
  {
    firstGameRule: FirstGameRuleValue;
    arrivalCutoffTime: string;
    maxFirstGamePlayers: string;
    linePlayersCount: string;
  }
> = {
  CAMPINHO: {
    firstGameRule: "SORTEIO",
    arrivalCutoffTime: "19:15",
    maxFirstGamePlayers: "",
    linePlayersCount: "6",
  },
  CAMPAO: {
    firstGameRule: "ORDEM_DE_CHEGADA",
    arrivalCutoffTime: "",
    maxFirstGamePlayers: "16",
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
