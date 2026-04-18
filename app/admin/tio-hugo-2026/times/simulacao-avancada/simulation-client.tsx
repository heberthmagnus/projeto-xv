"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ADVANCED_DRAFT_LEVEL_ORDER,
  addAdvancedBondBetweenPlayers,
  applyAdvancedDragMove,
  applyAdvancedSimpleSwap,
  applyAdvancedTripleSwap,
  areAdvancedTeamsComplete,
  distributeAdvancedPlayersForLevel,
  drawAdvancedNextPlayer,
  formatAdvancedPosition,
  formatAdvancedSwapOption,
  generateAdvancedInitialDraft,
  getAdvancedAvailablePlayers,
  getAdvancedDisplayTeams,
  getAdvancedNextPendingLevel,
  getAdvancedSummary,
  validateAdvancedDragMove,
  validateAdvancedSimpleSwap,
  validateAdvancedTripleSwap,
  type AdvancedSimulationLevel,
  type AdvancedSimulationMoveResult,
  type AdvancedSimulationPlayer,
  type AdvancedSimulationState,
  type AdvancedSimulationSwapResult,
} from "@/lib/advanced-team-simulation";

type PendingSwap =
  | {
      mode: "simples";
      ids: [string, string];
      result: AdvancedSimulationSwapResult;
    }
  | {
      mode: "tripla";
      ids: [string, string, string];
      result: AdvancedSimulationSwapResult;
    };

type PendingDragMove = {
  playerId: string;
  destinationTeamId: number | null;
  destinationLabel: string;
  result: AdvancedSimulationMoveResult;
};

