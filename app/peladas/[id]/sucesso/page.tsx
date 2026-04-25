import Link from "next/link";
import { CopyCancelLinkButton } from "./copy-cancel-link-button";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  token?: string;
}>;

export default async function PeladaConfirmationSuccessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const cancelPath = token
    ? `/peladas/${id}/cancelar?token=${encodeURIComponent(token)}`
    : null;

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>✓</div>
        <h1 style={titleStyle}>Confirmação enviada</h1>
        <p style={descriptionStyle}>
          Confirmação realizada. Para cancelar, use este link.
        </p>

        {cancelPath ? (
          <div style={cancelBoxStyle}>
            <Link href={cancelPath} style={cancelLinkStyle}>
              {cancelPath}
            </Link>
            <CopyCancelLinkButton cancelPath={cancelPath} />
          </div>
        ) : null}

        <div style={actionsStyle}>
          <Link href={`/peladas/${id}`} style={primaryLinkStyle}>
            Voltar para a pelada
          </Link>

          <Link href="/" style={secondaryLinkStyle}>
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "calc(100vh - 280px)",
  background: "linear-gradient(180deg, #f7f2e9 0%, #f4eee5 100%)",
  padding: "24px 16px 48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "#FFFFFF",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
  padding: 32,
  textAlign: "center",
};

const iconStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  margin: "0 auto 18px",
  display: "grid",
  placeItems: "center",
  background: "#ECFDF3",
  color: "#047857",
  fontSize: 30,
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 30,
  color: "#101010",
};

const descriptionStyle: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: 420,
  color: "#4B5563",
  lineHeight: 1.7,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
};

const cancelBoxStyle: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gap: 12,
  justifyItems: "center",
};

const cancelLinkStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#F9FAFB",
  color: "#3450A1",
  fontSize: 14,
  lineHeight: 1.5,
  textDecoration: "none",
  wordBreak: "break-all",
};

const baseLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 700,
};

const primaryLinkStyle: React.CSSProperties = {
  ...baseLinkStyle,
  background: "#B89020",
  color: "#FFFFFF",
};

const secondaryLinkStyle: React.CSSProperties = {
  ...baseLinkStyle,
  background: "#FFFFFF",
  color: "#101010",
  border: "1px solid #D1D5DB",
};
