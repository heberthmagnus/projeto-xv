import { getFirstGamePlayersLimit, getPlayerLevelLabel, getPositionLabel } from "@/lib/peladas";
import { getAdminPeladaChegadaPath } from "@/lib/routes";
import { ArrivalAdminForm } from "../../arrival-admin-form";
import {
  createManualPeladaArrival,
  defineFirstGame,
  deletePeladaArrival,
  registerArrivalFromConfirmation,
  updatePeladaArrival,
} from "../../actions";
import {
  formatPeladaDateTime,
  loadPeladaAdminData,
} from "../pelada-admin-data";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function PeladaChegadaPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pelada = await loadPeladaAdminData(id);
  const returnTo = getAdminPeladaChegadaPath(pelada.id);
  const confirmationArrivalEntries = pelada.confirmations.flatMap((confirmation) => [
    confirmation,
    ...confirmation.guests,
  ]);

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {resolvedSearchParams.success && (
          <div style={successBannerStyle}>
            {resolvedSearchParams.success === "arrival-add" &&
              "✅ Chegada registrada com sucesso."}
            {resolvedSearchParams.success === "arrival-update" &&
              "✅ Chegada atualizada com sucesso."}
            {resolvedSearchParams.success === "arrival-delete" &&
              "✅ Chegada excluída com sucesso."}
            {resolvedSearchParams.success === "first-game-draw" &&
              "✅ Sorteio da primeira pelada realizado com sucesso."}
            {resolvedSearchParams.success === "first-game-order" &&
              "✅ Primeira pelada definida pela ordem de chegada."}
          </div>
        )}

        {resolvedSearchParams.error && (
          <div style={errorBannerStyle}>{resolvedSearchParams.error}</div>
        )}

        <section className="xv-card">
          <div style={sectionHeaderWithActionStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Chegada no dia</h2>
              <p style={sectionDescriptionStyle}>
                Registre quem apareceu, controle a ordem de chegada e ajuste o
                nível do jogador para melhorar a divisão futura.
              </p>
            </div>

            <form action={defineFirstGame}>
              <input type="hidden" name="peladaId" value={pelada.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" style={primaryActionButtonStyle}>
                {pelada.firstGameRule === "SORTEIO"
                  ? "Sortear primeira pelada"
                  : "Definir primeira pela ordem"}
              </button>
            </form>
          </div>

          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Chegadas</span>
              <strong style={statValueStyle}>{pelada.arrivals.length}</strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Primeira</span>
              <strong style={statValueStyle}>
                {pelada.arrivals.filter((arrival) => arrival.playsFirstGame).length}
              </strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Segunda</span>
              <strong style={statValueStyle}>
                {pelada.arrivals.filter((arrival) => arrival.playsSecondGame).length}
              </strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Limite da primeira</span>
              <strong style={statValueStyle}>
                {getFirstGamePlayersLimit(pelada)}
              </strong>
            </div>
          </div>

          <div className="xv-subcard">
            <h3 style={subsectionTitleStyle}>Registrar chegada dos confirmados</h3>
            <p style={subsectionDescriptionStyle}>
              Marque rapidamente quem confirmou antes e realmente chegou para jogar.
            </p>

            <div style={chipsWrapStyle}>
              {confirmationArrivalEntries.length === 0 ? (
                <p style={inlineMutedStyle}>Nenhum confirmado disponível.</p>
              ) : (
                confirmationArrivalEntries.map((confirmation) => {
                  const alreadyArrived = confirmation.arrivals.length > 0;

                  return (
                    <form
                      key={confirmation.id}
                      action={registerArrivalFromConfirmation}
                      style={chipFormStyle}
                    >
                      <input type="hidden" name="peladaId" value={pelada.id} />
                      <input type="hidden" name="confirmationId" value={confirmation.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        disabled={alreadyArrived}
                        style={{
                          ...chipButtonStyle,
                          opacity: alreadyArrived ? 0.55 : 1,
                          cursor: alreadyArrived ? "default" : "pointer",
                        }}
                      >
                        {alreadyArrived
                          ? `${confirmation.fullName} • já chegou`
                          : `Registrar chegada • ${confirmation.fullName}`}
                      </button>
                    </form>
                  );
                })
              )}
            </div>
          </div>

          <div className="xv-subcard">
            <h3 style={subsectionTitleStyle}>Registrar chegada manual</h3>
            <p style={subsectionDescriptionStyle}>
              Inclua aqui quem apareceu no dia mesmo sem confirmar antes.
            </p>

            <ArrivalAdminForm
              peladaId={pelada.id}
              action={createManualPeladaArrival}
              submitLabel="Registrar chegada"
              returnTo={returnTo}
              initialValues={{
                fullName: "",
                isGuest: false,
                guestInvitedBy: "",
                preferredPosition: "",
                age: "",
                arrivalOrder:
                  (pelada.arrivals.length
                    ? Math.max(...pelada.arrivals.map((arrival) => arrival.arrivalOrder))
                    : 0) + 1,
                arrivedAt: new Date(),
                level: "",
                playsFirstGame: false,
                playsSecondGame: false,
              }}
            />
          </div>

          <div className="xv-table-scroll">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Ordem</th>
                  <th style={thStyle}>Chegada</th>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Posição</th>
                  <th style={thStyle}>Idade</th>
                  <th style={thStyle}>Nível</th>
                  <th style={thStyle}>Primeira</th>
                  <th style={thStyle}>Segunda</th>
                  <th style={thStyle}>Origem</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pelada.arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={emptyStyle}>
                      Nenhuma chegada registrada ainda.
                    </td>
                  </tr>
                ) : (
                  pelada.arrivals.map((arrival) => (
                    <tr key={arrival.id}>
                      <td style={tdStyle}>{arrival.arrivalOrder}</td>
                      <td style={tdStyle}>{formatPeladaDateTime(arrival.arrivedAt)}</td>
                      <td style={tdStyle}>{arrival.fullName}</td>
                      <td style={tdStyle}>
                        {arrival.isGuest
                          ? arrival.guestInvitedBy
                            ? `Convidado de ${arrival.guestInvitedBy}`
                            : "Convidado avulso"
                          : "Sócio"}
                      </td>
                      <td style={tdStyle}>
                        {getPositionLabel(arrival.preferredPosition)}
                      </td>
                      <td style={tdStyle}>{arrival.age ?? "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {getPlayerLevelLabel(arrival.level)}
                      </td>
                      <td style={tdStyle}>{arrival.playsFirstGame ? "Sim" : "Não"}</td>
                      <td style={tdStyle}>{arrival.playsSecondGame ? "Sim" : "Não"}</td>
                      <td style={tdStyle}>
                        {arrival.confirmation
                          ? arrival.confirmation.createdByAdmin
                            ? "Confirmado pelo admin"
                            : "Confirmado no público"
                          : "Chegada manual"}
                      </td>
                      <td style={tdStyle}>
                        <div style={rowActionsStyle}>
                          <details style={detailsStyle}>
                            <summary style={summaryStyle}>Editar</summary>
                            <div style={editPanelStyle}>
                              <ArrivalAdminForm
                                peladaId={pelada.id}
                                action={updatePeladaArrival}
                                submitLabel="Salvar chegada"
                                returnTo={returnTo}
                                initialValues={{
                                  arrivalId: arrival.id,
                                  fullName: arrival.fullName,
                                  isGuest: arrival.isGuest,
                                  guestInvitedBy: arrival.guestInvitedBy || "",
                                  preferredPosition: arrival.preferredPosition,
                                  age: arrival.age ?? "",
                                  arrivalOrder: arrival.arrivalOrder,
                                  arrivedAt: arrival.arrivedAt,
                                  level: arrival.level,
                                  playsFirstGame: arrival.playsFirstGame,
                                  playsSecondGame: arrival.playsSecondGame,
                                }}
                              />
                            </div>
                          </details>

                          <form action={deletePeladaArrival}>
                            <input type="hidden" name="peladaId" value={pelada.id} />
                            <input type="hidden" name="arrivalId" value={arrival.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <button type="submit" style={deleteButtonStyle}>
                              Excluir
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

const sectionHeaderWithActionStyle: React.CSSProperties = {
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
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

const statsGridStyle: React.CSSProperties = {
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

const chipsWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const inlineMutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
};

const chipFormStyle: React.CSSProperties = {
  margin: 0,
};

const chipButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  padding: "10px 14px",
  fontWeight: 700,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 1180,
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

const rowActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};

const detailsStyle: React.CSSProperties = {
  minWidth: 260,
};

const summaryStyle: React.CSSProperties = {
  listStyle: "none",
  cursor: "pointer",
  display: "inline-flex",
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
};

const editPanelStyle: React.CSSProperties = {
  marginTop: 12,
  minWidth: 320,
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  padding: 14,
};

const deleteButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#B91C1C",
  cursor: "pointer",
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
