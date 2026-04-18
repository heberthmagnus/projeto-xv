"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Início" },
  {
    href: "/campeonatos/tio-hugo-2026/inscricao",
    label: "Copa Tio Hugo 2026",
  },
  { href: "/peladas", label: "Peladas" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-[#8B6914]/20 bg-[#F5F0E8] shadow-[0_8px_24px_rgba(139,105,20,0.08)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 md:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Image
              src="/logo-clube-xv.png"
              alt="Logo Clube Quinze Veranistas"
              width={58}
              height={58}
              priority
              className="h-12 w-auto object-contain mix-blend-multiply md:h-14"
            />

            <div className="flex min-w-0 flex-col items-start justify-center">
              <h1 className="text-2xl font-bold leading-none tracking-tight md:text-[2.15rem]">
                Clube Quinze Veranistas
              </h1>
              <p className="mt-2 pl-[0.14rem] text-left text-xs font-bold uppercase leading-none tracking-[0.16em] text-[#8B6914] md:text-sm">
                Tudo nos une, nada nos separa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-[#8B6914] bg-[#B8960C] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#8B6914]"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-y border-[#B8960C] bg-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-12 gap-y-3 px-4 py-4 md:px-6">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/campeonatos")
                  ? pathname.startsWith("/campeonatos/tio-hugo-2026")
                  : item.href.startsWith("/peladas")
                    ? pathname.startsWith("/peladas")
                  : false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[1.05rem] font-semibold transition ${
                  isActive ? "text-[#B8960C]" : "text-white hover:text-[#B8960C]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
