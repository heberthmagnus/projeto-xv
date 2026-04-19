import { getPeladaTypeLabel } from "@/lib/peladas";
import { loadPeladaAdminData } from "./pelada-admin-data";
import { PeladaSubnav } from "./pelada-subnav";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function PeladaDetailLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const pelada = await loadPeladaAdminData(id);

  return (
    <>
      <div style={wrapperStyle}>
        <div style={containerStyle}>
          <p style={eyebrowStyle}>Pelada</p>
          <h1 style={titleStyle}>
            {getPeladaTypeLabel(pelada.type)} •{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(pelada.scheduledAt)}
          </h1>
        </div>
      </div>

      <PeladaSubnav peladaId={pelada.id} />
      {children}
    </>
  );
}

const wrapperStyle: React.CSSProperties = {
  background: "#F0F0F0",
  padding: "16px 12px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
  background: "#FFFFFF",
  borderRadius: 16,
  padding: "18px 20px",
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 12,
  fontWeight: 700,
  color: "#B89020",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "#101010",
};
