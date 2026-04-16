import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function createRegistration(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const birthDate = String(formData.get("birthDate") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const confirmedRules = formData.get("confirmedRules") === "on";

  const championship = await prisma.championship.findUnique({
    where: { slug: "tio-hugo-2026" },
    select: { id: true },
  });

  if (!championship) {
    throw new Error("Campeonato não encontrado.");
  }

  await prisma.registration.create({
    data: {
      championshipId: championship.id,
      fullName,
      nickname: nickname || null,
      preferredPosition: preferredPosition as
        | "GOLEIRO"
        | "LATERAL"
        | "ZAGUEIRO"
        | "VOLANTE"
        | "MEIA"
        | "ATACANTE",
      birthDate: new Date(birthDate),
      phone,
      email: email || null,
      confirmedRules,
    },
  });

  redirect("/campeonatos/tio-hugo-2026/inscricao/sucesso");
}

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

        <form
          action={createRegistration}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <FormField label="Nome completo *">
            <input name="fullName" type="text" required style={inputStyle} />
          </FormField>

          <FormField label="Apelido">
            <input name="nickname" type="text" style={inputStyle} />
          </FormField>

          <FormField label="Posição preferida *">
            <select
              name="preferredPosition"
              required
              defaultValue=""
              style={inputStyle}
            >
              <option value="" disabled>
                Selecione
              </option>
              <option value="GOLEIRO">Goleiro</option>
              <option value="LATERAL">Lateral</option>
              <option value="ZAGUEIRO">Zagueiro</option>
              <option value="VOLANTE">Volante</option>
              <option value="MEIA">Meia</option>
              <option value="ATACANTE">Atacante</option>
            </select>
          </FormField>

          <FormField label="Data de nascimento *">
            <input name="birthDate" type="date" required style={inputStyle} />
          </FormField>

          <FormField label="Telefone / WhatsApp *">
            <input name="phone" type="text" required style={inputStyle} />
          </FormField>

          <FormField label="E-mail">
            <input name="email" type="email" style={inputStyle} />
          </FormField>

          <div
            style={{
              fontSize: 13,
              color: "#374151",
              background: "#FFF8E8",
              border: "1px solid #E7C56A",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <strong style={{ color: "#101010" }}>⚠️ Atenção:</strong> Os jogos
            acontecerão às quintas-feiras à noite, com partidas às 19h30 e
            20h30.
          </div>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              name="confirmedRules"
              required
              style={{ marginTop: 3 }}
            />
            <span>
              Confirmo que li e estou ciente de que os jogos acontecerão às
              quintas-feiras à noite, com partidas às 19h30 e 20h30, e que a
              equipe de folga em cada rodada será responsável pela resenha, além
              das informações de valores e formas de pagamento.
            </span>
          </label>

          <button
            type="submit"
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "#B89020",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Enviar inscrição
          </button>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 600,
          color: "#101010",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  color: "#101010",
  background: "#FFFFFF",
};
