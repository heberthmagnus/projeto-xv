"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getAdminChampionshipAdvancedSimulationPath,
  getAdminChampionshipRegistrationsPath,
} from "@/lib/routes";

const championshipSlug = "interno-campao-2026";
const links = [
  {
    href: getAdminChampionshipRegistrationsPath(championshipSlug),
    label: "Inscrição dos jogadores",
  },
  {
    href: getAdminChampionshipAdvancedSimulationPath(championshipSlug),
    label: "Divisão dos Times",
  },
  { href: "/admin/interno-campao-2026/sugestoes", label: "Fale conosco" },
];

export function InternoCampaoAdminNavigation() {
  const pathname = usePathname();

  return (
    <div className="xv-page-shell pb-0">
      <div className="xv-page-container">
        <section className="xv-card">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#B89020]">
            Área administrativa
          </p>
          <h2 className="mt-1 text-[1.38rem] font-bold text-[#101010]">
            Interno XV Campão 2026
          </h2>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Menu do Interno XV Campão 2026">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-[10px] border px-4 py-2.5 font-bold no-underline transition ${
                    isActive
                      ? "border-[#B89020] bg-[#B89020] text-white"
                      : "border-[#D1D5DB] bg-white text-[#101010]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </div>
  );
}
