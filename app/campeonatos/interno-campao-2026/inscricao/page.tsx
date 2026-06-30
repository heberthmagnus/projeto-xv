import Image from "next/image";
import { RegistrationForm } from "./registration-form";

export default function InternoCampaoInscricaoPage() {
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
              🥅 Campeonato Interno Campão 2026
            </h1>

            <p className="m-0 leading-6 text-[#4B5563] sm:leading-7">
              Faça sua inscrição escolhendo a categoria correta para a disputa.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#B89020] bg-[#FAFAFA] p-4 text-sm leading-7 text-[#374151]">
          <p className="mb-2">
            <strong className="text-[#101010]">📍 Capacidades</strong>
          </p>
          <p>• Adulto: 7 times, até 14 jogadores por time, total de 98 vagas</p>
          <p>• Master: 5 times, até 14 jogadores por time, total de 70 vagas</p>
          <p>• A categoria pode ser ajustada pela administração quando necessário</p>
        </div>

        <RegistrationForm />
      </div>
    </main>
  );
}
