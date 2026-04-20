import { AuthDatabaseUnavailableError, requireAdmin } from "@/lib/auth";
import { AdminSectionsNavigation } from "./admin-sections-navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthDatabaseUnavailableError) {
      return (
        <main className="xv-page-shell">
          <div className="xv-page-container">
            <section className="xv-card" style={noticeCardStyle}>
              <div style={noticeBadgeStyle}>Admin temporariamente indisponível</div>
              <h1 style={noticeTitleStyle}>Não foi possível conectar ao banco agora</h1>
              <p style={noticeTextStyle}>
                O Supabase parece estar indisponível neste momento. A área
                administrativa volta a funcionar assim que a conexão com o banco
                for restabelecida.
              </p>
              <p style={noticeHelpStyle}>
                Tente recarregar em alguns instantes. Se o problema continuar,
                confira a conectividade da instância do banco.
              </p>
            </section>
          </div>
        </main>
      );
    }

    throw error;
  }

  return (
    <>
      <AdminSectionsNavigation />
      {children}
    </>
  );
}

const noticeCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  maxWidth: 760,
};

const noticeBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#FFF7ED",
  color: "#9A3412",
  border: "1px solid #FDBA74",
  fontWeight: 700,
  fontSize: 14,
};

const noticeTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.1,
  color: "#101010",
};

const noticeTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#374151",
  lineHeight: 1.7,
  fontSize: 17,
};

const noticeHelpStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  lineHeight: 1.7,
};
