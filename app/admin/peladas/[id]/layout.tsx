import { getPeladaTypeLabel } from "@/lib/peladas";
import { loadPeladaAdminData } from "./pelada-admin-data";
import { PeladaStatusControls } from "./pelada-status-controls";
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
      <div className="xv-page-shell pb-0">
        <div className="xv-page-container">
          <div className="xv-card">
            <p style={eyebrowStyle}>Pelada</p>
            <h1 style={titleStyle}>
              {getPeladaTypeLabel(pelada.type)} •{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(pelada.scheduledAt)}
            </h1>
            <PeladaStatusControls peladaId={pelada.id} status={pelada.status} />
          </div>
        </div>
      </div>

      <PeladaSubnav peladaId={pelada.id} />
      {children}
    </>
  );
}

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
