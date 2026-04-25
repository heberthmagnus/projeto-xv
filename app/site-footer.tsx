import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-[#B8960C] bg-gradient-to-b from-[#151515] to-[#0F0F0F] px-4 py-8 text-white md:px-6 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[160px_minmax(0,1fr)_minmax(280px,0.95fr)] md:items-center md:gap-10">
        <div className="flex items-center justify-center md:justify-start">
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Clube Quinze Veranistas"
            width={160}
            height={160}
            className="h-[104px] w-auto object-contain mix-blend-screen sm:h-[124px] md:h-[156px]"
          />
        </div>

        <div className="text-center md:text-left">
          <h2 className="xv-fluid-text mb-4 text-[1.4rem] font-black tracking-tight text-white sm:text-[2rem]">
            Clube Quinze Veranistas
          </h2>
          <div className="grid gap-2 text-[0.95rem] leading-7 text-white/80 sm:text-[1.02rem]">
            <p className="xv-fluid-text">R. Gumercindo Couto e Silva, 195 - Itapoã, Belo Horizonte - MG, 31710-050</p>
            <p>3441-2424</p>
            <p className="xv-fluid-text">clubequinzeveranistas@yahoo.com.br</p>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end">
          <p className="xv-fluid-text max-w-[14ch] text-center text-[1.45rem] font-black leading-tight text-[#F2CF73] sm:text-2xl md:max-w-none md:text-right md:text-[2.1rem]">
            Tudo nos une, nada nos separa!
          </p>
        </div>
      </div>
    </footer>
  );
}
