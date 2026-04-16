import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F5F5F5 0%, #ECECEC 100%)",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            background: "#101010",
            color: "#FFFFFF",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 20px 50px rgba(16,16,16,0.16)",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 18,
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Image
              src="/logo-clube-xv.png"
              alt="Logo Clube Quinze Veranistas"
              width={72}
              height={72}
            />
          </div>

          <p
            style={{
              color: "#E7C56A",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Clube Quinze Veranistas
          </p>

          <h1
            style={{
              fontSize: 36,
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Campeonato Tio Hugo 2026
          </h1>

          <p style={{ color: "#D1D5DB", lineHeight: 1.7, fontSize: 16 }}>
            Inscrições abertas para mais uma edição do campeonato do clube.
            Participe, confirme sua presença e acompanhe a organização das
            equipes do torneio.
          </p>
        </section>

        <section
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: 32,
            border: "1px solid #E5E7EB",
            boxShadow: "0 16px 40px rgba(16,16,16,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#101010",
              marginBottom: 12,
            }}
          >
            Inscrição pública e acesso administrativo
          </h2>

          <p style={{ color: "#4B5563", lineHeight: 1.7, marginBottom: 24 }}>
            Use a inscrição pública para registrar atletas no campeonato ou
            acesse a área administrativa para gerenciar a lista, filtros, níveis
            e exportação.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Link
              href="/campeonatos/tio-hugo-2026/inscricao"
              style={primaryLinkStyle}
            >
              Fazer inscrição
            </Link>
            <Link href="/login" style={secondaryLinkStyle}>
              Área administrativa
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const primaryLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 10,
  background: "#B89020",
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: 700,
};

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 10,
  background: "#101010",
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: 700,
};
