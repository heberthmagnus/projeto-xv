"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ADMIN_CHAMPIONSHIP_BASE_PATH,
  ADMIN_ADVANCED_SIMULATION_PATH,
  ADMIN_MATCHES_PATH,
  ADMIN_REGISTRATIONS_PATH,
  ADMIN_PELADAS_PATH,
  ADMIN_SIMULATION_PATH,
  ADMIN_TEAMS_PATH,
  getAdminChampionshipAdvancedSimulationPath,
  getAdminChampionshipRegistrationsPath,
} from "@/lib/routes";

type NavigationItem = {
  label: string;
  href?: string;
  match: (pathname: string) => boolean;
  children?: { label: string; href: string }[];
};

const links: NavigationItem[] = [
  {
    label: "Interno XV Campão 2026",
    match: (pathname: string) =>
      pathname.startsWith("/admin/interno-campao-2026"),
    children: [
      {
        label: "Inscrições",
        href: getAdminChampionshipRegistrationsPath("interno-campao-2026"),
      },
      {
        label: "Divisão dos Times",
        href: getAdminChampionshipAdvancedSimulationPath("interno-campao-2026"),
      },
    ],
  },
  {
    href: "/admin/atletas",
    label: "Cadastro de atletas",
    match: (pathname: string) => pathname.startsWith("/admin/atletas"),
  },
  {
    label: "Copa Tio Hugo 2026",
    match: (pathname: string) => pathname.startsWith(ADMIN_CHAMPIONSHIP_BASE_PATH),
    children: [
      { label: "Inscrições", href: ADMIN_REGISTRATIONS_PATH },
      { label: "Times", href: ADMIN_TEAMS_PATH },
      { label: "Jogos", href: ADMIN_MATCHES_PATH },
      { label: "Simulação", href: ADMIN_SIMULATION_PATH },
      { label: "Simulação avançada", href: ADMIN_ADVANCED_SIMULATION_PATH },
    ],
  },
  {
    href: ADMIN_PELADAS_PATH,
    label: "Peladas",
    match: (pathname: string) => pathname.startsWith(ADMIN_PELADAS_PATH),
  },
];

export function AdminSectionsNavigation() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  function toggleSection(label: string) {
    setExpandedSections((sections) =>
      sections.includes(label)
        ? sections.filter((section) => section !== label)
        : [...sections, label],
    );
  }

  return (
    <aside className="w-full shrink-0 rounded-3xl bg-[#101010] p-3 text-white shadow-[0_18px_40px_rgba(16,16,16,0.16)] lg:w-72 lg:p-4">
      <div className="border-b border-white/15 px-3 pb-4 pt-2">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#D6B34A]">Área administrativa</p>
        <h2 className="mt-2 text-xl font-black leading-tight">Organização do clube</h2>
        <p className="mt-2 text-sm leading-5 text-white/65">Acesse e administre cada frente do XV.</p>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Seções administrativas">
        {links.map((link) => {
          const isActive = link.match(pathname);
          const isExpanded = expandedSections.includes(link.label);

          if (!link.children) {
            return <Link key={link.href} href={link.href!} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold no-underline transition ${isActive ? "bg-[#B89020] text-white shadow-[0_8px_18px_rgba(184,144,32,0.28)]" : "text-white/85 hover:bg-white/10 hover:text-white"}`}>{link.label}</Link>;
          }

          return <div key={link.label} className="min-w-max lg:min-w-0">
            <button type="button" onClick={() => toggleSection(link.label)} aria-expanded={isExpanded} className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${isActive ? "bg-white/10 text-[#E2C567]" : "text-white/85 hover:bg-white/10 hover:text-white"}`}>
              {link.label}<span aria-hidden="true" className={`text-base transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
            </button>
            {isExpanded ? <div className="mt-1 space-y-1 border-l border-[#B89020]/60 py-1 pl-3 lg:ml-4">{link.children.map((child) => <Link key={child.href} href={child.href} className={`block rounded-xl px-3 py-2 text-sm font-semibold no-underline transition ${pathname === child.href ? "bg-[#B89020] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{child.label}</Link>)}</div> : null}
          </div>;
        })}
      </nav>
    </aside>
  );
}
