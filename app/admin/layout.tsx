import {
  AuthConfigurationError,
  AuthDatabaseUnavailableError,
  isActiveMember,
  requireAdministrativeAccess,
  userHasPermission,
} from "@/lib/auth";
import { AdminSectionsNavigation } from "./admin-sections-navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let canManageSports = false;
  let canManagePlatform = false;
  let canManagePlayers = false;
  let canManageMembers = false;
  let canManageResults = false;
  let canApproveAccounts = false;
  let canAccessMemberArea = false;
  let canAccessPool = false;
  let canManagePool = false;
  try {
    const user = await requireAdministrativeAccess();
    canManageSports = userHasPermission(user, "sports.manage");
    canManagePlatform = userHasPermission(user, "permission.manage");
    canManagePlayers = userHasPermission(user, "player.manage");
    canManageMembers = userHasPermission(user, "member.read");
    canManageResults = userHasPermission(user, "match.result.manage");
    canApproveAccounts = userHasPermission(user, "member.account.approve");
    canAccessMemberArea = isActiveMember(user);
    canAccessPool = canAccessMemberArea && userHasPermission(user, "pool.read");
    canManagePool = userHasPermission(user, "pool.manage");
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

    if (error instanceof AuthConfigurationError) {
      return (
        <main className="xv-page-shell">
          <div className="xv-page-container">
            <section className="xv-card" style={noticeCardStyle}>
              <div style={configBadgeStyle}>Configuração pendente</div>
              <h1 style={noticeTitleStyle}>A autenticação administrativa não está pronta</h1>
              <p style={noticeTextStyle}>
                O ambiente de produção está sem a secret usada para assinar a
                sessão administrativa. Enquanto isso não for configurado, o login
                não consegue concluir com segurança.
              </p>
              <p style={noticeHelpStyle}>
                Defina <code>AUTH_SECRET</code> ou <code>NEXTAUTH_SECRET</code> na
                Vercel e faça um novo deploy para restabelecer o acesso.
              </p>
            </section>
          </div>
        </main>
      );
    }

    throw error;
  }

  return (
    <div className="xv-page-shell xv-admin-shell">
      <div className="flex w-full flex-col gap-4 px-3 py-3 lg:flex-row lg:items-stretch lg:px-5">
        <AdminSectionsNavigation canManageSports={canManageSports} canManagePlatform={canManagePlatform} canManagePlayers={canManagePlayers} canManageMembers={canManageMembers} canManageResults={canManageResults} canApproveAccounts={canApproveAccounts} canAccessMemberArea={canAccessMemberArea} canAccessPool={canAccessPool} canManagePool={canManagePool} />
        <div className="xv-admin-content min-w-0 flex-1">{children}</div>
      </div>
    </div>
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

const configBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#FEF2F2",
  color: "#B91C1C",
  border: "1px solid #FCA5A5",
  fontWeight: 700,
  fontSize: 14,
};
