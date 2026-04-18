import Image from "next/image";
import {
  PaymentStatus,
  PlayerLevel,
  PreferredPosition,
} from "@prisma/client";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationRow } from "./registration-row";

type SearchParams = Promise<{
  success?: string;
  open?: string;
  error?: string;
  q?: string;
  position?: string;
  level?: string;
  payment?: string;
}>;

export default async function InscricoesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const adminUser = await getAuthenticatedAdmin();

  const q = String(params.q || "").trim();
  const position = String(params.position || "").trim();
  const level = String(params.level || "").trim();
  const payment = String(params.payment || "").trim();
  const error = String(params.error || "").trim();

  const championship = await prisma.championship.findUnique({
    where: { slug: "tio-hugo-2026" },
    select: { id: true, name: true },
  });

  if (!championship) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Campeonato não encontrado</h1>
        </div>
      </main>
    );
  }

  const registrations = await prisma.registration.findMany({
    where: {
      championshipId: championship.id,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { nickname: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(position
        ? { preferredPosition: position as PreferredPosition }
        : {}),
      ...(level ? { level: level as PlayerLevel } : {}),
      ...(payment ? { paymentStatus: payment as PaymentStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerCardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Image
                src="/logo-clube-xv.png"
                alt="Logo Quinze Veranistas"
                width={70}
                height={70}
              />

              <div>
                <h1 style={titleStyle}>Inscrições — {championship.name}</h1>
                <p style={subtitleStyle}>
                  Total de inscritos: <strong>{registrations.length}</strong>
                </p>
                {adminUser && (
                  <p style={{ ...subtitleStyle, marginTop: 6 }}>
                    Logado como <strong>{adminUser.email}</strong>
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href="/admin/tio-hugo-2026/inscricoes/export"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#B89020",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Exportar CSV
              </a>
            </div>
          </div>
        </div>

        {params.success && (
          <div style={successBannerStyle}>
            {params.success === "level" && "✅ Nível atualizado com sucesso."}
            {params.success === "edit" &&
              "✅ Inscrição atualizada com sucesso."}
            {params.success === "delete" &&
              "✅ Inscrição excluída com sucesso."}
            {params.success === "payment" &&
              "✅ Pagamento atualizado com sucesso."}
            {params.success === "quick-save" &&
              "✅ Inscrição atualizada com sucesso."}
          </div>
        )}

        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={filterCardStyle}>
          <form method="GET" style={filterFormStyle}>
            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>
                Buscar por nome/apelido/e-mail/telefone
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Digite para buscar"
                style={inputStyle}
              />
            </div>

            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Posição</label>
              <select
                name="position"
                defaultValue={position}
                style={inputStyle}
              >
                <option value="">Todas</option>
                <option value="GOLEIRO">Goleiro</option>
                <option value="LATERAL">Lateral</option>
                <option value="ZAGUEIRO">Zagueiro</option>
                <option value="VOLANTE">Volante</option>
                <option value="MEIA">Meia</option>
                <option value="ATACANTE">Atacante</option>
              </select>
            </div>

            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Nível</label>
              <select name="level" defaultValue={level} style={inputStyle}>
                <option value="">Todos</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Pagamento</label>
              <select name="payment" defaultValue={payment} style={inputStyle}>
                <option value="">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
              </select>
            </div>

            <div style={filterActionsStyle}>
              <button type="submit" style={filterButtonStyle}>
                Filtrar
              </button>

              <a
                href="/admin/tio-hugo-2026/inscricoes"
                style={clearButtonStyle}
              >
                Limpar
              </a>
            </div>
          </form>
        </div>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thStyle, ...nameHeaderStyle }}>Nome</th>
                <th style={{ ...thStyle, ...nicknameHeaderStyle }}>Apelido</th>
                <th style={{ ...thStyle, ...positionHeaderStyle }}>Posição</th>
                <th style={{ ...thStyle, ...dateHeaderStyle }}>Nascimento</th>
                <th style={{ ...thStyle, ...phoneHeaderStyle }}>Telefone</th>
                <th style={{ ...thStyle, ...emailHeaderStyle }}>E-mail</th>
                <th style={{ ...thStyle, ...levelHeaderStyle }}>Nível</th>
                <th style={{ ...thStyle, ...paymentHeaderStyle }}>
                  Pagamento
                </th>
                <th style={{ ...thStyle, ...dateHeaderStyle }}>Inscrição</th>
                <th style={{ ...thStyle, ...actionsHeaderStyle }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={10} style={emptyStyle}>
                    Nenhuma inscrição encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <RegistrationRow
                    key={registration.id}
                    registration={registration}
                    initialOpen={params.open === registration.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F0F0F0",
  padding: "24px 12px 32px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
};

const headerCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: "22px 24px",
  marginBottom: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  border: "1px solid #E5E7EB",
};

const filterCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: "18px 20px",
  marginBottom: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  border: "1px solid #E5E7EB",
};

const errorBannerStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: "14px 16px",
  borderRadius: 12,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontWeight: 600,
};

const filterFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, 2.4fr) repeat(3, minmax(140px, 1fr)) auto",
  gap: 12,
  alignItems: "end",
};

const filterFieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const filterLabelStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#101010",
};

const filterActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const filterButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
};

const clearButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 600,
  textDecoration: "none",
};

const successBannerStyle: React.CSSProperties = {
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  color: "#065F46",
  borderRadius: 12,
  padding: "14px 16px",
  marginBottom: 16,
  fontWeight: 600,
};

const cardStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "0 auto",
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#101010",
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  color: "#4B5563",
  margin: 0,
};

const tableWrapperStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  border: "1px solid #E5E7EB",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1220,
  tableLayout: "fixed",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  background: "#101010",
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const nameHeaderStyle: React.CSSProperties = {
  minWidth: 220,
};

const nicknameHeaderStyle: React.CSSProperties = {
  minWidth: 110,
};

const positionHeaderStyle: React.CSSProperties = {
  minWidth: 100,
};

const dateHeaderStyle: React.CSSProperties = {
  minWidth: 105,
};

const phoneHeaderStyle: React.CSSProperties = {
  minWidth: 130,
};

const emailHeaderStyle: React.CSSProperties = {
  minWidth: 220,
};

const levelHeaderStyle: React.CSSProperties = {
  minWidth: 72,
  width: 72,
};

const paymentHeaderStyle: React.CSSProperties = {
  minWidth: 150,
};

const actionsHeaderStyle: React.CSSProperties = {
  minWidth: 170,
};

const emptyStyle: React.CSSProperties = {
  padding: "24px 16px",
  textAlign: "center",
  color: "#6B7280",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};
