import {
  getNextRoundPlayers,
  getPeladaRoundPlayerSourceLabel,
  getPeladaRoundStatusLabel,
} from "@/lib/pelada-rounds";
import {
  getLevelScore,
  getPeladaTeamColorLabel,
  PELADA_TEAM_COLORS,
} from "@/lib/pelada-teams";
import { getPlayerLevelLabel, getPositionLabel } from "@/lib/peladas";
import { getAdminPeladaPeladasDoDiaPath } from "@/lib/routes";
import { PeladaSheet } from "./pelada-sheet";
import {
  clearPeladaTeams,
  closeCurrentPeladaRound,
  generatePeladaTeams,
  generateNextPeladaRound,
  generateNextPeladaRoundAndGenerateTeams,
  markArrivalAvailableForNextRound,
  openFirstPeladaRound,
  openFirstPeladaRoundAndGenerateTeams,
  resetPeladaProgress,
  swapPeladaTeamPlayers,
} from "../../actions";
import {
  loadPeladaAdminData,
  type PageRound,
} from "../pelada-admin-data";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function PeladaPeladasDoDiaPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pelada = await loadPeladaAdminData(id);
  const returnTo = getAdminPeladaPeladasDoDiaPath(pelada.id);

  const teamAssignments = pelada.teamAssignments;
  const rounds = pelada.rounds;
  const arrivals = pelada.arrivals;
  const peladasDoDia = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const activeRound = peladasDoDia.find((round) => round.status === "ATIVA") || null;
  const latestRound = peladasDoDia[peladasDoDia.length - 1] || null;
  const roundBaseForNext = activeRound || latestRound;
  const teamAssignmentByArrivalId = new Map(
    teamAssignments.map((assignment) => [assignment.arrival.id, assignment]),
  );
  const currentPeladaRows = activeRound
    ? activeRound.players.map((player: PageRound["players"][number]) => ({
        ...player,
        assignment: teamAssignmentByArrivalId.get(player.arrivalId) || null,
      }))
    : [];

  const nextRoundPreview = roundBaseForNext
    ? getNextRoundPlayers({
        pelada: {
          type: pelada.type,
          linePlayersCount: pelada.linePlayersCount,
          maxFirstGamePlayers: pelada.maxFirstGamePlayers,
        },
        arrivals: arrivals.map((arrival) => ({
          id: arrival.id,
          arrivalOrder: arrival.arrivalOrder,
          availableForNextRound: arrival.availableForNextRound,
          preferredPosition: arrival.preferredPosition,
        })),
        latestRound: {
          id: roundBaseForNext.id,
          roundNumber: roundBaseForNext.roundNumber,
          players: roundBaseForNext.players.map(
            (player: PageRound["players"][number]) => ({
              arrivalId: player.arrivalId,
            }),
          ),
        },
      })
    : [];

  const nextRoundPreviewRows = nextRoundPreview
    .map((player: (typeof nextRoundPreview)[number]) => {
      const arrival = arrivals.find((item) => item.id === player.arrivalId);

      if (!arrival) {
        return null;
      }

      return {
        ...player,
        arrival,
      };
    })
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  const teamsByColor = PELADA_TEAM_COLORS.map((color) => {
    const assignments = teamAssignments.filter(
      (assignment) => assignment.teamColor === color,
    );

    return {
      color,
      assignments,
      totalScore: assignments.reduce(
        (sum, assignment) => sum + getLevelScore(assignment.arrival.level),
        0,
      ),
    };
  });

  const currentSheetRows = currentPeladaRows.map((player) => ({
    id: player.id,
    queueOrder: player.queueOrder,
    fullName: player.arrival.fullName,
    preferredPositionLabel: getPositionLabel(player.arrival.preferredPosition),
    levelLabel: getPlayerLevelLabel(player.arrival.level),
    blackMark: player.assignment?.teamColor === "PRETO" ? "✓" : "",
    yellowMark: player.assignment?.teamColor === "AMARELO" ? "✓" : "",
  }));

  const nextSheetRows = nextRoundPreviewRows.map((player) => ({
    id: player.arrival.id,
    queueOrder: player.queueOrder,
    fullName: player.arrival.fullName,
    preferredPositionLabel: getPositionLabel(player.arrival.preferredPosition),
    levelLabel: getPlayerLevelLabel(player.arrival.level),
    sourceLabel: getPeladaRoundPlayerSourceLabel(player.source),
  }));

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {resolvedSearchParams.success && (
          <div style={successBannerStyle}>
            {resolvedSearchParams.success === "teams-generated" &&
              "✅ Times Amarelo e Preto gerados com sucesso."}
            {resolvedSearchParams.success === "teams-swapped" &&
              "✅ Troca entre os times realizada com sucesso."}
            {resolvedSearchParams.success === "teams-cleared" &&
              "✅ Divisão dos times limpa com sucesso."}
            {resolvedSearchParams.success === "round-opened" &&
              "✅ Pelada 1 criada com sucesso."}
            {resolvedSearchParams.success === "round-opened-teams" &&
              "✅ Pelada 1 criada e times divididos com sucesso."}
            {resolvedSearchParams.success === "round-next" &&
              "✅ Próxima pelada criada com sucesso."}
            {resolvedSearchParams.success === "round-next-teams" &&
              "✅ Próxima pelada criada e times divididos com sucesso."}
            {resolvedSearchParams.success === "round-closed" &&
              "✅ Pelada atual encerrada com sucesso."}
            {resolvedSearchParams.success === "round-availability-on" &&
              "✅ Jogador marcado para poder jogar outra."}
            {resolvedSearchParams.success === "round-availability-off" &&
              "✅ Jogador removido da repescagem."}
            {resolvedSearchParams.success === "pelada-progress-reset" &&
              "✅ Andamento da pelada resetado com sucesso."}
          </div>
        )}

        {resolvedSearchParams.error && (
          <div style={errorBannerStyle}>{resolvedSearchParams.error}</div>
        )}

        <section className="xv-card" style={sectionStyle}>
          <div style={sectionHeaderWithActionStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Peladas do dia</h2>
              <p style={sectionDescriptionStyle}>
                Organize a fila como na folha do domingo: suba uma pelada por vez,
                veja quem ficou de fora, complete a próxima com repescagem e
                divida os times Amarelo e Preto no momento certo.
              </p>
            </div>

            <div style={headerActionsWrapStyle}>
              {peladasDoDia.length === 0 ? (
                <>
                  <form action={openFirstPeladaRound}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={secondaryActionButtonStyle}>
                      Subir Pelada 1
                    </button>
                  </form>

                  <form action={openFirstPeladaRoundAndGenerateTeams}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={primaryActionButtonStyle}>
                      Subir Pelada 1 e dividir
                    </button>
                  </form>
                </>
              ) : activeRound ? (
                <>
                  <form action={closeCurrentPeladaRound}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={secondaryActionButtonStyle}>
                      Encerrar pelada atual
                    </button>
                  </form>

                  <form action={generateNextPeladaRound}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={secondaryActionButtonStyle}>
                      Subir próxima pelada
                    </button>
                  </form>

                  <form action={generateNextPeladaRoundAndGenerateTeams}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={primaryActionButtonStyle}>
                      Subir próxima pelada e dividir
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <form action={generateNextPeladaRound}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={secondaryActionButtonStyle}>
                      Subir próxima pelada
                    </button>
                  </form>

                  <form action={generateNextPeladaRoundAndGenerateTeams}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={primaryActionButtonStyle}>
                      Subir próxima pelada e dividir
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div style={dangerCardStyle}>
            <div>
              <strong style={dangerTitleStyle}>Resetar andamento</strong>
              <p style={dangerTextStyle}>
                Mantém confirmados e chegadas, mas limpa peladas criadas, divisão
                dos times, repescagem, gols/resultados vinculados e marcações de
                repetição.
              </p>
            </div>

            <form action={resetPeladaProgress}>
              <input type="hidden" name="peladaId" value={pelada.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" style={dangerButtonStyle}>
                Resetar andamento
              </button>
            </form>
          </div>

          <div style={compactStatsGridStyle}>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Peladas criadas</span>
              <strong style={statValueStyle}>{rounds.length}</strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Pelada atual</span>
              <strong style={statValueStyle}>
                {activeRound ? activeRound.roundNumber : "—"}
              </strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Status</span>
              <strong style={statValueStyleSmall}>
                {activeRound
                  ? getPeladaRoundStatusLabel(activeRound.status)
                  : "Sem pelada ativa"}
              </strong>
            </div>
          </div>

          {peladasDoDia.length > 0 && (
            <div className="xv-subcard">
              <h3 style={subsectionTitleStyle}>Resumo das peladas já criadas</h3>
              <div style={compactStatsGridStyle}>
                {peladasDoDia.map((round) => (
                  <div key={round.id} style={statCardStyle}>
                    <span style={statLabelStyle}>Pelada {round.roundNumber}</span>
                    <strong style={statValueStyle}>{round.players.length}</strong>
                    <span style={inlineMutedStyle}>
                      {getPeladaRoundStatusLabel(round.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={sheetGridStyle}>
            {activeRound ? (
              <PeladaSheet
                title={`Pelada ${activeRound.roundNumber} em andamento`}
                subtitle="Lista atual em campo. Se os times já foram divididos, as marcações de Preto e Amarelo aparecem na própria folha."
                rows={currentSheetRows}
                emptyMessage="Nenhum jogador registrado na pelada atual."
              />
            ) : (
              <div style={sheetPlaceholderStyle}>
                <strong style={sheetPlaceholderTitleStyle}>Pelada atual</strong>
                <p style={sheetPlaceholderTextStyle}>
                  Ainda não há pelada ativa. Use os botões acima para subir a
                  Pelada 1 ou a próxima pelada do dia.
                </p>
              </div>
            )}

            <PeladaSheet
              title={
                roundBaseForNext
                  ? `Próxima pelada prevista: Pelada ${roundBaseForNext.roundNumber + 1}`
                  : "Próxima pelada prevista"
              }
              subtitle="Primeiro entram os que ficaram de fora; se faltar gente, a repescagem completa a lista respeitando a ordem de chegada."
              rows={nextSheetRows}
              emptyMessage="Ainda não há jogadores suficientes para montar a próxima pelada."
              showSource
            />
          </div>

          <div className="xv-subcard">
            <h3 style={subsectionTitleStyle}>Repescagem para a próxima pelada</h3>
            <p style={subsectionDescriptionStyle}>
              Quando faltar jogador para fechar a próxima pelada, marque aqui quem
              topa jogar de novo. A repescagem sempre respeita a ordem de chegada
              original da lista do dia.
            </p>

            <div className="xv-table-scroll">
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ordem</th>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Posição</th>
                    <th style={thStyle}>Nível</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {arrivals.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={emptyStyle}>
                        Nenhuma chegada registrada ainda.
                      </td>
                    </tr>
                  ) : (
                    arrivals.map((arrival) => (
                      <tr key={arrival.id}>
                        <td style={tdStyle}>{arrival.arrivalOrder}</td>
                        <td style={tdStyle}>{arrival.fullName}</td>
                        <td style={tdStyle}>
                          {getPositionLabel(arrival.preferredPosition)}
                        </td>
                        <td style={tdStyle}>{getPlayerLevelLabel(arrival.level)}</td>
                        <td style={tdStyle}>
                          {arrival.availableForNextRound
                            ? "Vai jogar outra"
                            : "Aguardando resposta"}
                        </td>
                        <td style={tdStyle}>
                          <form
                            action={markArrivalAvailableForNextRound}
                            style={inlineFormStyle}
                          >
                            <input type="hidden" name="peladaId" value={pelada.id} />
                            <input type="hidden" name="arrivalId" value={arrival.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <input
                              type="hidden"
                              name="available"
                              value={arrival.availableForNextRound ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              style={
                                arrival.availableForNextRound
                                  ? secondaryActionButtonStyle
                                  : miniPrimaryButtonStyle
                              }
                            >
                              {arrival.availableForNextRound
                                ? "Remover"
                                : "Vai jogar outra"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <section style={divisionSectionStyle}>
            <div style={sectionHeaderWithActionStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Divisão dos times</h2>
                <p style={sectionDescriptionStyle}>
                  Gere os times <strong>Amarelo</strong> e <strong>Preto</strong>{" "}
                  com base na pelada ativa. Quando o nível estiver preenchido, o
                  sistema busca um equilíbrio melhor; sem nível, ele prioriza
                  posição e você ainda pode ajustar manualmente.
                </p>
              </div>

              <div style={headerActionsWrapStyle}>
                <form action={generatePeladaTeams}>
                  <input type="hidden" name="peladaId" value={pelada.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" style={primaryActionButtonStyle}>
                    {teamAssignments.length > 0 ? "Refazer divisão" : "Dividir times"}
                  </button>
                </form>

                {teamAssignments.length > 0 && (
                  <form action={clearPeladaTeams}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" style={secondaryActionButtonStyle}>
                      Limpar divisão
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div style={compactStatsGridStyle}>
              <div style={statCardStyle}>
                <span style={statLabelStyle}>Jogadores da pelada ativa</span>
                <strong style={statValueStyle}>
                  {activeRound
                    ? activeRound.players.length
                    : pelada.arrivals.filter((arrival) => arrival.playsFirstGame)
                        .length}
                </strong>
              </div>
              {teamsByColor.map((team) => (
                <div key={team.color} style={statCardStyle}>
                  <span style={statLabelStyle}>
                    Pontuação {getPeladaTeamColorLabel(team.color)}
                  </span>
                  <strong style={statValueStyle}>{team.totalScore}</strong>
                </div>
              ))}
            </div>

            {teamAssignments.length === 0 ? (
              <div className="xv-subcard">
                <p style={subsectionDescriptionStyle}>
                  Ainda não há divisão salva. Suba uma pelada e depois clique em
                  <strong> Dividir times</strong>, ou use o atalho de subir e dividir
                  de uma vez.
                </p>
              </div>
            ) : (
              <>
                <div style={teamsGridStyle}>
                  {teamsByColor.map((team) => (
                    <div key={team.color} style={teamCardStyle}>
                      <div
                        style={{
                          ...teamHeaderStyle,
                          background:
                            team.color === "AMARELO" ? "#FCF7E6" : "#18181B",
                          color:
                            team.color === "AMARELO" ? "#8B6914" : "#FFFFFF",
                          borderColor:
                            team.color === "AMARELO" ? "#F1D68A" : "#3F3F46",
                        }}
                      >
                        <div>
                          <h3 style={teamTitleStyle}>
                            Time {getPeladaTeamColorLabel(team.color)}
                          </h3>
                          <p style={teamMetaStyle}>
                            {team.assignments.length} jogadores
                          </p>
                        </div>
                        <strong style={teamScoreStyle}>{team.totalScore} pts</strong>
                      </div>

                      <div className="xv-table-scroll">
                        <table style={teamTableStyle}>
                          <thead>
                            <tr>
                              <th style={teamThStyle}>Jogador</th>
                              <th style={teamThStyle}>Posição</th>
                              <th style={teamThStyle}>Nível</th>
                              <th style={teamThStyle}>Função</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.assignments.map((assignment) => (
                              <tr key={assignment.id}>
                                <td style={teamTdStyle}>
                                  {assignment.arrival.fullName}
                                </td>
                                <td style={teamTdStyle}>
                                  {getPositionLabel(
                                    assignment.arrival.preferredPosition,
                                  )}
                                </td>
                                <td style={teamTdStyle}>
                                  {getPlayerLevelLabel(assignment.arrival.level)}
                                </td>
                                <td style={teamTdStyle}>
                                  {getPositionLabel(
                                    assignment.assignedPosition ||
                                      assignment.arrival.preferredPosition,
                                  )}
                                  {assignment.isFallback ? " • Adaptação" : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="xv-subcard">
                  <h3 style={subsectionTitleStyle}>Trocar jogadores</h3>
                  <p style={subsectionDescriptionStyle}>
                    Escolha um jogador do time Amarelo e outro do time Preto para
                    ajustar a pelada manualmente.
                  </p>

                  <form action={swapPeladaTeamPlayers} style={swapFormStyle}>
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />

                    <div style={swapGridStyle}>
                      <div style={swapFieldStyle}>
                        <label style={swapLabelStyle}>Jogador do time Amarelo</label>
                        <select
                          name="yellowAssignmentId"
                          defaultValue=""
                          required
                          style={swapInputStyle}
                        >
                          <option value="" disabled>
                            Selecione
                          </option>
                          {teamsByColor
                            .find((team) => team.color === "AMARELO")
                            ?.assignments.map((assignment) => (
                              <option key={assignment.id} value={assignment.id}>
                                {assignment.arrival.fullName} [
                                {getPlayerLevelLabel(assignment.arrival.level)}] -{" "}
                                {getPositionLabel(assignment.arrival.preferredPosition)}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div style={swapFieldStyle}>
                        <label style={swapLabelStyle}>Jogador do time Preto</label>
                        <select
                          name="blackAssignmentId"
                          defaultValue=""
                          required
                          style={swapInputStyle}
                        >
                          <option value="" disabled>
                            Selecione
                          </option>
                          {teamsByColor
                            .find((team) => team.color === "PRETO")
                            ?.assignments.map((assignment) => (
                              <option key={assignment.id} value={assignment.id}>
                                {assignment.arrival.fullName} [
                                {getPlayerLevelLabel(assignment.arrival.level)}] -{" "}
                                {getPositionLabel(assignment.arrival.preferredPosition)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" style={primaryActionButtonStyle}>
                      Trocar jogadores
                    </button>
                  </form>
                </div>
              </>
            )}
          </section>
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

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const divisionSectionStyle: React.CSSProperties = {
  marginTop: 18,
};

const sectionHeaderWithActionStyle: React.CSSProperties = {
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const headerActionsWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 24,
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
};

const dangerCardStyle: React.CSSProperties = {
  borderRadius: 14,
  background: "#FFF7ED",
  border: "1px solid #FDBA74",
  padding: 18,
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const dangerTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#9A3412",
  marginBottom: 6,
};

const dangerTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#9A3412",
  lineHeight: 1.6,
  maxWidth: 760,
};

const dangerButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "11px 16px",
  fontWeight: 800,
  fontSize: 14,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#B91C1C",
  cursor: "pointer",
};

const compactStatsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 12,
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  padding: 16,
  display: "grid",
  gap: 4,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#8B6914",
  fontWeight: 700,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 28,
  color: "#101010",
};

const statValueStyleSmall: React.CSSProperties = {
  fontSize: 18,
  color: "#101010",
  lineHeight: 1.4,
};

const subsectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  color: "#101010",
};

const subsectionDescriptionStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#4B5563",
  lineHeight: 1.6,
};

const sheetGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginBottom: 18,
  alignItems: "start",
};

const sheetPlaceholderStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #B6B6B6",
  background: "#FFFFFF",
  minHeight: 180,
  padding: 18,
  display: "grid",
  alignContent: "start",
  gap: 8,
};

const sheetPlaceholderTitleStyle: React.CSSProperties = {
  fontSize: 18,
  color: "#101010",
};

const sheetPlaceholderTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#5B6472",
  lineHeight: 1.6,
};

const inlineMutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#6B7280",
  borderBottom: "1px solid #E5E7EB",
  background: "#FAFAFA",
};

const tdStyle: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #F3F4F6",
  color: "#101010",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: "20px 16px",
  textAlign: "center",
  color: "#6B7280",
};

const inlineFormStyle: React.CSSProperties = {
  margin: 0,
  display: "inline-flex",
};

const primaryActionButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 14,
  padding: "11px 16px",
  cursor: "pointer",
};

const secondaryActionButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 800,
  fontSize: 14,
  padding: "11px 16px",
  cursor: "pointer",
  border: "1px solid #D1D5DB",
};

const miniPrimaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 13,
  padding: "9px 12px",
  cursor: "pointer",
};

const teamsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const teamCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  overflow: "hidden",
  background: "#FFFFFF",
};

const teamHeaderStyle: React.CSSProperties = {
  padding: "16px 18px",
  borderBottom: "1px solid",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const teamTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
};

const teamMetaStyle: React.CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.85,
  fontWeight: 600,
};

const teamScoreStyle: React.CSSProperties = {
  fontSize: 24,
  lineHeight: 1,
};

const teamTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  borderTop: "1px solid #D1D5DB",
};

const teamThStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "#EFEFEF",
  color: "#374151",
  fontSize: 12,
  fontWeight: 800,
  textAlign: "left",
  border: "1px solid #D1D5DB",
};

const teamTdStyle: React.CSSProperties = {
  padding: "9px 10px",
  border: "1px solid #D1D5DB",
  fontSize: 14,
  color: "#111827",
};

const swapFormStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const swapGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
};

const swapFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const swapLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#101010",
};

const swapInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};
