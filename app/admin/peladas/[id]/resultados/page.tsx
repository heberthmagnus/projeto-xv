import { getPeladaRoundPlayerSourceLabel, getPeladaRoundStatusLabel } from "@/lib/pelada-rounds";
import { getPlayerLevelLabel, getPositionLabel } from "@/lib/peladas";
import { getAdminPeladaResultadosPath } from "@/lib/routes";
import { loadPeladaAdminData } from "../pelada-admin-data";
import { PeladaFeedbackBanner } from "../../pelada-feedback";
import { ResultSheet } from "./result-sheet";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function PeladaResultadosPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pelada = await loadPeladaAdminData(id);
  const returnTo = getAdminPeladaResultadosPath(pelada.id);
  const rounds = [...pelada.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const totalGoals = rounds.reduce((sum, round) => sum + round.goals.length, 0);
  const completedRounds = rounds.filter((round) => round.players.length > 0);
  const roundsWithNotes = rounds.filter((round) => round.notes?.trim()).length;
  const scorersMap = new Map<
    string,
    {
      scorerName: string;
      teamColor: "PRETO" | "AMARELO";
      goals: number;
    }
  >();
  const participantsMap = new Map<
    string,
    {
      participantId: string;
      fullName: string;
      rounds: number;
      goals: number;
      teams: Set<"PRETO" | "AMARELO">;
    }
  >();

  for (const round of rounds) {
    const playerArrivalMap = new Map(
      round.players.map((player) => [player.id, player.arrivalId] as const),
    );

    for (const player of round.players) {
      const participantKey = player.arrivalId;
      const existingParticipant = participantsMap.get(participantKey);

      if (existingParticipant) {
        existingParticipant.rounds += 1;

        if (player.teamColor) {
          existingParticipant.teams.add(player.teamColor);
        }
      } else {
        participantsMap.set(participantKey, {
          participantId: participantKey,
          fullName: player.arrival.fullName,
          rounds: 1,
          goals: 0,
          teams: new Set(player.teamColor ? [player.teamColor] : []),
        });
      }
    }

    for (const goal of round.goals) {
      const scorerKey = goal.roundPlayerId || `${goal.scorerName}-${goal.teamColor}`;
      const existing = scorersMap.get(scorerKey);
      const participantArrivalId = goal.roundPlayerId
        ? playerArrivalMap.get(goal.roundPlayerId)
        : null;
      const participant = participantArrivalId
        ? participantsMap.get(participantArrivalId)
        : null;

      if (existing) {
        existing.goals += 1;
      } else {
        scorersMap.set(scorerKey, {
          scorerName: goal.scorerName,
          teamColor: goal.teamColor,
          goals: 1,
        });
      }

      if (participant) {
        participant.goals += 1;
      }
    }
  }

  const topScorers = [...scorersMap.values()]
    .sort((left, right) => right.goals - left.goals || left.scorerName.localeCompare(right.scorerName))
    .slice(0, 5);
  const topParticipants = [...participantsMap.values()]
    .sort(
      (left, right) =>
        right.rounds - left.rounds ||
        right.goals - left.goals ||
        left.fullName.localeCompare(right.fullName),
    )
    .slice(0, 8);

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        <PeladaFeedbackBanner
          scope="resultados"
          success={resolvedSearchParams.success}
          error={resolvedSearchParams.error}
        />

        <section className="xv-card">
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Resultados</h2>
              <p style={sectionDescriptionStyle}>
                Registre placar, gols e quem jogou cada pelada em um formato mais
                próximo da folha do dia, sem misturar isso com a operação da fila.
              </p>
            </div>
          </div>

          {rounds.length === 0 ? (
            <div style={emptyCardStyle}>
              <p style={emptyTextStyle}>
                Ainda não há peladas criadas para registrar resultado.
              </p>
            </div>
          ) : (
            <div style={resultsStackStyle}>
              <div style={summaryGridStyle}>
                <div style={summaryCardStyle}>
                  <span style={summaryLabelStyle}>Peladas registradas</span>
                  <strong style={summaryScoreStyle}>{completedRounds.length}</strong>
                  <span style={summaryMetaStyle}>Rodadas do dia com jogadores salvos</span>
                </div>

                <div style={summaryCardStyle}>
                  <span style={summaryLabelStyle}>Jogadores no histórico</span>
                  <strong style={summaryScoreStyle}>{participantsMap.size}</strong>
                  <span style={summaryMetaStyle}>
                    Atletas que já entraram em campo nesta pelada
                  </span>
                </div>

                <div style={summaryCardStyle}>
                  <span style={summaryLabelStyle}>Total de gols</span>
                  <strong style={summaryScoreStyle}>{totalGoals}</strong>
                  <span style={summaryMetaStyle}>Gols registrados no histórico do dia</span>
                </div>

                <div style={summaryCardStyle}>
                  <span style={summaryLabelStyle}>Observações salvas</span>
                  <strong style={summaryScoreStyle}>{roundsWithNotes}</strong>
                  <span style={summaryMetaStyle}>Peladas com contexto salvo no histórico</span>
                </div>

                {rounds.map((round) => (
                  <div key={round.id} style={summaryCardStyle}>
                    <span style={summaryLabelStyle}>Pelada {round.roundNumber}</span>
                    <strong style={summaryScoreStyle}>
                      {round.blackScore} x {round.yellowScore}
                    </strong>
                    <span style={summaryMetaStyle}>
                      {round.players.length} jogadores • {round.goals.length} gols
                    </span>
                  </div>
                ))}
              </div>

              <div style={insightsGridStyle}>
                <div style={topScorersCardStyle}>
                  <div>
                    <h3 style={topScorersTitleStyle}>Artilharia do dia</h3>
                    <p style={topScorersDescriptionStyle}>
                      Resumo rápido dos jogadores com mais gols nas peladas já registradas.
                    </p>
                  </div>

                  {topScorers.length === 0 ? (
                    <p style={emptyTextStyle}>Ainda não há gols lançados.</p>
                  ) : (
                    <div style={topScorersListStyle}>
                      {topScorers.map((scorer) => (
                        <div
                          key={`${scorer.scorerName}-${scorer.teamColor}`}
                          style={topScorerItemStyle}
                        >
                          <div>
                            <strong style={topScorerNameStyle}>{scorer.scorerName}</strong>
                            <div style={topScorerMetaStyle}>
                              {scorer.teamColor === "PRETO" ? "Time Preto" : "Time Amarelo"}
                            </div>
                          </div>
                          <span style={topScorerGoalsStyle}>
                            {scorer.goals} gol{scorer.goals === 1 ? "" : "s"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={topScorersCardStyle}>
                  <div>
                    <h3 style={topScorersTitleStyle}>Participação do dia</h3>
                    <p style={topScorersDescriptionStyle}>
                      Quem mais jogou e já ficou registrado na memória da pelada.
                    </p>
                  </div>

                  {topParticipants.length === 0 ? (
                    <p style={emptyTextStyle}>Nenhuma participação registrada ainda.</p>
                  ) : (
                    <div style={topScorersListStyle}>
                      {topParticipants.map((participant) => (
                        <div key={participant.participantId} style={topScorerItemStyle}>
                          <div>
                            <strong style={topScorerNameStyle}>{participant.fullName}</strong>
                            <div style={topScorerMetaStyle}>
                              {participant.rounds} pelada{participant.rounds === 1 ? "" : "s"} •{" "}
                              {participant.goals} gol{participant.goals === 1 ? "" : "s"}
                            </div>
                          </div>
                          <span style={participantTeamsStyle}>
                            {[...participant.teams]
                              .map((team) => (team === "PRETO" ? "Preto" : "Amarelo"))
                              .join(" / ") || "Sem time"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {rounds.map((round) => (
                <ResultSheet
                  key={round.id}
                  peladaId={pelada.id}
                  returnTo={returnTo}
                  round={{
                    id: round.id,
                    roundNumber: round.roundNumber,
                    statusLabel: getPeladaRoundStatusLabel(round.status),
                    createdAt: round.createdAt,
                    blackScore: round.blackScore,
                    yellowScore: round.yellowScore,
                    notes: round.notes,
                    players: round.players.map((player) => ({
                      id: player.id,
                      queueOrder: player.queueOrder,
                      sourceLabel: getPeladaRoundPlayerSourceLabel(player.source),
                      teamColor: player.teamColor,
                      arrival: {
                        fullName: player.arrival.fullName,
                        preferredPositionLabel: getPositionLabel(
                          player.arrival.preferredPosition,
                        ),
                        levelLabel: getPlayerLevelLabel(player.arrival.level),
                      },
                    })),
                    goals: round.goals.map((goal) => ({
                      id: goal.id,
                      roundPlayerId: goal.roundPlayerId,
                      scorerName: goal.scorerName,
                      minute: goal.minute,
                      teamColor: goal.teamColor,
                    })),
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 24,
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.7,
};

const emptyCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #D1D5DB",
  background: "#FAFAFA",
  padding: 20,
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
};

const resultsStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const insightsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
};

const topScorersCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 14,
};

const topScorersTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  color: "#101010",
};

const topScorersDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#5B6472",
  lineHeight: 1.6,
};

const topScorersListStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const topScorerItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#FAFAFA",
};

const topScorerNameStyle: React.CSSProperties = {
  color: "#101010",
};

const topScorerMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  color: "#6B7280",
};

const topScorerGoalsStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#8B6914",
  whiteSpace: "nowrap",
};

const participantTeamsStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#374151",
  textAlign: "right",
  lineHeight: 1.4,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const summaryCardStyle: React.CSSProperties = {
  borderRadius: 12,
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  padding: 14,
  display: "grid",
  gap: 4,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#8B6914",
  fontWeight: 700,
};

const summaryScoreStyle: React.CSSProperties = {
  fontSize: 24,
  lineHeight: 1,
  color: "#111111",
};

const summaryMetaStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#5B6472",
};
