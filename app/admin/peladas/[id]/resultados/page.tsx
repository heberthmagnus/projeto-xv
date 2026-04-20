import { getPeladaRoundPlayerSourceLabel, getPeladaRoundStatusLabel } from "@/lib/pelada-rounds";
import { getPlayerLevelLabel, getPositionLabel } from "@/lib/peladas";
import { getAdminPeladaResultadosPath } from "@/lib/routes";
import { loadPeladaAdminData } from "../pelada-admin-data";
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

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {resolvedSearchParams.success && (
          <div style={successBannerStyle}>
            {resolvedSearchParams.success === "status-update" &&
              "✅ Status da pelada atualizado com sucesso."}
            {resolvedSearchParams.success === "round-result-update" &&
              "✅ Resultado da pelada atualizado com sucesso."}
            {resolvedSearchParams.success === "round-goal-add" &&
              "✅ Gol registrado com sucesso."}
            {resolvedSearchParams.success === "round-goal-delete" &&
              "✅ Gol removido com sucesso."}
          </div>
        )}

        {resolvedSearchParams.error && (
          <div style={errorBannerStyle}>{resolvedSearchParams.error}</div>
        )}

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

const successBannerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "#ECFDF3",
  color: "#047857",
  fontWeight: 700,
  border: "1px solid #A7F3D0",
};

const errorBannerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "#FEF2F2",
  color: "#B91C1C",
  fontWeight: 700,
  border: "1px solid #FECACA",
};

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
