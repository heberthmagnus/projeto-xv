import Image from "next/image";
import { RegistrationForm } from "./registration-form";

export default function InscricaoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F0F0F0",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Quinze Veranistas"
            width={72}
            height={72}
            style={{ borderRadius: 999 }}
          />

          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 6,
                color: "#101010",
              }}
            >
              🥅 Campeonato Tio Hugo 2026
            </h1>

            <p
              style={{
                color: "#4B5563",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Estão abertas as inscrições para mais uma edição do tradicional
              Campeonato Tio Hugo.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#FAFAFA",
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #B89020",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: "#374151",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: 8 }}>
            <strong style={{ color: "#101010" }}>📍 Informações gerais</strong>
          </p>
          <p>• Jogos durante o mês de maio</p>
          <p>• Partidas sempre às quintas-feiras à noite</p>
          <p>• Serão formadas 5 equipes</p>
          <p>• A cada rodada, acontecerão 2 jogos por noite:</p>
          <p style={{ marginLeft: 12 }}>- 19h30</p>
          <p style={{ marginLeft: 12 }}>- 20h30</p>
          <p>• Em cada quinta-feira, 1 equipe ficará de folga</p>
          <p>• A equipe de folga será responsável pela resenha da noite</p>
        </div>

        <RegistrationForm />
      </div>
    </main>
  );
}
