import Image from "next/image";
import { RegistrationForm } from "./registration-form";

export default function InscricaoPage() {
  return (
    <main className="min-h-screen bg-[#F0F0F0] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[680px] rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Quinze Veranistas"
            width={72}
            height={72}
            className="h-[64px] w-[64px] rounded-full sm:h-[72px] sm:w-[72px]"
          />

          <div>
            <h1 className="mb-1.5 text-[1.85rem] font-bold text-[#101010] sm:text-[28px]">
              🥅 Campeonato Tio Hugo 2026
            </h1>

            <p className="m-0 leading-6 text-[#4B5563] sm:leading-7">
              Estão abertas as inscrições para mais uma edição do tradicional
              Campeonato Tio Hugo.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#B89020] bg-[#FAFAFA] p-4 text-sm leading-7 text-[#374151]">
          <p className="mb-2">
            <strong className="text-[#101010]">📍 Informações gerais</strong>
          </p>
          <p>• Jogos durante o mês de maio</p>
          <p>• Partidas sempre às quintas-feiras à noite</p>
          <p>• Serão formadas 5 equipes</p>
          <p>• A cada rodada, acontecerão 2 jogos por noite:</p>
          <p className="ml-3">- 19h30</p>
          <p className="ml-3">- 20h30</p>
          <p>• Em cada quinta-feira, 1 equipe ficará de folga</p>
          <p>• A equipe de folga será responsável pela resenha da noite</p>
        </div>

        <RegistrationForm />
      </div>
    </main>
  );
}
