import Image from "next/image";

export default function SuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F0F0F0",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          padding: 32,
          borderRadius: 16,
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Quinze Veranistas"
            width={90}
            height={90}
            style={{ margin: "0 auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 12,
            color: "#101010",
          }}
        >
          ✅ Inscrição enviada!
        </h1>

        <p
          style={{
            color: "#374151",
            marginBottom: 16,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Recebemos sua inscrição para o Campeonato Tio Hugo 2026.
        </p>

        <p
          style={{
            color: "#4B5563",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Em breve você receberá as instruções de pagamento e os próximos
          passos.
        </p>

        <a
          href="/campeonatos/tio-hugo-2026/inscricao"
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 10,
            background: "#B89020",
            color: "#FFFFFF",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Voltar para inscrição
        </a>
      </div>
    </main>
  );
}
