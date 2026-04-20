import { notFound } from "next/navigation";
import { getFirstGameRuleLabel, getPeladaStatusLabel, getPeladaTypeLabel } from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { PeladaConfirmationForm } from "./confirmation-form";

type Params = Promise<{
  id: string;
}>;

export default async function PeladaPublicPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const pelada = await prisma.pelada.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          confirmations: true,
        },
      },
    },
  });

  if (!pelada) {
    notFound();
  }

  const allowSubmit =
    pelada.status !== "FINALIZADA" && pelada.status !== "CANCELADA";

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
            Confirmados previstos: <strong>{pelada._count.confirmations}</strong>
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

const noticeStyle: React.CSSProperties = {
  marginBottom: 16,
  borderRadius: 12,
  background: "#FEF3C7",
  color: "#92400E",
  border: "1px solid #FCD34D",
  padding: 14,
  fontWeight: 600,
};
