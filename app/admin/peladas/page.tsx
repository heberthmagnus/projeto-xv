import Link from "next/link";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getFirstGameRuleLabel,
  getPeladaStatusLabel,
  getPeladaTypeLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { ADMIN_PELADAS_PATH } from "@/lib/routes";
import { createPelada, deletePelada, updatePelada } from "./actions";
import { PeladaForm } from "./pelada-form";
import { buildPeladaFormValues } from "./pelada-form-values";

type SearchParams = Promise<{
  success?: string;
  edit?: string;
}>;

export default async function PeladasAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const adminUser = await getAuthenticatedAdmin();

  const peladas = await prisma.pelada.findMany({
    include: {
      _count: {
        select: {
          confirmations: true,
          arrivals: true,
        },
      },
    },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
  });
  const editingPelada = peladas.find((pelada) => pelada.id === params.edit) || null;

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {params.success && (
          <div style={successBannerStyle}>
            {params.success === "create" && "✅ Pelada criada com sucesso."}
            {params.success === "update" && "✅ Pelada atualizada com sucesso."}
            {params.success === "delete" && "✅ Pelada excluída com sucesso."}
          </div>
        )}

        <PeladaForm
          title="Criar pelada"
          description="Cadastre manualmente cada pelada para controlar data, horário, tipo e regras iniciais do dia."
          submitLabel="Salvar pelada"
          action={createPelada}
        />

        {editingPelada && (
          <div className="xv-card">
            <div style={editingHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Editar informações da pelada</h2>
                <p style={sectionDescriptionStyle}>
                  Ajuste data, horário, status e regras da pelada mesmo depois da criação.
                </p>
              </div>

              <Link href={ADMIN_PELADAS_PATH} style={cancelEditLinkStyle}>
                Cancelar edição
              </Link>
            </div>

            <PeladaForm
              title={`Pelada de ${formatDate(editingPelada.scheduledAt)}`}
              description="Atualize os dados principais da pelada e salve novamente."
              submitLabel="Salvar alterações"
              action={updatePelada}
              initialValues={buildPeladaFormValues(editingPelada)}
            />
          </div>
        )}

        <section className="xv-card">
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Peladas cadastradas</h2>
              <p style={sectionDescriptionStyle}>
                Total de peladas: <strong>{peladas.length}</strong>
                {adminUser && (
                  <>
                    {" "}
                    • logado como <strong>{adminUser.email}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="xv-table-scroll">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Horário</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Regra da primeira</th>
                  <th style={thStyle}>Horário limite</th>
                  <th style={thStyle}>Limite da primeira</th>
                  <th style={thStyle}>Formação</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Confirmações</th>
                  <th style={thStyle}>Chegadas</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {peladas.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={emptyStyle}>
                      Nenhuma pelada cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  peladas.map((pelada) => (
                    <tr key={pelada.id}>
                      <td style={tdStyle}>
                        {formatDate(pelada.scheduledAt)}
                      </td>
                      <td style={tdStyle}>
                        {formatTime(pelada.scheduledAt)}
                      </td>
                      <td style={tdStyle}>{getPeladaTypeLabel(pelada.type)}</td>
                      <td style={tdStyle}>
                        {getFirstGameRuleLabel(pelada.firstGameRule)}
                      </td>
                      <td style={tdStyle}>{pelada.arrivalCutoffTime || "—"}</td>
                      <td style={tdStyle}>
                        {pelada.maxFirstGamePlayers ?? "—"}
                      </td>
                      <td style={tdStyle}>{pelada.linePlayersCount} de linha</td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(pelada.status)}>
                          {getPeladaStatusLabel(pelada.status)}
                        </span>
                      </td>
                      <td style={tdStyle}>{pelada._count.confirmations}</td>
                      <td style={tdStyle}>{pelada._count.arrivals}</td>
                      <td style={tdStyle}>
                        <div style={actionsStyle}>
                          <Link
                            href={`/admin/peladas/${pelada.id}`}
                            style={editLinkStyle}
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`${ADMIN_PELADAS_PATH}?edit=${pelada.id}`}
                            style={editSecondaryLinkStyle}
                          >
                            Editar dados
                          </Link>

                          <form action={deletePelada}>
                            <input type="hidden" name="id" value={pelada.id} />
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getStatusBadgeStyle(
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA",
): React.CSSProperties {
  if (status === "FINALIZADA") {
    return {
      ...statusBadgeBaseStyle,
      background: "#ECFDF3",
      border: "1px solid #A7F3D0",
      color: "#047857",
    };
  }

  if (status === "CANCELADA") {
    return {
      ...statusBadgeBaseStyle,
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      color: "#B91C1C",
    };
  }

  if (status === "EM_ANDAMENTO") {
    return {
      ...statusBadgeBaseStyle,
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      color: "#A16207",
    };
  }

  return {
    ...statusBadgeBaseStyle,
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#1D4ED8",
  };
}

const successBannerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "#ECFDF3",
  color: "#047857",
  fontWeight: 700,
  border: "1px solid #A7F3D0",
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
};

const editingHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
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
  lineHeight: 1.6,
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

const statusBadgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const actionButtonBaseStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 14,
};

const editLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
};

const editSecondaryLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D6B14B",
  background: "#FFF8E8",
  color: "#8B6914",
};

const cancelEditLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
};

const deleteButtonStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#B91C1C",
  cursor: "pointer",
};
