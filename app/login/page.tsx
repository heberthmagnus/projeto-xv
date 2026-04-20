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

        <LoginForm />
      </div>
    </main>
  );
}
