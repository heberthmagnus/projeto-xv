"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container">
        <section className="rounded-[20px] border border-[#F3C37A] bg-[#FFF7ED] p-6 shadow-[0_12px_30px_rgba(154,52,18,0.08)]">
          <div className="inline-flex rounded-full border border-[#FDBA74] bg-white px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
            Erro temporário
          </div>
          <h1 className="mt-3 text-[1.5rem] font-black tracking-tight text-[#7C2D12]">
            Sistema temporariamente indisponível
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9A3412]">
            Não foi possível concluir esta operação agora. Tente novamente em
            alguns instantes.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#9A3412] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#7C2D12]"
          >
            Tentar novamente
          </button>
        </section>
      </div>
    </main>
  );
}
