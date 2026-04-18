import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGoalkeeperSideLabel,
  getPositionLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { ADMIN_PELADAS_PATH } from "@/lib/routes";
import { ConfirmationAdminForm } from "../confirmation-admin-form";
import { PeladaForm } from "../pelada-form";
import { buildPeladaFormValues } from "../pelada-form-values";
import {
  createAdminPeladaConfirmation,
  deleteAdminPeladaConfirmation,
  updateAdminPeladaConfirmation,
  updatePelada,
} from "../actions";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function EditarPeladaPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const pelada = await prisma.pelada.findUnique({
    where: { id },
    include: {
      confirmations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pelada) {
    notFound();
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {resolvedSearchParams.success && (
          <div style={successBannerStyle}>
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

        <Link href={ADMIN_PELADAS_PATH} style={backLinkStyle}>
          ← Voltar para peladas
        </Link>

        <div style={utilityCardStyle}>
          <div>
            <p style={utilityEyebrowStyle}>Link público</p>
            <a href={`/peladas/${pelada.id}`} style={publicLinkStyle}>
              {`/peladas/${pelada.id}`}
            </a>
          </div>
          <p style={utilityTextStyle}>
            Compartilhe este link para que os jogadores confirmem presença e a
            quantidade de convidados.
          </p>
        </div>

        <PeladaForm
          title="Editar pelada"
          description="Ajuste as regras iniciais, o tipo e o status da pelada sem perder o padrão definido para o dia."
          submitLabel="Salvar alterações"
          action={updatePelada}
          initialValues={buildPeladaFormValues({
            id: pelada.id,
            scheduledAt: pelada.scheduledAt,
            type: pelada.type,
            firstGameRule: pelada.firstGameRule,
            arrivalCutoffTime: pelada.arrivalCutoffTime,
            maxFirstGamePlayers: pelada.maxFirstGamePlayers,
            linePlayersCount: pelada.linePlayersCount,
            status: pelada.status,
            notes: pelada.notes,
          })}
        />

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Confirmados para a pelada</h2>
              <p style={sectionDescriptionStyle}>
                Total de confirmados: <strong>{pelada.confirmations.length}</strong>
              </p>
            </div>
          </div>

          <div style={subsectionCardStyle}>
            <h3 style={subsectionTitleStyle}>Adicionar confirmado manualmente</h3>
            <p style={subsectionDescriptionStyle}>
              Use este formulário para consolidar quem confirmou por fora, como
              WhatsApp ou conversa no clube.
            </p>

            <ConfirmationAdminForm
              peladaId={pelada.id}
              action={createAdminPeladaConfirmation}
              submitLabel="Adicionar confirmado"
            />
          </div>

          <div style={tableWrapperStyle}>
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
                    <tr key={confirmation.id}>
                      <td style={tdStyle}>{confirmation.fullName}</td>
                      <td style={tdStyle}>{getPositionLabel(confirmation.preferredPosition)}</td>
                      <td style={tdStyle}>{confirmation.age}</td>
                      <td style={tdStyle}>{confirmation.guestCount}</td>
                      <td style={tdStyle}>
                        {getGoalkeeperSideLabel(confirmation.goalkeeperSide)}
                      </td>
                      <td style={tdStyle}>
                        {confirmation.createdByAdmin ? "Admin" : "Formulário público"}
                      </td>
                      <td style={tdStyle}>
                        {formatDateTime(confirmation.createdAt)}
                      </td>
                      <td style={tdStyle}>
                        <div style={rowActionsStyle}>
                          <details style={detailsStyle}>
                            <summary style={summaryStyle}>Editar</summary>
                            <div style={editPanelStyle}>
                              <ConfirmationAdminForm
                                peladaId={pelada.id}
                                action={updateAdminPeladaConfirmation}
                                submitLabel="Salvar confirmado"
                                initialValues={{
                                  confirmationId: confirmation.id,
                                  fullName: confirmation.fullName,
                                  preferredPosition: confirmation.preferredPosition,
                                  age: confirmation.age,
                                  guestCount: confirmation.guestCount,
                                  goalkeeperSide: confirmation.goalkeeperSide || "",
                                }}
                              />
                            </div>
                          </details>

                          <form action={deleteAdminPeladaConfirmation}>
                            <input type="hidden" name="peladaId" value={pelada.id} />
                            <input
                              type="hidden"
                              name="confirmationId"
                              value={confirmation.id}
                            />
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const pageStyle: React.CSSProperties = {
  background: "#F0F0F0",
  padding: "16px 12px 40px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

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

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "#8B6914",
  fontWeight: 700,
  textDecoration: "none",
};

const utilityCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 20,
  display: "grid",
  gap: 8,
};

const utilityEyebrowStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 12,
  fontWeight: 700,
  color: "#8B6914",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const publicLinkStyle: React.CSSProperties = {
  color: "#101010",
  fontWeight: 800,
  textDecoration: "none",
  wordBreak: "break-all",
};

const utilityTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
};

const sectionStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 24,
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
};

const subsectionCardStyle: React.CSSProperties = {
  borderRadius: 14,
  background: "#FAFAFA",
  border: "1px solid #E5E7EB",
  padding: 18,
  marginBottom: 18,
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

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 24,
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
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
