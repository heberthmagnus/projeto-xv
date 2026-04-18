import Link from "next/link";

type Params = Promise<{
  id: string;
}>;

export default async function PeladaConfirmationSuccessPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>✓</div>
        <h1 style={titleStyle}>Confirmação enviada</h1>
        <p style={descriptionStyle}>
          Sua resposta foi registrada com sucesso. Se precisar corrigir alguma
          informação, fale com a organização da pelada.
        </p>

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
