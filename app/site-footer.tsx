import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-[#B8960C] bg-gradient-to-b from-[#151515] to-[#0F0F0F] px-4 py-10 text-white md:px-6 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[160px_minmax(0,1fr)_minmax(320px,0.95fr)] md:items-center md:gap-10">
        <div className="flex items-center justify-center md:justify-start">
          <Image
            src="/logo-clube-xv.png"
            alt="Logo Clube Quinze Veranistas"
            width={160}
            height={160}
            className="h-[136px] w-auto object-contain mix-blend-screen md:h-[156px]"
          />
        </div>

        <div>
          <h2 className="mb-4 text-[2rem] font-black tracking-tight text-white">
            Clube Quinze Veranistas
          </h2>
          <div className="grid gap-2 text-[1.02rem] leading-7 text-white/80">
            <p>R. Gumercindo Couto e Silva, 195 - Itapoã, Belo Horizonte - MG, 31710-050</p>
            <p>3441-2424</p>
            <p>clubequinzeveranistas@yahoo.com.br</p>
          </div>
        </div>

        <div className="flex items-center md:justify-end">
          <p className="text-2xl font-black leading-tight text-[#F2CF73] md:text-right md:text-[2.1rem]">
            Tudo nos une, nada nos separa!
          </p>
        </div>
      </div>
    </footer>
  );
}
