import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordClient } from "./reset-password-client";

export default function ResetPasswordPage() {
  const recoveryEnabled = process.env.SUPABASE_PASSWORD_RECOVERY_ENABLED === "true";
  return (
    <main className="xv-page-shell-soft">
      <div className="mx-auto flex w-full max-w-5xl px-4 md:px-6 lg:px-8">
        <section className="grid w-full gap-5 overflow-hidden rounded-[22px] border border-[#D9C9A3] bg-white shadow-[0_22px_50px_rgba(16,16,16,0.08)] lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)]">
          <div className="bg-[linear-gradient(180deg,#171717_0%,#24211A_100%)] px-5 py-7 text-white sm:px-7 sm:py-8">
            <div className="inline-flex rounded-full border border-[#F3D27A]/25 bg-[#F3D27A]/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#F3D27A]">
              Clube Quinze Veranistas
            </div>
            <h1 className="mt-4 text-[1.9rem] font-black tracking-tight sm:text-[2.4rem]">
              Redefinir senha
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              {recoveryEnabled ? "Abra o link recebido por e-mail para escolher uma nova senha." : "A recuperação de senha está temporariamente indisponível. Entre em contato com a secretaria para obter ajuda com o acesso."}
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-4">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#F3D27A]">
                  Segurança
                </div>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {recoveryEnabled ? "O link de recuperação precisa ser validado antes da troca de senha." : "A secretaria pode orientar a recuperação da sua conta."}
                </p>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-4">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#F3D27A]">
                  Acesso rápido
                </div>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {recoveryEnabled ? "Após atualizar a senha, entre novamente no site." : "Seu acesso e sua senha atuais permanecem inalterados."}
                </p>
              </div>
            </div>
          </div>

          {recoveryEnabled ? <Suspense fallback={<div>Validando link…</div>}><ResetPasswordClient /></Suspense> : <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-7 sm:py-8"><h2 className="text-xl font-black">Recuperação indisponível</h2><p className="mt-3 text-sm text-[#4B5563]">A redefinição automática está sendo corrigida. Para recuperar o acesso, fale com a secretaria do Clube XV.</p><Link href="/login" className="mt-5 font-bold text-[#8B6914] underline">Voltar ao login</Link></div>}
        </section>
      </div>
    </main>
  );
}
