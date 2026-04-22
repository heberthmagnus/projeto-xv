import { listAthleteProfilePrefillOptions } from "@/lib/athlete-profiles";
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
import { PeladaFeedbackBanner } from "../../pelada-feedback";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
  warning?: string;
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
  const athleteProfiles = await listAthleteProfilePrefillOptions();
  const returnTo = getAdminPeladaChegadaPath(pelada.id);
  const confirmationArrivalEntries = pelada.confirmations
    .flatMap((confirmation) => [confirmation, ...confirmation.guests])
    .map((confirmation) => ({
      ...confirmation,
      alreadyArrived: confirmation.arrivals.length > 0,
    }));
  const pendingArrivalEntries = confirmationArrivalEntries.filter(
    (confirmation) => !confirmation.alreadyArrived,
  );

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        <PeladaFeedbackBanner
          scope="chegada"
          peladaId={pelada.id}
          success={resolvedSearchParams.success}
          error={resolvedSearchParams.error}
          warning={resolvedSearchParams.warning}
        />

        <section className="xv-card">
          <div style={sectionHeaderWithActionStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Chegada no dia</h2>
              <p style={sectionDescriptionStyle}>
                Fluxo pensado para uso rápido no campo: marcar chegada primeiro,
                corrigir detalhes depois.
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

          <div className="xv-subcard" style={subcardStackStyle}>
            <div style={subsectionHeaderStyle}>
              <div>
                <h3 style={subsectionTitleStyle}>Chegada rápida</h3>
                <p style={subsectionDescriptionStyle}>
                  Mostra apenas quem ainda não chegou. Um toque registra a
                  chegada e mantém a operação andando.
                </p>
              </div>
              <div style={counterPillStyle}>
                {pendingArrivalEntries.length} pendentes
              </div>
            </div>

            {confirmationArrivalEntries.length === 0 ? (
              <p style={inlineMutedStyle}>Nenhum confirmado disponível.</p>
            ) : pendingArrivalEntries.length === 0 ? (
              <div style={emptyStateStyle}>
                Todos os confirmados disponíveis já foram marcados como chegada.
              </div>
            ) : (
              <div style={quickArrivalListStyle}>
                {pendingArrivalEntries.map((confirmation) => (
                  <form
                    key={confirmation.id}
                    action={registerArrivalFromConfirmation}
                    style={quickArrivalCardStyle}
                  >
                    <input type="hidden" name="peladaId" value={pelada.id} />
                    <input type="hidden" name="confirmationId" value={confirmation.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />

                    <div style={quickArrivalInfoStyle}>
                      <div style={quickArrivalNameStyle}>
                        {confirmation.fullName}
                      </div>
                      <div style={quickArrivalMetaStyle}>
                        <span>{getShortPositionLabel(confirmation.preferredPosition)}</span>
                        <span>
                          {getPlayerLevelLabel(
                            confirmation.level ??
                              confirmation.athleteProfile?.defaultLevel ??
                              null,
                          )}
                        </span>
                      </div>
                    </div>

                    <button type="submit" style={quickArrivalButtonStyle}>
                      Chegou
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>

          <div className="xv-subcard" style={subcardStackStyle}>
            <div style={subsectionHeaderStyle}>
              <div>
                <h3 style={subsectionTitleStyle}>Chegados hoje</h3>
                <p style={subsectionDescriptionStyle}>
                  Lista compacta já ordenada. Use esta parte para corrigir ordem,
                  nível, convidado ou qualquer detalhe do registro.
                </p>
              </div>
              <div style={counterPillStyle}>{pelada.arrivals.length} chegadas</div>
            </div>

            {pelada.arrivals.length === 0 ? (
              <div style={emptyStateStyle}>Nenhuma chegada registrada ainda.</div>
            ) : (
              <div style={arrivedListStyle}>
                {pelada.arrivals.map((arrival) => (
                  <article key={arrival.id} style={arrivedCardStyle}>
                    <div style={arrivedCardTopStyle}>
                      <div>
                        <div style={arrivedNameRowStyle}>
                          <span style={arrivalOrderBadgeStyle}>#{arrival.arrivalOrder}</span>
                          <strong style={arrivedNameStyle}>{arrival.fullName}</strong>
                        </div>
                        <div style={arrivedMetaStyle}>
                          <span>{formatPeladaDateTime(arrival.arrivedAt)}</span>
                          <span>{getShortPositionLabel(arrival.preferredPosition)}</span>
                          <span>{getPlayerLevelLabel(arrival.level)}</span>
                          <span>{getArrivalTypeLabel(arrival)}</span>
                        </div>
                      </div>

                      <div style={arrivedFlagsStyle}>
                        {arrival.playsFirstGame ? (
                          <span style={flagChipPrimaryStyle}>Primeira</span>
                        ) : null}
                        {arrival.playsSecondGame ? (
                          <span style={flagChipSecondaryStyle}>Segunda</span>
                        ) : null}
                      </div>
                    </div>

                    <div style={arrivedActionsStyle}>
                      <details style={detailsBlockStyle}>
                        <summary style={summaryStyle}>Editar</summary>
                        <div style={editPanelStyle}>
                          <ArrivalAdminForm
                            peladaId={pelada.id}
                            athleteProfiles={athleteProfiles}
                            action={updatePeladaArrival}
                            submitLabel="Salvar chegada"
                            returnTo={returnTo}
                            initialValues={{
                              arrivalId: arrival.id,
                              athleteProfileId: arrival.athleteProfile?.id,
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
                  </article>
                ))}
              </div>
            )}
          </div>

          <details className="xv-subcard" style={manualDetailsStyle}>
            <summary style={manualSummaryStyle}>
              <span>
                <strong>Chegada manual</strong>
                <span style={manualSummaryHintStyle}>
                  {" "}para convidado avulso ou quem apareceu sem confirmação
                </span>
              </span>
            </summary>

            <div style={manualPanelStyle}>
              <p style={subsectionDescriptionStyle}>
                Use só quando necessário. O fluxo principal da tela está no bloco
                de chegada rápida acima.
              </p>

              <ArrivalAdminForm
                peladaId={pelada.id}
                athleteProfiles={athleteProfiles}
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
          </details>
        </section>
      </div>
    </main>
  );
}

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

const subcardStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  marginBottom: 18,
};

const subsectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const counterPillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#374151",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 800,
};

const inlineMutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
};

const emptyStateStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px dashed #D1D5DB",
  background: "#FFFFFF",
  padding: "16px 18px",
  color: "#6B7280",
  lineHeight: 1.6,
};

const quickArrivalListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const quickArrivalCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  borderRadius: 14,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  padding: "12px 14px",
};

const quickArrivalInfoStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const quickArrivalNameStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: "#101010",
};

const quickArrivalMetaStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  fontSize: 13,
  color: "#6B7280",
  fontWeight: 700,
};

const quickArrivalButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#101010",
  color: "#FFFFFF",
  padding: "10px 14px",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  minWidth: 88,
  minHeight: 42,
};

const arrivedListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const arrivedCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 14,
};

const arrivedCardTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const arrivedNameRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const arrivalOrderBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  color: "#8B6914",
  padding: "4px 9px",
  fontSize: 12,
  fontWeight: 800,
};

const arrivedNameStyle: React.CSSProperties = {
  fontSize: 17,
  color: "#101010",
};

const arrivedMetaStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 6,
  fontSize: 13,
  color: "#6B7280",
  fontWeight: 700,
};

const arrivedFlagsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const flagChipPrimaryStyle: React.CSSProperties = {
  borderRadius: 999,
  background: "#ECFDF3",
  border: "1px solid #A7F3D0",
  color: "#047857",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
};

const flagChipSecondaryStyle: React.CSSProperties = {
  borderRadius: 999,
  background: "#EEF2FF",
  border: "1px solid #C7D2FE",
  color: "#4338CA",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
};

const arrivedActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};

const detailsBlockStyle: React.CSSProperties = {
  width: "100%",
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
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#FAFAFA",
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
  minHeight: 40,
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

const manualDetailsStyle: React.CSSProperties = {
  marginTop: 0,
};

const manualSummaryStyle: React.CSSProperties = {
  listStyle: "none",
  cursor: "pointer",
  fontSize: 16,
  color: "#101010",
};

const manualSummaryHintStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#6B7280",
};

const manualPanelStyle: React.CSSProperties = {
  marginTop: 16,
};

function getShortPositionLabel(position: string) {
  switch (position) {
    case "GOLEIRO":
      return "GOL";
    case "LATERAL":
      return "LAT";
    case "ZAGUEIRO":
      return "ZAG";
    case "VOLANTE":
      return "VOL";
    case "MEIA":
      return "MEI";
    case "ATACANTE":
      return "ATA";
    default:
      return getPositionLabel(position);
  }
}

function getArrivalTypeLabel(arrival: {
  isGuest: boolean;
  guestInvitedBy: string | null;
  confirmation: {
    createdByAdmin: boolean;
  } | null;
}) {
  if (arrival.isGuest) {
    return arrival.guestInvitedBy
      ? `Convidado de ${arrival.guestInvitedBy}`
      : "Convidado avulso";
  }

  if (!arrival.confirmation) {
    return "Chegada manual";
  }

  return arrival.confirmation.createdByAdmin
    ? "Confirmado pelo admin"
    : "Confirmado no público";
}
