import { Fragment } from "react";
import { getGoalkeeperSideLabel, getPositionLabel } from "@/lib/peladas";
import { getAdminPeladaConfirmadosPath } from "@/lib/routes";
import { ConfirmationAdminForm } from "../../confirmation-admin-form";
import {
  addGuestToAdminPeladaConfirmation,
  createAdminPeladaConfirmation,
  deleteAdminPeladaConfirmation,
  updateAdminPeladaConfirmation,
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

export default async function PeladaConfirmadosPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pelada = await loadPeladaAdminData(id);
  const returnTo = getAdminPeladaConfirmadosPath(pelada.id);
  const totalConfirmedPlayers = pelada.confirmations.reduce(
    (sum, confirmation) => sum + 1 + confirmation.guests.length,
    0,
  );

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {resolvedSearchParams.success && (
          <div style={successBannerStyle}>
            {resolvedSearchParams.success === "status-update" &&
              "✅ Status da pelada atualizado com sucesso."}
            {resolvedSearchParams.success === "guest-add" &&
              "✅ Convidado adicionado ao confirmado com sucesso."}
            {resolvedSearchParams.success === "confirmed-add" &&
              "✅ Confirmado adicionado com sucesso."}
            {resolvedSearchParams.success === "confirmed-update" &&
              "✅ Confirmado atualizado com sucesso."}
            {resolvedSearchParams.success === "confirmed-delete" &&
              "✅ Confirmado excluído com sucesso."}
          </div>
        )}

        {resolvedSearchParams.error && (
          <div style={errorBannerStyle}>{resolvedSearchParams.error}</div>
        )}

        <section className="xv-card">
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Confirmados para a pelada</h2>
              <p style={sectionDescriptionStyle}>
                Total de confirmados: <strong>{totalConfirmedPlayers}</strong>
              </p>
            </div>
          </div>

          <div className="xv-subcard">
            <h3 style={subsectionTitleStyle}>Adicionar confirmado manualmente</h3>
            <p style={subsectionDescriptionStyle}>
              Use este formulário para consolidar quem confirmou por fora, como
              WhatsApp ou conversa no clube.
            </p>

            <ConfirmationAdminForm
              peladaId={pelada.id}
              action={createAdminPeladaConfirmation}
              submitLabel="Adicionar confirmado"
              returnTo={returnTo}
            />
          </div>

          <div className="xv-table-scroll">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Posição</th>
                  <th style={thStyle}>Idade</th>
                  <th style={thStyle}>Convidados</th>
                  <th style={thStyle}>Goleiro</th>
                  <th style={thStyle}>Origem</th>
                  <th style={thStyle}>Registro</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pelada.confirmations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={emptyStyle}>
                      Nenhuma confirmação recebida ainda.
                    </td>
                  </tr>
                ) : (
                  pelada.confirmations.map((confirmation) => (
                    <Fragment key={confirmation.id}>
                      <tr>
                        <td style={tdStyle}>{confirmation.fullName}</td>
                        <td style={tdStyle}>
                          {getPositionLabel(confirmation.preferredPosition)}
                        </td>
                        <td style={tdStyle}>{confirmation.age ?? "—"}</td>
                        <td style={tdStyle}>{confirmation.guestCount}</td>
                        <td style={tdStyle}>
                          {getGoalkeeperSideLabel(confirmation.goalkeeperSide)}
                        </td>
                        <td style={tdStyle}>
                          {confirmation.createdByAdmin ? "Admin" : "Formulário público"}
                        </td>
                        <td style={tdStyle}>
                          {formatPeladaDateTime(confirmation.createdAt)}
                        </td>
                        <td style={tdStyle}>
                          <div style={rowActionsStyle}>
                            <form action={addGuestToAdminPeladaConfirmation}>
                              <input type="hidden" name="peladaId" value={pelada.id} />
                              <input type="hidden" name="confirmationId" value={confirmation.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <button
                                type="submit"
                                disabled={confirmation.guestCount >= 5}
                                style={{
                                  ...secondaryButtonStyle,
                                  opacity: confirmation.guestCount >= 5 ? 0.55 : 1,
                                  cursor:
                                    confirmation.guestCount >= 5 ? "default" : "pointer",
                                }}
                              >
                                Adicionar convidado
                              </button>
                            </form>

                            <details style={detailsStyle}>
                              <summary style={summaryStyle}>Editar</summary>
                              <div style={editPanelStyle}>
                                <ConfirmationAdminForm
                                  peladaId={pelada.id}
                                  action={updateAdminPeladaConfirmation}
                                  submitLabel="Salvar confirmado"
                                  returnTo={returnTo}
                                  initialValues={{
                                    confirmationId: confirmation.id,
                                    fullName: confirmation.fullName,
                                    preferredPosition:
                                      confirmation.preferredPosition,
                                    age: confirmation.age ?? "",
                                    level: confirmation.level || "",
                                    guestCount: confirmation.guestCount,
                                    goalkeeperSide:
                                      confirmation.goalkeeperSide || "",
                                  }}
                                />
                              </div>
                            </details>

                            <form action={deleteAdminPeladaConfirmation}>
                              <input type="hidden" name="peladaId" value={pelada.id} />
                              <input type="hidden" name="confirmationId" value={confirmation.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <button type="submit" style={deleteButtonStyle}>
                                Excluir
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>

                      {confirmation.guests.map((guest) => (
                        <tr key={guest.id} style={guestRowStyle}>
                          <td style={tdStyle}>
                            {guest.fullName}
                            <div style={guestHintStyle}>
                              Convidado de {confirmation.fullName}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {getPositionLabel(guest.preferredPosition)}
                          </td>
                          <td style={tdStyle}>{guest.age ?? "—"}</td>
                          <td style={tdStyle}>0</td>
                          <td style={tdStyle}>Nenhum</td>
                          <td style={tdStyle}>Convidado</td>
                          <td style={tdStyle}>{formatPeladaDateTime(guest.createdAt)}</td>
                          <td style={tdStyle}>
                            <div style={rowActionsStyle}>
                              <details style={detailsStyle}>
                                <summary style={summaryStyle}>Editar</summary>
                                <div style={editPanelStyle}>
                                  <ConfirmationAdminForm
                                    mode="guest"
                                    peladaId={pelada.id}
                                    action={updateAdminPeladaConfirmation}
                                    submitLabel="Salvar convidado"
                                    returnTo={returnTo}
                                    initialValues={{
                                      confirmationId: guest.id,
                                      fullName: guest.fullName,
                                      preferredPosition: guest.preferredPosition,
                                      age: guest.age ?? "",
                                      level: guest.level || "",
                                      guestCount: 0,
                                      goalkeeperSide: "",
                                    }}
                                  />
                                </div>
                              </details>

                              <form action={deleteAdminPeladaConfirmation}>
                                <input type="hidden" name="peladaId" value={pelada.id} />
                                <input type="hidden" name="confirmationId" value={guest.id} />
                                <input type="hidden" name="returnTo" value={returnTo} />
                                <button type="submit" style={deleteButtonStyle}>
                                  Excluir
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
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

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 1080,
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

const guestRowStyle: React.CSSProperties = {
  background: "#FFFBF2",
};

const guestHintStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#8B6914",
  fontWeight: 600,
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

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #D6B14B",
  background: "#FFF8E8",
  color: "#8B6914",
  cursor: "pointer",
};
