import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getFirstGameRuleLabel, getPeladaStatusLabel, getPeladaTypeLabel } from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { PeladaConfirmationForm } from "./confirmation-form";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  success?: string;
  error?: string;
  warning?: string;
}>;

export default async function PeladaPublicPage({
  params,
}: {
  params: Params;
}) {
  await connection();

  const { id } = await params;

  const pelada = await prisma.pelada.findUnique({
    where: { id },
    include: {
      confirmations: {
        where: {
          parentConfirmationId: null,
          createdByAdmin: false,
          canceledAt: null,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          fullName: true,
          preferredPosition: true,
          guestCount: true,
          createdAt: true,
          guests: {
            where: {
              canceledAt: null,
            },
            orderBy: { guestOrder: "asc" },
            select: {
              id: true,
            },
          },
        },
      },
      arrivals: {
        orderBy: [{ arrivalOrder: "asc" }, { arrivedAt: "asc" }],
        select: {
          id: true,
          arrivalOrder: true,
          fullName: true,
          preferredPosition: true,
          arrivedAt: true,
          isGuest: true,
        },
      },
      _count: {
        select: {
          arrivals: true,
        },
      },
    },
  });

  if (!pelada) {
    notFound();
  }

  const allowSubmit =
    pelada.status !== "FINALIZADA" && pelada.status !== "CANCELADA";
  const totalConfirmedPlayers = pelada.confirmations.reduce(
    (sum, confirmation) => sum + 1 + confirmation.guests.length,
    0,
  );

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-narrow">
        <section style={infoCardStyle}>
          <div style={heroBadgeStyle}>Peladas do Clube Quinze Veranistas</div>
          <h1 style={titleStyle}>
            Confirmação da pelada de {formatDate(pelada.scheduledAt)}
          </h1>
          <p style={descriptionStyle}>
            Use este formulário para informar se vai à pelada, quantos convidados
            pretende levar e se vai atuar como goleiro.
          </p>

          <div style={factsGridStyle}>
            <Fact label="Horário" value={formatTime(pelada.scheduledAt)} />
            <Fact label="Tipo" value={getPeladaTypeLabel(pelada.type)} />
            <Fact
              label="Primeira pelada"
              value={getFirstGameRuleLabel(pelada.firstGameRule)}
            />
            <Fact label="Status" value={getPeladaStatusLabel(pelada.status)} />
            <Fact
              label="Horário limite"
              value={pelada.arrivalCutoffTime || "Não definido"}
            />
            <Fact
              label="Limite da primeira"
              value={
                pelada.maxFirstGamePlayers
                  ? `${pelada.maxFirstGamePlayers} jogadores`
                  : "Livre"
              }
            />
          </div>

          <div style={highlightStyle}>
            Confirmados previstos: <strong>{totalConfirmedPlayers}</strong>
            {" • "}
            Chegadas marcadas: <strong>{pelada._count.arrivals}</strong>
          </div>
        </section>

        <section style={formCardStyle}>
          <h2 style={sectionTitleStyle}>Confirmar presença</h2>
          <p style={sectionDescriptionStyle}>
            Esta etapa serve para prever quantidade de jogadores, convidados e
            goleiros antes da pelada.
          </p>

          {!allowSubmit && (
            <div style={noticeStyle}>
              Esta pelada não está aberta para novas confirmações.
            </div>
          )}

          <PeladaConfirmationForm peladaId={pelada.id} allowSubmit={allowSubmit} />
        </section>

        <section style={formCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Quem já confirmou</h2>
              <p style={sectionDescriptionStyle}>
                Lista pública compacta para todo mundo visualizar rápido no celular.
              </p>
            </div>
            <div style={countBadgeStyle}>{totalConfirmedPlayers} nomes</div>
          </div>

          {pelada.confirmations.length === 0 ? (
            <div style={emptyStateStyle}>
              Ainda não há confirmações públicas para esta pelada.
            </div>
          ) : (
            <div className="xv-table-scroll">
              <table style={publicTableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Posição</th>
                    <th style={thStyle}>Convidados</th>
                    <th style={thStyle}>Confirmação</th>
                  </tr>
                </thead>
                <tbody>
                  {pelada.confirmations.map((confirmation) => (
                    <tr key={confirmation.id}>
                      <td style={tdStrongStyle}>{confirmation.fullName}</td>
                      <td style={tdStyle}>
                        {getPublicPositionLabel(confirmation.preferredPosition)}
                      </td>
                      <td style={tdStyle}>
                        {confirmation.guestCount > 0
                          ? `+${confirmation.guestCount}`
                          : "—"}
                      </td>
                      <td style={tdStyle}>{formatCompactDateTime(confirmation.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={publicInfoNoteStyle}>
            Cada confirmação gera um link individual e seguro para cancelamento,
            sem expor seu nome a outras pessoas na lista.
          </div>
        </section>

        <section style={formCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Quem já chegou</h2>
              <p style={sectionDescriptionStyle}>
                Chegadas registradas pela organização no dia da pelada.
              </p>
            </div>
            <div style={countBadgeStyle}>{pelada.arrivals.length} chegadas</div>
          </div>

          {pelada.arrivals.length === 0 ? (
            <div style={emptyStateStyle}>
              Ainda não há chegadas registradas para esta pelada.
            </div>
          ) : (
            <div className="xv-table-scroll">
              <table style={publicTableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ordem</th>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Posição</th>
                    <th style={thStyle}>Chegada</th>
                  </tr>
                </thead>
                <tbody>
                  {pelada.arrivals.map((arrival) => (
                    <tr key={arrival.id}>
                      <td style={tdStyle}>#{arrival.arrivalOrder}</td>
                      <td style={tdStrongStyle}>
                        {arrival.fullName}
                        {arrival.isGuest ? (
                          <span style={guestHintStyle}>Convidado</span>
                        ) : null}
                      </td>
                      <td style={tdStyle}>
                        {getPublicPositionLabel(arrival.preferredPosition)}
                      </td>
                      <td style={tdStyle}>{formatCompactDateTime(arrival.arrivedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={factCardStyle}>
      <span style={factLabelStyle}>{label}</span>
      <strong style={factValueStyle}>{value}</strong>
    </div>
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

function formatCompactDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getPublicPositionLabel(position: string) {
  if (position === "GOLEIRO") {
    return "Goleiro";
  }

  if (position === "LATERAL") {
    return "Lateral";
  }

  if (position === "ZAGUEIRO") {
    return "Zagueiro";
  }

  if (position === "VOLANTE") {
    return "Volante";
  }

  if (position === "MEIA") {
    return "Meia";
  }

  if (position === "ATACANTE") {
    return "Atacante";
  }

  return position;
}

const infoCardStyle: React.CSSProperties = {
  background: "#1A1A1A",
  color: "#FFFFFF",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(184, 144, 32, 0.16)",
  color: "#F3D27A",
  fontWeight: 700,
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 32,
  lineHeight: 1.05,
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.86)",
  lineHeight: 1.6,
  fontSize: 16,
};

const factsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 20,
};

const factCardStyle: React.CSSProperties = {
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: 14,
  display: "grid",
  gap: 4,
};

const factLabelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(255,255,255,0.66)",
  fontWeight: 700,
};

const factValueStyle: React.CSSProperties = {
  fontSize: 16,
  color: "#FFFFFF",
};

const highlightStyle: React.CSSProperties = {
  marginTop: 18,
  fontSize: 15,
  color: "#F5E6B4",
};

const formCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 26,
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: "0 0 18px",
  color: "#4B5563",
  lineHeight: 1.6,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const countBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  background: "#FFF8E7",
  border: "1px solid #E7C56A",
  color: "#8B6914",
  fontSize: 13,
  fontWeight: 700,
};

const emptyStateStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: "18px 16px",
  background: "#FAFAFA",
  border: "1px solid #E5E7EB",
  color: "#4B5563",
  lineHeight: 1.6,
};

const publicTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 560,
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #E5E7EB",
  color: "#6B7280",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #F1F5F9",
  color: "#374151",
  fontSize: 14,
  lineHeight: 1.4,
  verticalAlign: "middle",
};

const tdStrongStyle: React.CSSProperties = {
  ...tdStyle,
  color: "#101010",
  fontWeight: 700,
};

const guestHintStyle: React.CSSProperties = {
  display: "inline-flex",
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#F3F4F6",
  color: "#4B5563",
  fontSize: 11,
  fontWeight: 700,
};

const publicInfoNoteStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 12,
  background: "#FAFAFA",
  border: "1px solid #E5E7EB",
  padding: "12px 14px",
  color: "#4B5563",
  fontSize: 13,
  lineHeight: 1.6,
};

const noticeStyle: React.CSSProperties = {
  marginBottom: 16,
  borderRadius: 12,
  background: "#FEF3C7",
  color: "#92400E",
  border: "1px solid #FCD34D",
  padding: 14,
  fontWeight: 600,
};
