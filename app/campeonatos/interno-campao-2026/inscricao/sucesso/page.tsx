import Link from "next/link";
import { getInternoCampao2026RegistrationPath } from "@/lib/championships";

export default function InternoCampaoInscricaoSucessoPage() {
  return (
    <main className="min-h-screen bg-[#F0F0F0] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-[560px] rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-4xl">✅</div>
        <h1 className="mt-4 text-[1.8rem] font-black text-[#101010]">
          Inscrição enviada
        </h1>
        <p className="mt-3 text-[#4B5563]">
          Sua inscrição no Campeonato Interno Campão 2026 foi recebida com sucesso.
        </p>
        <Link
          href={getInternoCampao2026RegistrationPath()}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#B89020] px-5 py-3 font-bold text-white transition hover:bg-[#9F7C18]"
        >
          Fazer nova inscrição
        </Link>
      </div>
    </main>
  );
}