export function AdvancedSimulationClient({
  initialState,
}: {
  initialState: AdvancedSimulationState;
}) {
  const [state, setState] = useState(initialState);
  const [selectedPlayerA, setSelectedPlayerA] = useState("");
  const [selectedPlayerB, setSelectedPlayerB] = useState("");
  const [simpleSwapFirst, setSimpleSwapFirst] = useState("");
  const [simpleSwapSecond, setSimpleSwapSecond] = useState("");
  const [tripleSwapFirst, setTripleSwapFirst] = useState("");
  const [tripleSwapSecond, setTripleSwapSecond] = useState("");
  const [tripleSwapThird, setTripleSwapThird] = useState("");
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
  const [pendingDragMove, setPendingDragMove] = useState<PendingDragMove | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teams = getAdvancedDisplayTeams(state);
  const summary = getAdvancedSummary(state);
  const availablePlayers = getAdvancedAvailablePlayers(state);
  const nextPendingLevel = getAdvancedNextPendingLevel(state);
  const teamsComplete = areAdvancedTeamsComplete(state);
  const nextTeam = state.teams[state.nextTeamCursor];
  const assignedPlayers = state.players
    .filter((player) => player.assignedTeamId !== null)
    .sort(
      (left, right) =>
        (left.assignedTeamId || 0) - (right.assignedTeamId || 0) ||
        left.fullName.localeCompare(right.fullName, "pt-BR"),
    );
  const bondCandidates = state.players
    .filter((player) => player.assignedTeamId === null)
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));

  function clearPendingDialogs() {
    setPendingSwap(null);
    setPendingDragMove(null);
  }

  function handleCreateBond() {
    startTransition(() => {
      setState((current) =>
        addAdvancedBondBetweenPlayers(current, selectedPlayerA, selectedPlayerB),
      );
      setSelectedPlayerA("");
      setSelectedPlayerB("");
      clearPendingDialogs();
    });
  }

  function handleGenerateInitialDraft() {
    startTransition(() => {
      setState((current) => generateAdvancedInitialDraft(current));
      clearPendingDialogs();
    });
  }

  function handleDistributeLevel(level: AdvancedSimulationLevel) {
    startTransition(() => {
      setState((current) => distributeAdvancedPlayersForLevel(current, level));
      clearPendingDialogs();
    });
  }

  function handleDrawNextPlayer() {
    startTransition(() => {
      setState((current) => drawAdvancedNextPlayer(current));
      clearPendingDialogs();
    });
  }

  function handleValidateSimpleSwap() {
    setPendingSwap({
      mode: "simples",
      ids: [simpleSwapFirst, simpleSwapSecond],
      result: validateAdvancedSimpleSwap(state, simpleSwapFirst, simpleSwapSecond),
    });
  }

  function handleConfirmSimpleSwap(force: boolean) {
    if (!pendingSwap || pendingSwap.mode !== "simples") {
      return;
    }

    startTransition(() => {
      setState((current) =>
        applyAdvancedSimpleSwap(
          current,
          pendingSwap.ids[0],
          pendingSwap.ids[1],
          force,
        ),
      );
      setSimpleSwapFirst("");
      setSimpleSwapSecond("");
      clearPendingDialogs();
    });
  }

  function handleValidateTripleSwap() {
    setPendingSwap({
      mode: "tripla",
      ids: [tripleSwapFirst, tripleSwapSecond, tripleSwapThird],
      result: validateAdvancedTripleSwap(
        state,
        tripleSwapFirst,
        tripleSwapSecond,
        tripleSwapThird,
      ),
    });
  }

  function handleConfirmTripleSwap(force: boolean) {
    if (!pendingSwap || pendingSwap.mode !== "tripla") {
      return;
    }

    startTransition(() => {
      setState((current) =>
        applyAdvancedTripleSwap(
          current,
          pendingSwap.ids[0],
          pendingSwap.ids[1],
          pendingSwap.ids[2],
          force,
        ),
      );
      setTripleSwapFirst("");
      setTripleSwapSecond("");
      setTripleSwapThird("");
      clearPendingDialogs();
    });
  }

  function handleCardDragStart(playerId: string) {
    setDraggedPlayerId(playerId);
  }

  function handleCardDragEnd() {
    setDraggedPlayerId(null);
    setActiveDropZone(null);
  }

  function handleDropMove(destinationTeamId: number | null, destinationLabel: string) {
    if (!draggedPlayerId) {
      return;
    }

    const draggedId = draggedPlayerId;
    const result = validateAdvancedDragMove(state, draggedId, destinationTeamId);
    setDraggedPlayerId(null);
    setActiveDropZone(null);

    if (result.valid) {
      startTransition(() => {
        setState((current) =>
          applyAdvancedDragMove(current, draggedId, destinationTeamId, false),
        );
        clearPendingDialogs();
      });
      return;
    }

    setPendingDragMove({
      playerId: draggedId,
      destinationTeamId,
      destinationLabel,
      result,
    });
  }

  function handleConfirmDragMove(force: boolean) {
    if (!pendingDragMove) {
      return;
    }

    startTransition(() => {
      setState((current) =>
        applyAdvancedDragMove(
          current,
          pendingDragMove.playerId,
          pendingDragMove.destinationTeamId,
          force,
        ),
      );
      clearPendingDialogs();
    });
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={headerCardStyle}>
          <div style={headerTopStyle}>
            <div>
              <p style={eyebrowStyle}>Ambiente de decisão</p>
              <h1 style={titleStyle}>Simulação Avançada</h1>
              <p style={subtitleStyle}>
                Esta rota usa apenas jogadores fictícios em memória para testar
                vínculos, draft por camadas, trocas manuais e confirmações com
                override consciente.
              </p>
            </div>

            <div style={headerLinksStyle}>
              <Link href="/admin/tio-hugo-2026/times/simulacao" style={secondaryLinkStyle}>
                Ver simulação atual
              </Link>
              <Link href="/admin/tio-hugo-2026/inscricoes" style={backLinkStyle}>
                Voltar para inscrições
              </Link>
            </div>
          </div>

          {summary.hasForcedOverride && (
            <div style={overrideBannerStyle}>⚠️ Esta divisão contém inconsistências.</div>
          )}

          {state.lastAction && <div style={lastActionStyle}>{state.lastAction}</div>}
        </section>

        <section style={summaryGridStyle}>
          <SummaryCard label="Total de jogadores" value={String(summary.totalPlayers)} />
          <SummaryCard label="Jogadores usados" value={String(summary.usedPlayers)} />
          <SummaryCard label="Jogadores disponíveis" value={String(summary.unusedPlayers)} />
          <SummaryCard label="Diferença de pontuação" value={String(summary.scoreSpread)} />
        </section>

        <div style={topGridStyle}>
          <section style={panelCardStyle}>
            <h2 style={sectionTitleStyle}>Vínculos entre jogadores</h2>
            <p style={panelTextStyle}>
              Crie vínculos antes da divisão. Apenas os jogadores escolhidos
              entram no mesmo grupo.
            </p>

            <div style={fieldGridStyle}>
              <div style={fieldStyle}>
                <label style={fieldLabelStyle}>Jogador A</label>
                <select
                  value={selectedPlayerA}
                  onChange={(event) => setSelectedPlayerA(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {bondCandidates.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={fieldLabelStyle}>Jogador B</label>
                <select
                  value={selectedPlayerB}
                  onChange={(event) => setSelectedPlayerB(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {bondCandidates.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateBond}
              disabled={
                isPending ||
                !selectedPlayerA ||
                !selectedPlayerB ||
                selectedPlayerA === selectedPlayerB
              }
              style={secondaryButtonStyle}
            >
              Criar vínculo
            </button>
          </section>

          <section style={panelCardStyle}>
            <h2 style={sectionTitleStyle}>Jogadores disponíveis</h2>
            <p style={panelTextStyle}>
              Lista dos atletas ainda não distribuídos. A divisão avança por
              camadas de nível: A, B, C, D e E. Você também pode arrastar cards
              entre esta área e os times.
            </p>

            <div
              style={{
                ...availableListStyle,
                ...(activeDropZone === "available" ? activeDropZoneStyle : {}),
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("available");
              }}
              onDragLeave={() => {
                if (activeDropZone === "available") {
                  setActiveDropZone(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDropMove(null, "Jogadores disponíveis");
              }}
            >
              {availablePlayers.map((player) => (
                <PlayerBoardCard
                  key={player.id}
                  player={player}
                  onDragStart={handleCardDragStart}
                  onDragEnd={handleCardDragEnd}
                />
              ))}

              {availablePlayers.length === 0 && (
                <p style={emptyTextStyle}>Todos os jogadores já foram distribuídos.</p>
              )}
            </div>
          </section>
        </div>

        <section style={panelCardStyle}>
          <h2 style={sectionTitleStyle}>Controles do draft</h2>
          <p style={panelTextStyle}>
            O esboço avançado monta o esqueleto do torneio por nível, sem usar
            dados reais. O nível A sempre começa com 1 jogador por time.
          </p>

          <div style={actionsRowStyle}>
            <button
              type="button"
              onClick={handleGenerateInitialDraft}
              disabled={isPending}
              style={primaryButtonStyle}
            >
              Gerar esboço inicial
            </button>

            <button
              type="button"
              onClick={handleDrawNextPlayer}
              disabled={isPending}
              style={secondaryButtonStyle}
            >
              Sortear próximo jogador
            </button>
          </div>

          <div style={levelActionsWrapStyle}>
            {ADVANCED_DRAFT_LEVEL_ORDER.map((level) => {
              const isCurrent = state.currentDraftLevel === level;
              const isBlocked =
                nextPendingLevel !== null &&
                ADVANCED_DRAFT_LEVEL_ORDER.indexOf(level) >
                  ADVANCED_DRAFT_LEVEL_ORDER.indexOf(nextPendingLevel);

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleDistributeLevel(level)}
                  disabled={isPending || isBlocked}
                  style={isCurrent ? activeLevelButtonStyle : levelButtonStyle}
                >
                  {`Distribuir jogadores ${level}`}
                </button>
              );
            })}
          </div>

          <p style={rotationTextStyle}>
            Nível atual do draft: <strong>{state.currentDraftLevel}</strong> • Próximo time no
            rodízio: <strong>{nextTeam?.name || "Time 1"}</strong>
          </p>
        </section>

        <section style={panelCardStyle}>
          <h2 style={sectionTitleStyle}>Times em construção</h2>
          <p style={panelTextStyle}>
            Arraste jogadores entre os times ou devolva cards para a área de
            disponíveis. Vínculos são movidos juntos e a validação roda antes de
            confirmar inconsistências.
          </p>
          <div style={teamsGridStyle}>
            {teams.map((team) => (
              <article
                key={team.id}
                style={{
                  ...teamCardStyle,
                  ...(activeDropZone === `team-${team.id}` ? activeDropZoneStyle : {}),
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setActiveDropZone(`team-${team.id}`);
                }}
                onDragLeave={() => {
                  if (activeDropZone === `team-${team.id}`) {
                    setActiveDropZone(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropMove(team.id, team.name);
                }}
              >
                <div style={teamHeaderStyle}>
                  <div>
                    <h3 style={teamTitleStyle}>{team.name}</h3>
                    <p style={teamMetaStyle}>
                      {team.players.length} jogadores • Pontuação {team.totalScore}
                    </p>
                  </div>
                </div>

                {team.issues.length > 0 && (
                  <div style={teamIssueStyle}>
                    {team.issues.map((issue) => (
                      <p key={issue} style={{ margin: 0 }}>
                        {issue}
                      </p>
                    ))}
                  </div>
                )}

                <div style={playersListStyle}>
                  {team.players.map((player) => (
                    <PlayerBoardCard
                      key={player.id}
                      player={player}
                      onDragStart={handleCardDragStart}
                      onDragEnd={handleCardDragEnd}
                    />
                  ))}

                  {team.players.length === 0 && (
                    <p style={emptyTextStyle}>Nenhum jogador alocado ainda.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={panelCardStyle}>
          <h2 style={sectionTitleStyle}>Trocas manuais</h2>
          <p style={panelTextStyle}>
            Quando os times estão completos, a simulação avançada trabalha com
            trocas 1x1 e trocas triplas. Se houver inconsistências, você pode
            cancelar ou confirmar mesmo assim.
          </p>

          {!teamsComplete && (
            <div style={infoBoxStyle}>
              As trocas manuais ficam disponíveis quando todos os times estiverem
              completos.
            </div>
          )}

          {teamsComplete && (
            <div style={swapGridContainerStyle}>
              <div style={swapCardStyle}>
                <h3 style={swapTitleStyle}>Troca simples</h3>
                <div style={fieldGridStyle}>
                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador do primeiro time</label>
                    <select
                      value={simpleSwapFirst}
                      onChange={(event) => {
                        setSimpleSwapFirst(event.target.value);
                        clearPendingDialogs();
                      }}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {formatAdvancedSwapOption(player)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador do segundo time</label>
                    <select
                      value={simpleSwapSecond}
                      onChange={(event) => {
                        setSimpleSwapSecond(event.target.value);
                        clearPendingDialogs();
                      }}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {formatAdvancedSwapOption(player)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={swapActionsStyle}>
                  <button
                    type="button"
                    onClick={handleValidateSimpleSwap}
                    disabled={isPending || !simpleSwapFirst || !simpleSwapSecond}
                    style={levelButtonStyle}
                  >
                    Validar troca
                  </button>
                </div>
              </div>

              <div style={swapCardStyle}>
                <h3 style={swapTitleStyle}>Troca tripla</h3>
                <div style={tripleGridStyle}>
                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador do primeiro time</label>
                    <select
                      value={tripleSwapFirst}
                      onChange={(event) => {
                        setTripleSwapFirst(event.target.value);
                        clearPendingDialogs();
                      }}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {formatAdvancedSwapOption(player)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador do segundo time</label>
                    <select
                      value={tripleSwapSecond}
                      onChange={(event) => {
                        setTripleSwapSecond(event.target.value);
                        clearPendingDialogs();
                      }}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {formatAdvancedSwapOption(player)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador do terceiro time</label>
                    <select
                      value={tripleSwapThird}
                      onChange={(event) => {
                        setTripleSwapThird(event.target.value);
                        clearPendingDialogs();
                      }}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {formatAdvancedSwapOption(player)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={swapActionsStyle}>
                  <button
                    type="button"
                    onClick={handleValidateTripleSwap}
                    disabled={
                      isPending || !tripleSwapFirst || !tripleSwapSecond || !tripleSwapThird
                    }
                    style={levelButtonStyle}
                  >
                    Validar troca
                  </button>
                </div>
              </div>
            </div>
          )}

          {pendingSwap && (
            <div style={validationBoxStyle}>
              <h3 style={validationTitleStyle}>Resultado da validação</h3>
              <p style={validationMessageStyle}>{pendingSwap.result.message}</p>

              {pendingSwap.result.issues.length > 0 && (
                <ul style={validationListStyle}>
                  {pendingSwap.result.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}

              <div style={swapActionsStyle}>
                <button type="button" onClick={clearPendingDialogs} style={levelButtonStyle}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pendingSwap.mode === "simples"
                      ? handleConfirmSimpleSwap(false)
                      : handleConfirmTripleSwap(false)
                  }
                  disabled={isPending || !pendingSwap.result.valid}
                  style={secondaryButtonStyle}
                >
                  Confirmar troca
                </button>
                {!pendingSwap.result.valid && (
                  <button
                    type="button"
                    onClick={() =>
                      pendingSwap.mode === "simples"
                        ? handleConfirmSimpleSwap(true)
                        : handleConfirmTripleSwap(true)
                    }
                    disabled={isPending}
                    style={dangerButtonStyle}
                  >
                    Confirmar mesmo assim
                  </button>
                )}
              </div>
            </div>
          )}

          {pendingDragMove && (
            <div style={validationBoxStyle}>
              <h3 style={validationTitleStyle}>Resultado da movimentação manual</h3>
              <p style={validationMessageStyle}>
                {pendingDragMove.result.message} Destino selecionado:{" "}
                <strong>{pendingDragMove.destinationLabel}</strong>.
              </p>

              {pendingDragMove.result.issues.length > 0 && (
                <ul style={validationListStyle}>
                  {pendingDragMove.result.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}

              <div style={swapActionsStyle}>
                <button type="button" onClick={clearPendingDialogs} style={levelButtonStyle}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDragMove(true)}
                  disabled={isPending}
                  style={dangerButtonStyle}
                >
                  Confirmar mesmo assim
                </button>
              </div>
            </div>
          )}
        </section>

        <section style={panelCardStyle}>
          <h2 style={sectionTitleStyle}>Resumo de validação e inconsistências</h2>

          {summary.issues.length > 0 ? (
            <ul style={warningListStyle}>
              {summary.issues.map((issue) => (
                <li key={issue.id}>{issue.message}</li>
              ))}
            </ul>
          ) : (
            <p style={emptyTextStyle}>
              Nenhuma inconsistência relevante foi detectada nesta simulação.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function PlayerBoardCard({
  player,
  onDragStart,
  onDragEnd,
}: {
  player: AdvancedSimulationPlayer;
  onDragStart: (playerId: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", player.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(player.id);
      }}
      onDragEnd={onDragEnd}
      style={playerBoardCardStyle}
    >
      <div style={playerTopStyle}>
        <strong style={playerNameStyle}>{player.fullName}</strong>
        <span style={levelBadgeStyle}>{player.level}</span>
      </div>

      <p style={playerMetaStyle}>
        {formatAdvancedPosition(player.preferredPosition)} • {player.age} anos
      </p>

      <div style={tagWrapStyle}>
        {player.bondGroup && <span style={bondTagStyle}>{player.bondGroup}</span>}
        {player.usedFallback && <span style={fallbackTagStyle}>Fallback de posição</span>}
        {player.assignedRole === "RESERVA" && <span style={reserveTagStyle}>Reserva</span>}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryLabelStyle}>{label}</p>
      <strong style={summaryValueStyle}>{value}</strong>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F0F0F0",
  padding: "24px 12px 40px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
};

const headerCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const headerTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginBottom: 18,
};

const headerLinksStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 13,
  fontWeight: 700,
  color: "#B89020",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 32,
  lineHeight: 1.1,
  color: "#101010",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 760,
  color: "#4B5563",
  lineHeight: 1.6,
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#101010",
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const overrideBannerStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#FFF8E8",
  border: "1px solid #E7C56A",
  color: "#7C5A10",
  fontWeight: 700,
  marginBottom: 12,
};

const lastActionStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  color: "#374151",
  fontWeight: 600,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const summaryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const summaryLabelStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#6B7280",
  fontSize: 13,
  fontWeight: 600,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 28,
  color: "#101010",
};

const topGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
  gap: 18,
  marginBottom: 18,
  alignItems: "start",
};

const panelCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 20,
  color: "#101010",
};

const panelTextStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#4B5563",
  lineHeight: 1.6,
};

const fieldGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const tripleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#101010",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const levelActionsWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
};

const buttonBaseStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#B89020",
  color: "#FFFFFF",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#101010",
  color: "#FFFFFF",
};

const levelButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#FFFFFF",
  color: "#101010",
  border: "1px solid #D1D5DB",
};

const activeLevelButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#FFF8E8",
  color: "#7C5A10",
  border: "1px solid #E7C56A",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "#B91C1C",
  color: "#FFFFFF",
};

const rotationTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
};

const availableListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxHeight: 420,
  overflowY: "auto",
  paddingRight: 4,
};

const teamsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
};

const teamCardStyle: React.CSSProperties = {
  background: "#FAFAFA",
  borderRadius: 14,
  padding: 16,
  border: "1px solid #E5E7EB",
};

const teamHeaderStyle: React.CSSProperties = {
  marginBottom: 12,
};

const teamTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 22,
  color: "#101010",
};

const teamMetaStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.5,
};

const teamIssueStyle: React.CSSProperties = {
  marginBottom: 12,
  padding: "12px 14px",
  borderRadius: 12,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontSize: 13,
  lineHeight: 1.6,
};

const playersListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const playerBoardCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#FFFFFF",
  cursor: "grab",
};

const activeDropZoneStyle: React.CSSProperties = {
  outline: "2px dashed #B89020",
  outlineOffset: 2,
  background: "#FFF8E8",
};

const playerTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  marginBottom: 6,
};

const playerNameStyle: React.CSSProperties = {
  color: "#101010",
};

const playerMetaStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#4B5563",
  fontSize: 14,
};

const tagWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const tagBaseStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const levelBadgeStyle: React.CSSProperties = {
  ...tagBaseStyle,
  background: "#101010",
  color: "#FFFFFF",
  minWidth: 28,
  textAlign: "center",
};

const bondTagStyle: React.CSSProperties = {
  ...tagBaseStyle,
  background: "#FFF8E8",
  color: "#7C5A10",
  border: "1px solid #E7C56A",
};

const fallbackTagStyle: React.CSSProperties = {
  ...tagBaseStyle,
  background: "#EEF2FF",
  color: "#4338CA",
  border: "1px solid #C7D2FE",
};

const reserveTagStyle: React.CSSProperties = {
  ...tagBaseStyle,
  background: "#F3F4F6",
  color: "#374151",
  border: "1px solid #D1D5DB",
};

const swapGridContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginBottom: 16,
};

const swapCardStyle: React.CSSProperties = {
  background: "#FAFAFA",
  borderRadius: 14,
  padding: 16,
  border: "1px solid #E5E7EB",
};

const swapTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
  color: "#101010",
};

const swapActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const validationBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  background: "#FFF8E8",
  border: "1px solid #E7C56A",
};

const validationTitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 18,
  color: "#7C5A10",
};

const validationMessageStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#7C5A10",
  lineHeight: 1.6,
};

const validationListStyle: React.CSSProperties = {
  margin: "0 0 14px",
  paddingLeft: 18,
  color: "#7C2D12",
  lineHeight: 1.6,
};

const warningListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#7C2D12",
  lineHeight: 1.7,
};

const infoBoxStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  color: "#374151",
  fontWeight: 600,
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  lineHeight: 1.6,
};
