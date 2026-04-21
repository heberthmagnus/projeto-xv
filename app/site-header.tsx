"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CALENDARIO_XV_PATH, getChampionshipBasePath } from "@/lib/routes";

const menuItems = [
  { href: "/", label: "Início" },
  {
    href: getChampionshipBasePath("tio-hugo-2026"),
    label: "Copa Tio Hugo 2026",
  },
  { href: "/peladas", label: "Peladas" },
  { href: CALENDARIO_XV_PATH, label: "Calendário do XV" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-[#8B6914]/20 bg-[#F5F0E8] shadow-[0_8px_24px_rgba(139,105,20,0.08)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-6">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Image
              src="/logo-clube-xv.png"
              alt="Logo Clube Quinze Veranistas"
              width={58}
              height={58}
              priority
              className="h-11 w-auto shrink-0 object-contain mix-blend-multiply sm:h-12 md:h-14"
            />

            <div className="flex min-w-0 flex-col items-start justify-center">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-2xl md:text-[2.15rem]">
                Clube Quinze Veranistas
              </h1>
              <p className="mt-1 pl-[0.14rem] text-left text-[0.64rem] font-bold uppercase leading-tight tracking-[0.14em] text-[#8B6914] sm:mt-2 sm:text-xs md:text-sm">
                Tudo nos une, nada nos separa
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-start gap-3 sm:w-auto sm:justify-end">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#8B6914] bg-[#B8960C] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#8B6914]"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-y border-[#B8960C] bg-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 overflow-x-auto px-4 py-3 md:px-6">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/campeonatos")
                  ? pathname.startsWith("/campeonatos/tio-hugo-2026")
                  : item.href.startsWith("/peladas")
                    ? pathname.startsWith("/peladas")
                    : item.href.startsWith(CALENDARIO_XV_PATH)
                      ? pathname.startsWith(CALENDARIO_XV_PATH)
                    : false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap text-base font-semibold transition sm:text-[1.05rem] ${
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
