"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { ADMIN_PELADAS_PATH } from "@/lib/routes";

const links = [{ href: ADMIN_PELADAS_PATH, label: "Peladas" }];

export function PeladasNavigation() {
  const pathname = usePathname();

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Área administrativa</p>
            <h2 style={titleStyle}>Peladas</h2>
          </div>

          <form action={logout}>
            <button type="submit" style={logoutButtonStyle}>
              Sair
            </button>
          </form>
        </div>

        <nav style={navStyle} aria-label="Navegação das peladas">
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

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 14,
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
  fontSize: 22,
  color: "#101010",
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

const logoutButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 700,
  cursor: "pointer",
};
