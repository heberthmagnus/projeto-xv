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
      <header className="border-b border-[#8B6914]/20 bg-[#F5F0E8] shadow-[0_6px_18px_rgba(139,105,20,0.07)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 md:px-6 md:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
            <Image
              src="/logo-clube-xv.png"
              alt="Logo Clube Quinze Veranistas"
              width={50}
              height={50}
              priority
              className="h-10 w-auto shrink-0 object-contain mix-blend-multiply sm:h-11 md:h-12"
            />

            <div className="flex min-w-0 flex-col items-start justify-center">
              <h1 className="text-[1.45rem] font-bold leading-tight tracking-tight sm:text-[1.7rem] md:text-[1.9rem]">
                Clube Quinze Veranistas
              </h1>
              <p className="mt-1 pl-[0.1rem] text-left text-[0.58rem] font-bold uppercase leading-tight tracking-[0.12em] text-[#8B6914] sm:text-[0.68rem] md:text-[0.76rem]">
                Tudo nos une, nada nos separa
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-start gap-3 sm:w-auto sm:justify-end">
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#8B6914] bg-[#B8960C] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#8B6914]"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-y border-[#B8960C] bg-[#1A1A1A]">
        <div
          data-scroll-preserve="site-header-nav"
          className="mx-auto flex w-full max-w-6xl items-center gap-2.5 overflow-x-auto px-4 py-2 md:gap-3 md:px-6"
        >
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
                className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 py-1.5 whitespace-nowrap text-[0.94rem] font-semibold transition sm:text-[0.98rem] ${
                  isActive
                    ? "bg-[#2A2A2A] text-[#F2C76B] shadow-[inset_0_0_0_1px_rgba(242,199,107,0.16)]"
                    : "text-white hover:bg-white/6 hover:text-[#B8960C]"
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
