import Image from "next/image";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F0F0] px-4 py-6 sm:px-6">
      <div className="w-full max-w-[440px] rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
        <div className="mb-4">
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Quinze Veranistas"
            width={90}
            height={90}
            className="mx-auto h-[82px] w-auto sm:h-[90px]"
          />
        </div>

        <h1 className="mb-3 text-[1.9rem] font-bold text-[#101010] sm:text-[28px]">
          ✅ Inscrição enviada!
        </h1>

        <p className="mb-4 text-base leading-7 text-[#374151]">
          Recebemos sua inscrição para o Campeonato Tio Hugo 2026.
        </p>

        <p className="mb-6 text-sm leading-7 text-[#4B5563]">
          Em breve você receberá as instruções de pagamento e os próximos
          passos.
        </p>

        <a
          href="/campeonatos/tio-hugo-2026/inscricao"
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#B89020] px-4 py-3 text-sm font-bold text-white no-underline"
        >
          Voltar para inscrição
        </a>
      </div>
    </main>
  );
}
