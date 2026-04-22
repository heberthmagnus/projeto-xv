import {
  ADMIN_MATCHES_PATH,
  ADMIN_PELADAS_PATH,
  ADMIN_REGISTRATIONS_PATH,
  ADMIN_TEAMS_PATH,
} from "@/lib/routes";

export type FeedbackTone = "success" | "error" | "warning";

export type FeedbackRouteKey =
  | "admin-teams"
  | "admin-matches"
  | "admin-registrations"
  | "peladas-admin-list"
  | "peladas-confirmados"
  | "peladas-chegada"
  | "peladas-peladas-do-dia"
  | "peladas-resultados";

export type FeedbackEntry = {
  key: string;
  tone: FeedbackTone;
  message: string;
};

type SearchParamsInput =
  | URLSearchParams
  | {
      success?: string;
      error?: string;
      warning?: string;
    };

const SUCCESS_MESSAGES: Record<FeedbackRouteKey, Record<string, string>> = {
  "admin-teams": {
    "create-team": "Time criado com sucesso.",
    "create-placeholder-base":
      "Times-placeholder, fases e tabela base criados com sucesso.",
    "create-base-table": "Fases, classificação base e tabela geradas com sucesso.",
    "update-team": "Dados do time atualizados com sucesso.",
    "assign-player": "Jogador alocado ou atualizado com sucesso.",
    "unassign-player": "Jogador removido do time com sucesso.",
  },
  "admin-matches": {
    "apply-base-schedule":
      "Calendário base da Copa aplicado, com rodadas datadas e mata-mata placeholder criado.",
    "create-match": "Jogo criado com sucesso.",
    "update-match": "Jogo atualizado com sucesso.",
  },
  "admin-registrations": {
    level: "Nível atualizado com sucesso.",
    edit: "Inscrição atualizada com sucesso.",
    delete: "Inscrição excluída com sucesso.",
    payment: "Pagamento atualizado com sucesso.",
    "quick-save": "Inscrição atualizada com sucesso.",
  },
  "peladas-admin-list": {
    create: "Pelada criada com sucesso.",
    update: "Pelada atualizada com sucesso.",
    delete: "Pelada excluída com sucesso.",
  },
  "peladas-confirmados": {
    "status-update": "Status da pelada atualizado com sucesso.",
    "guest-add": "Convidado adicionado à lista com sucesso.",
    "confirmed-add": "Confirmado adicionado com sucesso.",
    "confirmed-update": "Confirmado atualizado com sucesso.",
    "confirmed-delete": "Confirmado removido com sucesso.",
  },
  "peladas-chegada": {
    "status-update": "Status da pelada atualizado com sucesso.",
    "arrival-add": "Chegada registrada com sucesso.",
    "arrival-update": "Chegada atualizada com sucesso.",
    "arrival-delete": "Chegada removida com sucesso.",
    "first-game-draw": "Primeira pelada sorteada com sucesso.",
    "first-game-order": "Primeira pelada definida pela ordem de chegada.",
  },
  "peladas-peladas-do-dia": {
    "status-update": "Status da pelada atualizado com sucesso.",
    "teams-generated": "Divisão dos times gerada com sucesso.",
    "teams-swapped": "Troca entre os times realizada com sucesso.",
    "teams-cleared": "Divisão dos times limpa com sucesso.",
    "round-opened": "Pelada 1 aberta com sucesso.",
    "round-opened-teams": "Pelada 1 aberta e dividida com sucesso.",
    "round-next": "Próxima pelada aberta com sucesso.",
    "round-next-teams": "Próxima pelada aberta e dividida com sucesso.",
    "round-started": "Cronômetro da pelada iniciado com sucesso.",
    "round-closed": "Pelada atual encerrada com sucesso.",
    "round-availability-on": "Jogador marcado para a repescagem da próxima.",
    "round-availability-clear": "Jogador removido da repescagem da próxima.",
    "round-out-for-day-on": "Jogador marcado para não jogar mais hoje.",
    "round-out-for-day-off": "Jogador voltou a ficar disponível no restante do dia.",
    "pelada-progress-reset": "Andamento da pelada resetado com sucesso.",
  },
  "peladas-resultados": {
    "status-update": "Status da pelada atualizado com sucesso.",
    "round-result-update": "Resultado da pelada atualizado com sucesso.",
    "round-goal-add": "Gol registrado com sucesso.",
    "round-goal-delete": "Gol removido com sucesso.",
  },
};

function readSearchParam(searchParams: SearchParamsInput, key: "success" | "error" | "warning") {
  if (searchParams instanceof URLSearchParams) {
    const value = searchParams.get(key);
    return value ? value.trim() : "";
  }

  return String(searchParams[key] || "").trim();
}

function getFeedbackRouteKeyFromPathname(pathname: string): FeedbackRouteKey | null {
  if (pathname === ADMIN_TEAMS_PATH) {
    return "admin-teams";
  }

  if (pathname === ADMIN_MATCHES_PATH) {
    return "admin-matches";
  }

  if (pathname === ADMIN_REGISTRATIONS_PATH) {
    return "admin-registrations";
  }

  if (pathname === ADMIN_PELADAS_PATH) {
    return "peladas-admin-list";
  }

  if (/^\/admin\/peladas\/[^/]+\/confirmados$/.test(pathname)) {
    return "peladas-confirmados";
  }

  if (/^\/admin\/peladas\/[^/]+\/chegada$/.test(pathname)) {
    return "peladas-chegada";
  }

  if (/^\/admin\/peladas\/[^/]+\/peladas-do-dia$/.test(pathname)) {
    return "peladas-peladas-do-dia";
  }

  if (/^\/admin\/peladas\/[^/]+\/resultados$/.test(pathname)) {
    return "peladas-resultados";
  }

  return null;
}

function resolveSuccessMessage(routeKey: FeedbackRouteKey | null, successCode: string) {
  if (!successCode) {
    return "";
  }

  if (routeKey) {
    const message = SUCCESS_MESSAGES[routeKey][successCode];

    if (message) {
      return message;
    }
  }

  return successCode.includes(" ") ? successCode : "Ação concluída com sucesso.";
}

export function resolvePostActionFeedback(
  pathname: string,
  searchParams: SearchParamsInput,
) {
  const routeKey = getFeedbackRouteKeyFromPathname(pathname);
  const success = readSearchParam(searchParams, "success");
  const warning = readSearchParam(searchParams, "warning");
  const error = readSearchParam(searchParams, "error");
  const entries: FeedbackEntry[] = [];

  if (success) {
    entries.push({
      key: `${pathname}:success:${success}`,
      tone: "success",
      message: resolveSuccessMessage(routeKey, success),
    });
  }

  if (warning) {
    entries.push({
      key: `${pathname}:warning:${warning}`,
      tone: "warning",
      message: warning,
    });
  }

  if (error) {
    entries.push({
      key: `${pathname}:error:${error}`,
      tone: "error",
      message: error,
    });
  }

  return entries;
}
