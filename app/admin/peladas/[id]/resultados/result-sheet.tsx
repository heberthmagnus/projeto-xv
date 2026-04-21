import {
  createPeladaRoundGoal,
  deletePeladaRoundGoal,
  updatePeladaRoundResult,
} from "../../actions";
import { formatPeladaDateTime } from "../pelada-admin-data";

type ResultPlayer = {
  id: string;
  queueOrder: number;
  sourceLabel: string;
  teamColor: "PRETO" | "AMARELO" | null;
  arrival: {
    fullName: string;
    preferredPositionLabel: string;
    levelLabel: string;
  };
};

type ResultGoal = {
  id: string;
  roundPlayerId: string | null;
  scorerName: string;
  minute: number | null;
  teamColor: "PRETO" | "AMARELO";
};

type ResultSheetProps = {
  peladaId: string;
  round: {
    id: string;
    roundNumber: number;
    statusLabel: string;
    createdAt: Date;
    blackScore: number;
    yellowScore: number;
    notes: string | null;
    players: ResultPlayer[];
    goals: ResultGoal[];
  };
  returnTo: string;
};

export function ResultSheet({ peladaId, round, returnTo }: ResultSheetProps) {
  const blackPlayers = round.players.filter((player) => player.teamColor === "PRETO");
  const yellowPlayers = round.players.filter((player) => player.teamColor === "AMARELO");
  const playerGoalsMap = new Map<string, number>();
  const scorerSummaryMap = new Map<
    string,
    {
      scorerName: string;
      teamColor: "PRETO" | "AMARELO";
      goals: number;
      minutes: number[];
    }
  >();

  for (const goal of round.goals) {
    const scorerKey = goal.roundPlayerId || `${goal.scorerName}-${goal.teamColor}`;
    const scorerSummary = scorerSummaryMap.get(scorerKey);

    if (goal.roundPlayerId) {
      playerGoalsMap.set(goal.roundPlayerId, (playerGoalsMap.get(goal.roundPlayerId) || 0) + 1);
    } else {
      const matchedPlayer = round.players.find(
        (player) =>
          player.arrival.fullName === goal.scorerName && player.teamColor === goal.teamColor,
      );

      if (matchedPlayer) {
        playerGoalsMap.set(
          matchedPlayer.id,
          (playerGoalsMap.get(matchedPlayer.id) || 0) + 1,
        );
      }
    }

    if (scorerSummary) {
      scorerSummary.goals += 1;

      if (typeof goal.minute === "number") {
        scorerSummary.minutes.push(goal.minute);
      }
    } else {
      scorerSummaryMap.set(scorerKey, {
        scorerName: goal.scorerName,
        teamColor: goal.teamColor,
        goals: 1,
        minutes: typeof goal.minute === "number" ? [goal.minute] : [],
      });
    }
  }

  const goalSummary = [...scorerSummaryMap.values()].sort(
    (left, right) =>
      right.goals - left.goals || left.scorerName.localeCompare(right.scorerName),
  );

  return (
    <section style={sheetCardStyle}>
      <div style={sheetHeaderStyle}>
        <div>
          <h3 style={sheetTitleStyle}>Pelada {round.roundNumber}</h3>
          <p style={sheetMetaStyle}>
            {round.statusLabel} • criada em {formatPeladaDateTime(round.createdAt)}
          </p>
        </div>

        <div style={scoreBoxStyle}>
          <span style={scoreTeamStyle}>Preto</span>
          <strong style={scoreValueStyle}>{round.blackScore}</strong>
          <span style={scoreDividerStyle}>x</span>
          <strong style={scoreValueStyle}>{round.yellowScore}</strong>
          <span style={scoreTeamStyle}>Amarelo</span>
        </div>
      </div>

      {round.notes ? (
        <div style={notesBannerStyle}>
          <strong style={notesTitleStyle}>Observações:</strong> {round.notes}
        </div>
      ) : null}

      <div className="grid gap-4 p-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
        <div style={sheetBlockStyle}>
          <div className="xv-table-scroll xv-dense-table" style={tableWrapperStyle}>
            <table style={sheetTableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Ordem</th>
                  <th style={thStyle}>Lista jogadores</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Posição</th>
                  <th style={thStyle}>Nível</th>
                  <th style={thStyle}>Gols</th>
                  <th style={thStyle}>Origem</th>
                </tr>
              </thead>
              <tbody>
                {round.players.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={emptyTdStyle}>
                      Nenhum jogador registrado nesta pelada.
                    </td>
                  </tr>
                ) : (
                  round.players.map((player) => (
                    <tr key={player.id}>
                      <td style={numberTdStyle}>{player.queueOrder}</td>
                      <td style={nameTdStyle}>{player.arrival.fullName}</td>
                      <td style={tdStyle}>
                        {player.teamColor === "PRETO" ? (
                          <span style={blackTeamBadgeStyle}>Preto</span>
                        ) : player.teamColor === "AMARELO" ? (
                          <span style={yellowTeamBadgeStyle}>Amarelo</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>{player.arrival.preferredPositionLabel}</td>
                      <td style={tdStyle}>{player.arrival.levelLabel}</td>
                      <td style={goalsTdStyle}>{playerGoalsMap.get(player.id) || 0}</td>
                      <td style={tdStyle}>{player.sourceLabel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sidePanelStyle}>
          <div style={sidePanelSectionStyle}>
            <h4 style={panelTitleStyle}>Quem jogou</h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div style={teamListCardStyle}>
                <div style={teamListHeaderStyle}>Time Preto</div>
                {blackPlayers.length === 0 ? (
                  <p style={mutedStyle}>Nenhum jogador salvo no Preto.</p>
                ) : (
                  <ul style={teamListStyle}>
                    {blackPlayers.map((player) => (
                      <li key={player.id} style={teamListItemStyle}>
                        {player.arrival.fullName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={teamListCardStyle}>
                <div style={yellowListHeaderStyle}>Time Amarelo</div>
                {yellowPlayers.length === 0 ? (
                  <p style={mutedStyle}>Nenhum jogador salvo no Amarelo.</p>
                ) : (
                  <ul style={teamListStyle}>
                    {yellowPlayers.map((player) => (
                      <li key={player.id} style={teamListItemStyle}>
                        {player.arrival.fullName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <form action={updatePeladaRoundResult} style={sidePanelSectionStyle}>
            <input type="hidden" name="peladaId" value={peladaId} />
            <input type="hidden" name="roundId" value={round.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <h4 style={panelTitleStyle}>Resultado</h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <label style={fieldStyle}>
                <span style={labelStyle}>Gols do Preto</span>
                <input
                  name="blackScore"
                  type="number"
                  min={0}
                  defaultValue={round.blackScore}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Gols do Amarelo</span>
                <input
                  name="yellowScore"
                  type="number"
                  min={0}
                  defaultValue={round.yellowScore}
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={fieldStyle}>
              <span style={labelStyle}>Observações</span>
              <input
                name="notes"
                type="text"
                defaultValue={round.notes || ""}
                placeholder="Ex.: jogo truncado, chuva, goleiro trocado"
                style={inputStyle}
              />
            </label>

            <div className="xv-form-actions">
              <button type="submit" style={secondaryActionButtonStyle}>
                Salvar resultado
              </button>
            </div>
          </form>

          <div style={sidePanelSectionStyle}>
            <h4 style={panelTitleStyle}>Gols registrados</h4>

            {round.goals.length === 0 ? (
              <p style={mutedStyle}>Nenhum gol registrado ainda.</p>
            ) : (
              <>
                <div style={goalSummaryListStyle}>
                  {goalSummary.map((scorer) => (
                    <div
                      key={`${scorer.scorerName}-${scorer.teamColor}`}
                      style={goalSummaryItemStyle}
                    >
                      <div>
                        <strong style={goalSummaryNameStyle}>{scorer.scorerName}</strong>
                        <div style={goalSummaryMetaStyle}>
                          {scorer.teamColor === "PRETO" ? "Time Preto" : "Time Amarelo"}
                          {scorer.minutes.length > 0
                            ? ` • ${scorer.minutes.sort((a, b) => a - b).join(", ")} min`
                            : ""}
                        </div>
                      </div>
                      <span style={goalSummaryCountStyle}>
                        {scorer.goals} gol{scorer.goals === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={goalListStyle}>
                  {round.goals.map((goal) => (
                    <div key={goal.id} style={goalItemStyle}>
                      <span style={goalTextStyle}>
                        {goal.scorerName} •{" "}
                        {goal.teamColor === "PRETO" ? "Preto" : "Amarelo"}
                        {typeof goal.minute === "number" ? ` • ${goal.minute} min` : ""}
                      </span>

                      <form action={deletePeladaRoundGoal}>
                        <input type="hidden" name="peladaId" value={peladaId} />
                        <input type="hidden" name="goalId" value={goal.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit" style={miniDangerButtonStyle}>
                          Excluir
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <form action={createPeladaRoundGoal} style={sidePanelSectionStyle}>
            <input type="hidden" name="peladaId" value={peladaId} />
            <input type="hidden" name="roundId" value={round.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <h4 style={panelTitleStyle}>Adicionar gol</h4>

            <label style={fieldStyle}>
              <span style={labelStyle}>Jogador</span>
              <select name="roundPlayerId" defaultValue="" style={inputStyle}>
                <option value="" disabled>
                  Selecione
                </option>
                {round.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.arrival.fullName}
                    {player.teamColor
                      ? ` • ${player.teamColor === "PRETO" ? "Preto" : "Amarelo"}`
                      : " • sem time salvo"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3">
              <label style={fieldStyle}>
                <span style={labelStyle}>Quantidade de gols</span>
                <select name="quantity" defaultValue="1" style={inputStyle}>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Minuto</span>
                <input
                  name="minute"
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Opcional"
                  style={inputStyle}
                />
              </label>
            </div>

            <div className="xv-form-actions">
              <button type="submit" style={primaryActionButtonStyle}>
                Adicionar gol
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

const sheetCardStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #B6B6B6",
  background: "#FFFFFF",
  overflow: "hidden",
  display: "grid",
};

const sheetHeaderStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "#F5F5F5",
  borderBottom: "1px solid #B6B6B6",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const sheetTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111111",
};

const sheetMetaStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#5B6472",
};

const scoreBoxStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 999,
  background: "#111111",
  color: "#FFFFFF",
};

const scoreTeamStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#E5E7EB",
};

const scoreValueStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1,
  color: "#FFFFFF",
};

const scoreDividerStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#D1D5DB",
};

const notesBannerStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #E5E7EB",
  background: "#FFFBEB",
  color: "#7C5A07",
  lineHeight: 1.6,
};

const notesTitleStyle: React.CSSProperties = {
  fontWeight: 800,
};

const sheetBlockStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
};

const tableWrapperStyle: React.CSSProperties = {};

const sheetTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 600,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #B6B6B6",
  background: "#D9D9D9",
  fontSize: 12,
  fontWeight: 800,
  color: "#1A1A1A",
  textAlign: "left",
  textTransform: "none",
};

const tdStyle: React.CSSProperties = {
  padding: "7px 8px",
  border: "1px solid #D1D5DB",
  fontSize: 13,
  color: "#111111",
  background: "#FFFFFF",
};

const numberTdStyle: React.CSSProperties = {
  ...tdStyle,
  width: 74,
  textAlign: "right",
  fontWeight: 700,
  background: "#F7F7F7",
};

const nameTdStyle: React.CSSProperties = {
  ...tdStyle,
  minWidth: 220,
  fontWeight: 600,
};

const goalsTdStyle: React.CSSProperties = {
  ...tdStyle,
  width: 74,
  textAlign: "center",
  fontWeight: 800,
  color: "#8B6914",
};

const blackTeamBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 68,
  padding: "3px 8px",
  borderRadius: 999,
  background: "#18181B",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
};

const yellowTeamBadgeStyle: React.CSSProperties = {
  ...blackTeamBadgeStyle,
  background: "#FCF7E6",
  color: "#8B6914",
  border: "1px solid #F1D68A",
};

const emptyTdStyle: React.CSSProperties = {
  ...tdStyle,
  padding: "18px 12px",
  textAlign: "center",
  color: "#6B7280",
};

const sidePanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const sidePanelSectionStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  padding: 12,
  background: "#FAFAFA",
  display: "grid",
  gap: 12,
};

const teamListCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  overflow: "hidden",
  background: "#FFFFFF",
};

const teamListHeaderStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "#111111",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 13,
};

const yellowListHeaderStyle: React.CSSProperties = {
  ...teamListHeaderStyle,
  background: "#FCF7E6",
  color: "#8B6914",
};

const teamListStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const teamListItemStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderTop: "1px solid #F3F4F6",
  fontSize: 13,
  color: "#111827",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: "#111111",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#1F2937",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};

const secondaryActionButtonStyle: React.CSSProperties = {
  borderRadius: 8,
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 800,
  fontSize: 13,
  padding: "10px 14px",
  cursor: "pointer",
  border: "1px solid #D1D5DB",
  minHeight: 42,
};

const primaryActionButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 13,
  padding: "10px 14px",
  cursor: "pointer",
  minHeight: 42,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "#6B7280",
};

const goalListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const goalSummaryListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const goalSummaryItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 8,
  background: "#FFFBEA",
  border: "1px solid #F1D68A",
};

const goalSummaryNameStyle: React.CSSProperties = {
  color: "#111827",
};

const goalSummaryMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#6B7280",
  lineHeight: 1.4,
};

const goalSummaryCountStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#8B6914",
  whiteSpace: "nowrap",
};

const goalItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 8,
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
};

const goalTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
  lineHeight: 1.5,
};

const miniDangerButtonStyle: React.CSSProperties = {
  border: "1px solid #FCA5A5",
  borderRadius: 8,
  background: "#FEF2F2",
  color: "#B91C1C",
  fontWeight: 700,
  fontSize: 12,
  padding: "7px 10px",
  cursor: "pointer",
};
