import Image from "next/image";
import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthDatabaseUnavailableError,
  getAuthenticatedAdmin,
} from "@/lib/auth";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  let user = null;
  let databaseUnavailable = false;
  let authUnavailable = false;

  try {
    user = await getAuthenticatedAdmin();
  } catch (error) {
    if (error instanceof AuthDatabaseUnavailableError) {
      databaseUnavailable = true;
    } else if (error instanceof AuthConfigurationError) {
      authUnavailable = true;
    } else {
      throw error;
    }
  }

  if (user) {
    redirect(getInternoCampao2026AdminRegistrationsPath());
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#F4F4F4_0%,#EAEAEA_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-[420px] rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_40px_rgba(16,16,16,0.08)] sm:p-7">
        <div className="mb-6 text-center">
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Clube Quinze Veranistas"
            width={86}
            height={86}
            className="mx-auto mb-3 h-[74px] w-auto sm:mb-[14px] sm:h-[86px]"
          />
          <h1 className="mb-2 text-[2rem] font-extrabold text-[#101010] sm:text-[28px]">
            Área administrativa
          </h1>
          <p className="leading-7 text-[#4B5563]">
            Entre com um usuário já cadastrado manualmente para acessar as
            inscrições do campeonato.
          </p>
        </div>

        {databaseUnavailable && (
          <div className="mb-5 rounded-[14px] border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3 text-sm font-semibold leading-6 text-[#9A3412]">
            Não foi possível conectar ao banco agora. O login pode falhar até a
            conexão do Supabase ser restabelecida.
          </div>
        )}

        {authUnavailable && (
          <div className="mb-5 rounded-[14px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold leading-6 text-[#B91C1C]">
            A autenticação da área administrativa está temporariamente
            indisponível por uma configuração ausente no ambiente de produção.
          </div>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
