"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DRAFT_LEVEL_ORDER,
  addBondBetweenPlayers,
  applySimpleSwap,
  applyTripleSwap,
  areTeamsComplete,
  distributePlayersForLevel,
  drawNextPlayer,
  formatPosition,
  generateInitialDraft,
  getAvailablePlayers,
  getDisplayTeams,
  getNextPendingLevel,
  getSimulationSummary,
  movePlayerToTeam,
  validateSimpleSwap,
  validateTripleSwap,
  type SimulationLevel,
  type SimulationPlayer,
  type SimulationState,
} from "@/lib/team-simulation";

export function SimulationClient({
  initialState,
}: {
  initialState: SimulationState;
}) {
  const [state, setState] = useState(initialState);
  const [selectedPlayerA, setSelectedPlayerA] = useState("");
  const [selectedPlayerB, setSelectedPlayerB] = useState("");
  const [selectedMovePlayer, setSelectedMovePlayer] = useState("");
  const [selectedDestinationTeam, setSelectedDestinationTeam] = useState("");
  const [selectedSimpleSwapFirst, setSelectedSimpleSwapFirst] = useState("");
  const [selectedSimpleSwapSecond, setSelectedSimpleSwapSecond] = useState("");
  const [selectedTripleSwapFirst, setSelectedTripleSwapFirst] = useState("");
  const [selectedTripleSwapSecond, setSelectedTripleSwapSecond] = useState("");
  const [selectedTripleSwapThird, setSelectedTripleSwapThird] = useState("");
  const [swapFeedback, setSwapFeedback] = useState<{
    type: "simples" | "tripla";
    signature: string;
    message: string;
    valid: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = getSimulationSummary(state);
  const teams = getDisplayTeams(state);
  const availablePlayers = getAvailablePlayers(state);
  const nextPendingLevel = getNextPendingLevel(state);
  const teamsComplete = areTeamsComplete(state);
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
  const nextTeam = state.teams[state.nextTeamCursor];
  const simpleSwapSignature = `${selectedSimpleSwapFirst}:${selectedSimpleSwapSecond}`;
  const tripleSwapSignature = `${selectedTripleSwapFirst}:${selectedTripleSwapSecond}:${selectedTripleSwapThird}`;

  function handleCreateBond() {
    startTransition(() => {
      setState((current) =>
        addBondBetweenPlayers(current, selectedPlayerA, selectedPlayerB),
      );
      setSelectedPlayerA("");
      setSelectedPlayerB("");
    });
  }

  function handleGenerateDraft() {
    startTransition(() => {
      setState((current) => generateInitialDraft(current));
    });
  }

  function handleDrawNext() {
    startTransition(() => {
      setState((current) => drawNextPlayer(current));
    });
  }

  function handleDistributeLevel(level: SimulationLevel) {
    startTransition(() => {
      setState((current) => distributePlayersForLevel(current, level));
    });
  }

  function handleMovePlayer() {
    startTransition(() => {
      setState((current) =>
        movePlayerToTeam(current, selectedMovePlayer, Number(selectedDestinationTeam)),
      );
      setSelectedMovePlayer("");
      setSelectedDestinationTeam("");
    });
  }

  function handleValidateSimpleSwap() {
    const result = validateSimpleSwap(
      state,
      selectedSimpleSwapFirst,
      selectedSimpleSwapSecond,
    );

    setSwapFeedback({
      type: "simples",
      signature: simpleSwapSignature,
      message: result.message,
      valid: result.valid,
    });
  }

  function handleConfirmSimpleSwap() {
    startTransition(() => {
      setState((current) =>
        applySimpleSwap(current, selectedSimpleSwapFirst, selectedSimpleSwapSecond),
      );
      setSwapFeedback(null);
      setSelectedSimpleSwapFirst("");
      setSelectedSimpleSwapSecond("");
    });
  }

  function handleValidateTripleSwap() {
    const result = validateTripleSwap(
      state,
      selectedTripleSwapFirst,
      selectedTripleSwapSecond,
      selectedTripleSwapThird,
    );

    setSwapFeedback({
      type: "tripla",
      signature: tripleSwapSignature,
      message: result.message,
      valid: result.valid,
    });
  }

  function handleConfirmTripleSwap() {
    startTransition(() => {
      setState((current) =>
        applyTripleSwap(
          current,
          selectedTripleSwapFirst,
          selectedTripleSwapSecond,
          selectedTripleSwapThird,
        ),
      );
      setSwapFeedback(null);
      setSelectedTripleSwapFirst("");
      setSelectedTripleSwapSecond("");
      setSelectedTripleSwapThird("");
    });
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={headerCardStyle}>
          <div style={headerTopStyle}>
            <div>
              <p style={eyebrowStyle}>Ambiente de validação</p>
              <h1 style={titleStyle}>Simulação dinâmica de divisão de times</h1>
              <p style={subtitleStyle}>
                Os jogadores desta tela são totalmente fictícios e existem apenas
                para validar vínculos, sorteio progressivo e equilíbrio entre
                equipes.
              </p>
            </div>

            <Link href="/admin/tio-hugo-2026/inscricoes" style={backLinkStyle}>
              Voltar para inscrições
            </Link>
          </div>

          {state.lastAction && (
            <div style={lastActionStyle}>{state.lastAction}</div>
          )}
        </section>

        <section style={summaryGridStyle}>
          <SummaryCard label="Total de jogadores" value={String(summary.totalPlayers)} />
          <SummaryCard label="Jogadores usados" value={String(summary.usedPlayers)} />
          <SummaryCard label="Jogadores disponíveis" value={String(summary.unusedPlayers)} />
          <SummaryCard label="Diferença de pontuação" value={String(summary.scoreSpread)} />
        </section>

        {summary.warnings.length > 0 && (
          <section style={warningCardStyle}>
            <h2 style={sectionTitleStyle}>Alertas e validações</h2>
            <ul style={warningListStyle}>
              {summary.warnings.map((warning) => (
                <li key={warning.id}>{warning.message}</li>
              ))}
            </ul>
          </section>
        )}

        <div style={mainGridStyle}>
          <section style={sideSectionStyle}>
            <div style={panelCardStyle}>
              <h2 style={sectionTitleStyle}>Vínculos entre jogadores</h2>
              <p style={panelTextStyle}>
                Jogadores vinculados são tratados como uma unidade e devem ficar
                no mesmo time.
              </p>

              <div style={bondFormStyle}>
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
              </div>
            </div>

            <div style={panelCardStyle}>
              <h2 style={sectionTitleStyle}>Jogadores disponíveis</h2>
              <p style={panelTextStyle}>
                Lista dinâmica dos jogadores ainda não alocados em nenhum time.
                O sorteio acontece em camadas de nível: A, B, C, D e E.
              </p>

              <div style={availableListStyle}>
                {availablePlayers.map((player) => (
                  <PlayerListCard key={player.id} player={player} />
                ))}
                {availablePlayers.length === 0 && (
                  <p style={emptyTextStyle}>Todos os jogadores já foram distribuídos.</p>
                )}
              </div>
            </div>
          </section>

          <section style={teamsSectionStyle}>
            <div style={panelCardStyle}>
              <h2 style={sectionTitleStyle}>Controles da simulação</h2>
              <p style={panelTextStyle}>
                Use os comandos abaixo para avançar o draft por nível, com os
                jogadores disponíveis visíveis logo ao lado.
              </p>

              <div style={actionsRowStyle}>
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={isPending}
                  style={primaryButtonStyle}
                >
                  Gerar esboço inicial
                </button>

                <button
                  type="button"
                  onClick={handleDrawNext}
                  disabled={isPending}
                  style={secondaryButtonStyle}
                >
                  Sortear próximo jogador
                </button>
              </div>

              <div style={levelActionsWrapStyle}>
                {DRAFT_LEVEL_ORDER.map((level) => {
                  const isCurrent = state.currentDraftLevel === level;
                  const isBlocked =
                    nextPendingLevel !== null &&
                    DRAFT_LEVEL_ORDER.indexOf(level) > DRAFT_LEVEL_ORDER.indexOf(nextPendingLevel);

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
                Nível atual do draft: <strong>{state.currentDraftLevel}</strong> • Próximo time
                no rodízio: <strong>{nextTeam?.name || "Time 1"}</strong>
              </p>
            </div>

            <div style={panelCardStyle}>
              <h2 style={sectionTitleStyle}>Times em construção</h2>
              <p style={panelTextStyle}>
                O sorteio segue por camadas de nível e em rodízio entre os times,
                sempre respeitando vínculos, necessidade de posição e equilíbrio geral.
              </p>

              {!teamsComplete ? (
                <div style={movePanelStyle}>
                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Jogador para mover</label>
                    <select
                      value={selectedMovePlayer}
                      onChange={(event) => setSelectedMovePlayer(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {assignedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName} • Time {player.assignedTeamId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={fieldLabelStyle}>Time de destino</label>
                    <select
                      value={selectedDestinationTeam}
                      onChange={(event) => setSelectedDestinationTeam(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {state.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleMovePlayer}
                    disabled={isPending || !selectedMovePlayer || !selectedDestinationTeam}
                    style={secondaryButtonStyle}
                  >
                    Confirmar movimentação
                  </button>
                </div>
              ) : (
                <div style={swapSectionStyle}>
                  <div style={swapCardStyle}>
                    <h3 style={swapTitleStyle}>Troca simples</h3>
                    <div style={swapGridStyle}>
                      <div style={fieldStyle}>
                        <label style={fieldLabelStyle}>Jogador do primeiro time</label>
                        <select
                          value={selectedSimpleSwapFirst}
                          onChange={(event) => {
                            setSelectedSimpleSwapFirst(event.target.value);
                            setSwapFeedback(null);
                          }}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          {assignedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatSwapPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldStyle}>
                        <label style={fieldLabelStyle}>Jogador do segundo time</label>
                        <select
                          value={selectedSimpleSwapSecond}
                          onChange={(event) => {
                            setSelectedSimpleSwapSecond(event.target.value);
                            setSwapFeedback(null);
                          }}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          {assignedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatSwapPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={swapActionsStyle}>
                      <button
                        type="button"
                        onClick={handleValidateSimpleSwap}
                        disabled={isPending || !selectedSimpleSwapFirst || !selectedSimpleSwapSecond}
                        style={levelButtonStyle}
                      >
                        Validar troca
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSimpleSwap}
                        disabled={
                          isPending ||
                          swapFeedback?.type !== "simples" ||
                          swapFeedback?.signature !== simpleSwapSignature ||
                          !swapFeedback.valid
                        }
                        style={secondaryButtonStyle}
                      >
                        Confirmar troca
                      </button>
                    </div>
                  </div>

                  <div style={swapCardStyle}>
                    <h3 style={swapTitleStyle}>Troca tripla</h3>
                    <div style={swapTripleGridStyle}>
                      <div style={fieldStyle}>
                        <label style={fieldLabelStyle}>Jogador do primeiro time</label>
                        <select
                          value={selectedTripleSwapFirst}
                          onChange={(event) => {
                            setSelectedTripleSwapFirst(event.target.value);
                            setSwapFeedback(null);
                          }}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          {assignedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatSwapPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldStyle}>
                        <label style={fieldLabelStyle}>Jogador do segundo time</label>
                        <select
                          value={selectedTripleSwapSecond}
                          onChange={(event) => {
                            setSelectedTripleSwapSecond(event.target.value);
                            setSwapFeedback(null);
                          }}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          {assignedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatSwapPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldStyle}>
                        <label style={fieldLabelStyle}>Jogador do terceiro time</label>
                        <select
                          value={selectedTripleSwapThird}
                          onChange={(event) => {
                            setSelectedTripleSwapThird(event.target.value);
                            setSwapFeedback(null);
                          }}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          {assignedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {formatSwapPlayerOption(player)}
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
                          isPending ||
                          !selectedTripleSwapFirst ||
                          !selectedTripleSwapSecond ||
                          !selectedTripleSwapThird
                        }
                        style={levelButtonStyle}
                      >
                        Validar troca
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmTripleSwap}
                        disabled={
                          isPending ||
                          swapFeedback?.type !== "tripla" ||
                          swapFeedback?.signature !== tripleSwapSignature ||
                          !swapFeedback.valid
                        }
                        style={secondaryButtonStyle}
                      >
                        Confirmar troca
                      </button>
                    </div>
                  </div>

                  {swapFeedback && (
                    <div
                      style={
                        swapFeedback.valid ? successFeedbackStyle : invalidFeedbackStyle
                      }
                    >
                      {swapFeedback.message}
                    </div>
                  )}
                </div>
              )}

              <div style={teamsGridStyle}>
                {teams.map((team) => (
                  <article key={team.id} style={teamCardStyle}>
                    <div style={teamHeaderStyle}>
                      <div>
                        <h3 style={teamTitleStyle}>{team.name}</h3>
                        <p style={teamMetaStyle}>
                          {team.players.length} jogadores • Pontuação {team.totalScore}
                        </p>
                      </div>
                    </div>

                    {team.warnings.length > 0 && (
                      <div style={teamWarningStyle}>
                        {team.warnings.map((warning) => (
                          <p key={warning} style={{ margin: 0 }}>
                            {warning}
                          </p>
                        ))}
                      </div>
                    )}

                    <div style={playersListStyle}>
                      {team.players.map((player) => (
                        <div key={player.id} style={playerCardStyle}>
                          <div style={playerTopStyle}>
                            <strong style={playerNameStyle}>{player.fullName}</strong>
                            <span style={levelBadgeStyle}>{player.level}</span>
                          </div>

                          <p style={playerMetaStyle}>
                            {formatPosition(player.preferredPosition)} • {player.age} anos
                          </p>

                          <div style={tagWrapStyle}>
                            {player.bondGroup && (
                              <span style={bondTagStyle}>{player.bondGroup}</span>
                            )}
                            {player.usedFallback && (
                              <span style={fallbackTagStyle}>Fallback de posição</span>
                            )}
                            {player.assignedRole === "RESERVA" && (
                              <span style={reserveTagStyle}>Reserva</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {team.players.length === 0 && (
                        <p style={emptyTextStyle}>Nenhum jogador alocado ainda.</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PlayerListCard({ player }: { player: SimulationPlayer }) {
  return (
    <div style={availableCardStyle}>
      <div style={playerTopStyle}>
        <strong style={playerNameStyle}>{player.fullName}</strong>
        <span style={levelBadgeStyle}>{player.level}</span>
      </div>

      <p style={playerMetaStyle}>
        {formatPosition(player.preferredPosition)} • {player.age} anos
      </p>

      {player.bondGroup && <span style={bondTagStyle}>{player.bondGroup}</span>}
    </div>
  );
}

function formatSwapPlayerOption(player: SimulationPlayer) {
  return `Time ${player.assignedTeamId} | ${player.fullName} [${player.level}] - ${getShortPositionLabel(
    player.preferredPosition,
  )}`;
}

function getShortPositionLabel(position: SimulationPlayer["preferredPosition"]) {
  switch (position) {
    case "ATACANTE":
      return "ATA";
    case "MEIA":
      return "MEI";
    case "VOLANTE":
      return "VOL";
    case "LATERAL":
      return "LAT";
    case "ZAGUEIRO":
      return "ZAG";
  }
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
  background: "#FFFFFF",
  color: "#101010",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap",
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

const lastActionStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  color: "#374151",
  fontWeight: 600,
};

const rotationTextStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#4B5563",
  lineHeight: 1.6,
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

const warningCardStyle: React.CSSProperties = {
  background: "#FFF8E8",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  border: "1px solid #E7C56A",
};

const warningListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#7C2D12",
  lineHeight: 1.7,
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "360px minmax(0, 1fr)",
  gap: 18,
  alignItems: "start",
};

const sideSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const teamsSectionStyle: React.CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const panelCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
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

const bondFormStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const movePanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(200px, 0.8fr) auto",
  gap: 12,
  alignItems: "end",
  marginBottom: 18,
};

const swapSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginBottom: 18,
};

const swapCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 16,
  background: "#FAFAFA",
};

const swapTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
  color: "#101010",
};

const swapGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const swapTripleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const swapActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const invalidFeedbackStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontWeight: 600,
};

const successFeedbackStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  color: "#065F46",
  fontWeight: 600,
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

const availableListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxHeight: 720,
  overflowY: "auto",
  paddingRight: 4,
};

const availableCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#FAFAFA",
};

const teamsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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

const teamWarningStyle: React.CSSProperties = {
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

const playerCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#FFFFFF",
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

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  lineHeight: 1.6,
};
