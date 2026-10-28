"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADMIN_ADVANCED_SIMULATION_PATH,
  ADMIN_MATCHES_PATH,
  ADMIN_PELADAS_PATH,
  ADMIN_REGISTRATIONS_PATH,
  ADMIN_SIMULATION_PATH,
  ADMIN_TEAMS_PATH,
  getAdminChampionshipAdvancedSimulationPath,
  getAdminChampionshipRegistrationsPath,
} from "@/lib/routes";

type Item = { label: string; href: string; match: (pathname: string) => boolean };
type Group = { title: string; description: string; items: Item[] };

const internoItems: Item[] = [
  { label: "Inscrições", href: getAdminChampionshipRegistrationsPath("interno-campao-2026"), match: (path) => path === "/admin/interno-campao-2026/inscricoes" },
  { label: "Divisão dos times", href: getAdminChampionshipAdvancedSimulationPath("interno-campao-2026"), match: (path) => path.startsWith("/admin/interno-campao-2026/times") },
  { label: "Lançar resultados", href: "/admin/interno-campao-2026/jogos", match: (path) => path.startsWith("/admin/interno-campao-2026/jogos") },
  { label: "Gerenciar elencos", href: "/admin/interno-campao-2026/elencos", match: (path) => path.startsWith("/admin/interno-campao-2026/elencos") },
  { label: "IDs dos jogadores", href: "/admin/interno-campao-2026/ids-jogadores", match: (path) => path.startsWith("/admin/interno-campao-2026/ids-jogadores") },
  { label: "Pendências", href: "/admin/interno-campao-2026/pendencias", match: (path) => path.startsWith("/admin/interno-campao-2026/pendencias") },
];

const tioHugoItems: Item[] = [
  { label: "Inscrições", href: ADMIN_REGISTRATIONS_PATH, match: (path) => path === ADMIN_REGISTRATIONS_PATH },
  { label: "Times", href: ADMIN_TEAMS_PATH, match: (path) => path === ADMIN_TEAMS_PATH },
  { label: "Jogos", href: ADMIN_MATCHES_PATH, match: (path) => path === ADMIN_MATCHES_PATH },
  { label: "Simulação", href: ADMIN_SIMULATION_PATH, match: (path) => path === ADMIN_SIMULATION_PATH },
  { label: "Simulação avançada", href: ADMIN_ADVANCED_SIMULATION_PATH, match: (path) => path === ADMIN_ADVANCED_SIMULATION_PATH },
];

export function AdminSectionsNavigation({ canManageSports, canManagePlatform, canManagePlayers, canManageResults, canApproveAccounts }: { canManageSports: boolean; canManagePlatform: boolean; canManagePlayers: boolean; canManageResults: boolean; canApproveAccounts: boolean }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const groups: Group[] = [];

  if (canManageSports) {
    groups.push(
      { title: "Campão 2026", description: "Campeonato interno", items: internoItems },
      { title: "Copa Tio Hugo 2026", description: "Gestão esportiva", items: tioHugoItems },
      { title: "Rotina esportiva", description: "Atividades do clube", items: [{ label: "Peladas", href: ADMIN_PELADAS_PATH, match: (path) => path.startsWith(ADMIN_PELADAS_PATH) }] },
    );
  } else if (canManageResults) {
    groups.push({ title: "Campeonato interno", description: "Resultados autorizados", items: [internoItems[2]] });
  }

  const membershipItems: Item[] = [
    ...(canManagePlayers ? [{ label: "Cadastro de atletas", href: "/admin/atletas", match: (path: string) => path.startsWith("/admin/atletas") }] : []),
    ...(canApproveAccounts ? [{ label: "Solicitações de acesso", href: "/solicitacoes", match: (path: string) => path.startsWith("/solicitacoes") }] : []),
  ];
  if (membershipItems.length) groups.push({ title: "Associados", description: "Cadastros e aprovações", items: membershipItems });

  if (canManagePlatform) groups.push({ title: "Plataforma", description: "Administração do site", items: [
    { label: "Patrocinadores", href: "/admin/patrocinadores", match: (path) => path.startsWith("/admin/patrocinadores") },
    { label: "Backlog do site", href: "/admin/backlog", match: (path) => path.startsWith("/admin/backlog") },
  ] });

  useEffect(() => {
    const activeGroup = groups.find((group) => group.items.some((item) => item.match(pathname)));
    if (activeGroup) setExpandedGroups((current) => current.includes(activeGroup.title) ? current : [...current, activeGroup.title]);
  }, [pathname]);

  function toggleGroup(title: string) {
    setExpandedGroups((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  return <aside className="w-full shrink-0 rounded-3xl bg-[#101010] p-3 text-white shadow-[0_18px_40px_rgba(16,16,16,0.16)] lg:w-72 lg:p-4">
    <div className="border-b border-white/15 px-3 pb-4 pt-2">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#D6B34A]">Área administrativa</p>
      <h2 className="mt-2 text-xl font-black leading-tight">Organização do clube</h2>
      <p className="mt-2 text-sm leading-5 text-white/65">Acesse apenas os módulos liberados para seu perfil.</p>
    </div>
    <nav className="mt-3 grid gap-3" aria-label="Seções administrativas">
      {groups.map((group) => { const isExpanded = expandedGroups.includes(group.title); const hasActiveItem = group.items.some((item) => item.match(pathname)); return <section key={group.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-2">
        <button type="button" onClick={() => toggleGroup(group.title)} aria-expanded={isExpanded} className={`flex w-full items-center justify-between rounded-xl px-2 py-1 text-left transition ${hasActiveItem ? "text-[#F2C76B]" : "text-white"}`}><span><span className="block text-sm font-black">{group.title}</span><span className="mt-0.5 block text-xs text-white/55">{group.description}</span></span><span aria-hidden className={`grid h-7 w-7 place-items-center rounded-full bg-white/10 text-base transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span></button>
        {isExpanded ? <div className="mt-2 grid gap-1">{group.items.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition ${item.match(pathname) ? "bg-[#B89020] text-white shadow-[0_8px_18px_rgba(184,144,32,0.25)]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>{item.label}<span aria-hidden className="float-right opacity-60">→</span></Link>)}</div> : null}
      </section>; })}
    </nav>
  </aside>;
}
