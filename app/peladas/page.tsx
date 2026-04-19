import Link from "next/link";
import {
  getFirstGameRuleLabel,
  getPeladaStatusLabel,
  getPeladaTypeLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";

export default async function PeladasPage() {
  const peladas = await prisma.pelada.findMany({
    where: {
      status: {
        in: ["ABERTA", "EM_ANDAMENTO"],
      },
    },
    orderBy: [{ scheduledAt: "asc" }],
    include: {
      _count: {
        select: {
          confirmations: true,
        },
      },
    },
  });

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroStyle}>
          <div style={badgeStyle}>Peladas do Clube</div>
          <h1 style={titleStyle}>Peladas abertas para confirmação</h1>
          <p style={descriptionStyle}>
            Escolha a pelada disponível e preencha sua confirmação de presença.
          </p>
        </section>

        <section style={sectionStyle}>
          {peladas.length === 0 ? (
            <div style={emptyCardStyle}>
              Nenhuma pelada aberta para confirmação no momento.
            </div>
          ) : (
            <div style={gridStyle}>
              {peladas.map((pelada) => (
                <article key={pelada.id} style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <span style={statusBadgeStyle}>
                      {getPeladaStatusLabel(pelada.status)}
                    </span>
                    <h2 style={cardTitleStyle}>
                      Pelada de {formatDate(pelada.scheduledAt)}
                    </h2>
                  </div>

                  <div style={factsStyle}>
                    <p style={factStyle}>
                      <strong>Horário:</strong> {formatTime(pelada.scheduledAt)}
                    </p>
                    <p style={factStyle}>
                      <strong>Tipo:</strong> {getPeladaTypeLabel(pelada.type)}
                    </p>
                    <p style={factStyle}>
                      <strong>Primeira:</strong>{" "}
                      {getFirstGameRuleLabel(pelada.firstGameRule)}
                    </p>
                    <p style={factStyle}>
                      <strong>Confirmados previstos:</strong> {pelada._count.confirmations}
                    </p>
                  </div>

                  <Link href={`/peladas/${pelada.id}`} style={buttonStyle}>
                    Preencher confirmação
                  </Link>
                </article>
              ))}
            </div>
          )}
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
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const pageStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #f7f2e9 0%, #f4eee5 100%)",
  padding: "24px 12px 40px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const heroStyle: React.CSSProperties = {
  background: "#1A1A1A",
  color: "#FFFFFF",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
};

const badgeStyle: React.CSSProperties = {
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
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.86)",
  lineHeight: 1.6,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
};

const emptyCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 24,
  color: "#6B7280",
  textAlign: "center",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 24,
  display: "grid",
  gap: 16,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  justifySelf: "start",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  color: "#8B6914",
  fontWeight: 700,
  fontSize: 13,
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "#101010",
};

const factsStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const factStyle: React.CSSProperties = {
  margin: 0,
  color: "#374151",
  lineHeight: 1.6,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: 10,
  background: "#B89020",
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: 700,
};
