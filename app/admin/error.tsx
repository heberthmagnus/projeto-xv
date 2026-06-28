"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        <section className="xv-card">
          <div className="inline-flex rounded-full border border-[#FDBA74] bg-[#FFF7ED] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
            Admin temporariamente indisponível
          </div>
          <h1 className="mt-3 text-[1.5rem] font-black tracking-tight text-[#101010]">
            Não foi possível carregar esta área agora
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">
            A área administrativa continua protegida, mas o banco não respondeu
            a tempo para concluir a operação. Tente novamente em alguns instantes.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101010] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2C2C2C]"
          >
            Recarregar
          </button>
        </section>
      </div>
    </main>
  );
}
