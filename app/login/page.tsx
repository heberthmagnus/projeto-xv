import Image from "next/image";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ADMIN_REGISTRATIONS_PATH } from "@/lib/routes";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getAuthenticatedAdmin();

  if (user) {
    redirect(ADMIN_REGISTRATIONS_PATH);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, #F4F4F4 0%, #EAEAEA 100%)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 18,
          padding: 28,
          boxShadow: "0 16px 40px rgba(16,16,16,0.08)",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Clube Quinze Veranistas"
            width={86}
            height={86}
            style={{ margin: "0 auto 14px" }}
          />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#101010",
              marginBottom: 8,
            }}
          >
            Área administrativa
          </h1>
          <p style={{ color: "#4B5563", lineHeight: 1.6 }}>
            Entre com um usuário já cadastrado manualmente para acessar as
            inscrições do campeonato.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
