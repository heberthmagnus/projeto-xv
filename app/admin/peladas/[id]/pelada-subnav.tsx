"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_PELADAS_PATH,
  getAdminPeladaChegadaPath,
  getAdminPeladaConfirmadosPath,
  getAdminPeladaPeladasDoDiaPath,
  getAdminPeladaResultadosPath,
} from "@/lib/routes";

type PeladaSubnavProps = {
  peladaId: string;
};

export function PeladaSubnav({ peladaId }: PeladaSubnavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: getAdminPeladaConfirmadosPath(peladaId),
      label: "Confirmados",
    },
    {
      href: getAdminPeladaChegadaPath(peladaId),
      label: "Chegada",
    },
    {
      href: getAdminPeladaPeladasDoDiaPath(peladaId),
      label: "Peladas do dia",
    },
    {
      href: getAdminPeladaResultadosPath(peladaId),
      label: "Resultados",
    },
  ];

  return (
    <div className="xv-page-shell pt-3 pb-0">
      <div className="xv-page-container">
        <div className="xv-card">
          <Link href={ADMIN_PELADAS_PATH} style={backLinkStyle}>
            ← Voltar para peladas
          </Link>

          <nav style={navStyle} aria-label="Navegação da pelada">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={isActive ? activeLinkStyle : linkStyle}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "#8B6914",
  fontWeight: 700,
  textDecoration: "none",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const baseLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  textDecoration: "none",
};

const linkStyle: React.CSSProperties = {
  ...baseLinkStyle,
  background: "#FFFFFF",
  color: "#101010",
  border: "1px solid #D1D5DB",
};

const activeLinkStyle: React.CSSProperties = {
  ...baseLinkStyle,
  background: "#B89020",
  color: "#FFFFFF",
  border: "1px solid #B89020",
};
