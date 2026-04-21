type PeladaFeedbackScope =
  | "admin-list"
  | "confirmados"
  | "chegada"
  | "peladas-do-dia"
  | "resultados";

const SUCCESS_MESSAGES: Record<PeladaFeedbackScope, Record<string, string>> = {
  "admin-list": {
    create: "Pelada criada com sucesso.",
    update: "Pelada atualizada com sucesso.",
    delete: "Pelada excluída com sucesso.",
  },
  confirmados: {
    "status-update": "Status da pelada atualizado com sucesso.",
    "guest-add": "Convidado adicionado à lista com sucesso.",
    "confirmed-add": "Confirmado adicionado com sucesso.",
    "confirmed-update": "Confirmado atualizado com sucesso.",
    "confirmed-delete": "Confirmado removido com sucesso.",
  },
  chegada: {
    "status-update": "Status da pelada atualizado com sucesso.",
    "arrival-add": "Chegada registrada com sucesso.",
    "arrival-update": "Chegada atualizada com sucesso.",
    "arrival-delete": "Chegada removida com sucesso.",
    "first-game-draw": "Primeira pelada sorteada com sucesso.",
    "first-game-order": "Primeira pelada definida pela ordem de chegada.",
  },
  "peladas-do-dia": {
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
  resultados: {
    "status-update": "Status da pelada atualizado com sucesso.",
    "round-result-update": "Resultado da pelada atualizado com sucesso.",
    "round-goal-add": "Gol registrado com sucesso.",
    "round-goal-delete": "Gol removido com sucesso.",
  },
};

function getSuccessMessage(scope: PeladaFeedbackScope, code?: string) {
  if (!code) {
    return null;
  }

  return (
    SUCCESS_MESSAGES[scope][code] ||
    "Ação concluída com sucesso."
  );
}

export function PeladaFeedbackBanner({
  scope,
  success,
  error,
}: {
  scope: PeladaFeedbackScope;
  success?: string;
  error?: string;
}) {
  const successMessage = getSuccessMessage(scope, success);

  if (!successMessage && !error) {
    return null;
  }

  return (
    <div className="xv-feedback-stack">
      {successMessage ? (
        <div
          className="xv-feedback-banner xv-feedback-banner-success"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div
          className="xv-feedback-banner xv-feedback-banner-error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
