"use client";

import { usePathname } from "next/navigation";
import { getPeladaStatusLabel } from "@/lib/peladas";
import { updatePeladaStatus } from "../actions";

type PeladaStatusControlsProps = {
  peladaId: string;
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
};

export function PeladaStatusControls({
  peladaId,
  status,
}: PeladaStatusControlsProps) {
  const pathname = usePathname();

  return (
    <div style={wrapStyle}>
      <span style={getStatusBadgeStyle(status)}>
        Status: {getPeladaStatusLabel(status)}
      </span>

      <div className="xv-mobile-button-grid" style={actionsStyle}>
        {status !== "FINALIZADA" && (
          <form action={updatePeladaStatus}>
            <input type="hidden" name="id" value={peladaId} />
            <input type="hidden" name="status" value="FINALIZADA" />
            <input type="hidden" name="returnTo" value={pathname} />
            <button type="submit" style={finalizeButtonStyle}>
              Finalizar pelada
            </button>
          </form>
        )}

        {status !== "CANCELADA" && (
          <form action={updatePeladaStatus}>
            <input type="hidden" name="id" value={peladaId} />
            <input type="hidden" name="status" value="CANCELADA" />
            <input type="hidden" name="returnTo" value={pathname} />
            <button type="submit" style={cancelButtonStyle}>
              Cancelar pelada
            </button>
          </form>
        )}

        {(status === "FINALIZADA" || status === "CANCELADA") && (
          <form action={updatePeladaStatus}>
            <input type="hidden" name="id" value={peladaId} />
            <input type="hidden" name="status" value="ABERTA" />
            <input type="hidden" name="returnTo" value={pathname} />
            <button type="submit" style={reopenButtonStyle}>
              Reabrir pelada
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getStatusBadgeStyle(
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA",
): React.CSSProperties {
  if (status === "FINALIZADA") {
    return {
      ...badgeBaseStyle,
      background: "#ECFDF3",
      color: "#047857",
      border: "1px solid #A7F3D0",
    };
  }

  if (status === "CANCELADA") {
    return {
      ...badgeBaseStyle,
      background: "#FEF2F2",
      color: "#B91C1C",
      border: "1px solid #FECACA",
    };
  }

  if (status === "EM_ANDAMENTO") {
    return {
      ...badgeBaseStyle,
      background: "#EFF6FF",
      color: "#1D4ED8",
      border: "1px solid #BFDBFE",
    };
  }

  return {
    ...badgeBaseStyle,
    background: "#FCF7E6",
    color: "#8B6914",
    border: "1px solid #F1D68A",
  };
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 14,
};

const actionsStyle: React.CSSProperties = {
  width: "100%",
};

const badgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const buttonBaseStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  width: "100%",
};

const finalizeButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid #10B981",
  background: "#ECFDF3",
  color: "#047857",
};

const cancelButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#B91C1C",
};

const reopenButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#111827",
};
