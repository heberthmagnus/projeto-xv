import Image from "next/image";
import { RegistrationForm } from "./registration-form";

const championshipTitle = "Campeonato Interno XV 2026";

export default function InscricaoInternoPage() {
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
              🥅 {championshipTitle}
            </h1>

            <p className="m-0 leading-6 text-[#4B5563] sm:leading-7">
              Estão abertas as inscrições para o Campeonato Interno XV 2026.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#B89020] bg-[#FAFAFA] p-4 text-sm leading-7 text-[#374151]">
          <p className="mb-2">
            <strong className="text-[#101010]">📍 Informações gerais</strong>
          </p>
          <p>• Jogos entre agosto e dezembro</p>
          <p>• As partidas acontecem aos sábados à tarde e aos domingos pela manhã</p>
          <p>• Categoria Adulto (até 49 anos): 7 times</p>
          <p>• Categoria Master (50+): 5 times</p>
          <p>• Faça sua inscrição de acordo com a sua categoria</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B6914]">
              Categoria Adulto
            </div>
            <h2 className="mt-2 text-[1.2rem] font-black text-[#101010]">
              Sub-50
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Competição com 7 times para atletas da categoria adulta.
            </p>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B6914]">
              Categoria Master
            </div>
            <h2 className="mt-2 text-[1.2rem] font-black text-[#101010]">
              50+
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Competição com 5 times para atletas da categoria master.
            </p>
          </section>
        </div>

        <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] p-4 text-sm leading-7 text-[#374151]">
          <p className="mb-2">
            <strong className="text-[#101010]">🗓️ Horários dos jogos</strong>
          </p>
          <p>
            <strong className="text-[#101010]">Sábado</strong>
          </p>
          <p>• 14:00</p>
          <p>• 15:30</p>
          <p className="mt-2">
            <strong className="text-[#101010]">Domingo</strong>
          </p>
          <p>• 08:00</p>
          <p>• 09:40</p>
          <p>• 11:30</p>
        </div>

        <RegistrationForm />
      </div>
    </main>
  );
}
