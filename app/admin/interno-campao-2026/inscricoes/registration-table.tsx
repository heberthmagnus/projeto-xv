"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RegistrationRow } from "./registration-row";

export type RegistrationTableItem = {
  id: string; fullName: string; nickname: string | null; preferredPosition: string;
  birthDate: Date; phone: string; email: string | null; category: "ADULTO" | "MASTER" | null;
  level: "A" | "B" | "C" | "D" | "E" | null; adminNotes: string | null; createdAt: Date;
};

type SortKey = "fullName" | "birthDate" | "preferredPosition" | "category" | "level" | "createdAt";

export function RegistrationTable({ registrations }: { registrations: RegistrationTableItem[] }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") || ""); const [position, setPosition] = useState(() => searchParams.get("position") || ""); const [category, setCategory] = useState(() => searchParams.get("category") || ""); const [level, setLevel] = useState(() => searchParams.get("level") || "");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>(() => ({ key: (searchParams.get("sort") as SortKey) || "fullName", direction: searchParams.get("direction") === "desc" ? "desc" : "asc" }));
  const updateUrl = (changes: Record<string, string>) => { const params = new URLSearchParams(searchParams.toString()); Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key)); router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }); };
  const filtered = useMemo(() => registrations.filter((registration) => {
    const searchable = `${registration.fullName} ${registration.nickname || ""} ${registration.phone} ${registration.email || ""} ${registration.adminNotes || ""}`.toLocaleLowerCase();
    return (!query || searchable.includes(query.toLocaleLowerCase())) && (!position || registration.preferredPosition === position) && (!category || registration.category === category) && (!level || registration.level === level);
  }).sort((first, second) => {
    const a = String(first[sort.key] || ""); const b = String(second[sort.key] || "");
    return a.localeCompare(b, "pt-BR", { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
  }), [registrations, query, position, category, level, sort]);
  const toggleSort = (key: SortKey) => setSort((current) => { const next = { key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" } as const; updateUrl({ sort: next.key, direction: next.direction }); return next; });
  const heading = (label: string, key?: SortKey) => <th className="border-b border-[#D1D5DB] bg-[#F8FAFC] px-4 py-3 text-left text-xs font-bold uppercase tracking-[.12em] text-[#475569]">{key ? <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 whitespace-nowrap hover:text-[#8B6914]">{label}<span>{sort.key === key ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button> : label}</th>;
  return <>
    <div className="mb-3 grid gap-2 rounded-xl border border-[#D1D5DB] bg-white p-3 sm:grid-cols-2 xl:grid-cols-5">
      <input value={query} onChange={(event) => { setQuery(event.target.value); updateUrl({ q: event.target.value }); }} placeholder="Buscar nome, telefone, observação..." className="min-h-10 rounded-lg border border-[#CBD5E1] px-3 text-sm xl:col-span-2" />
      <select value={position} onChange={(event) => { setPosition(event.target.value); updateUrl({ position: event.target.value }); }} className="min-h-10 rounded-lg border border-[#CBD5E1] px-3 text-sm"><option value="">Todas as posições</option>{[["GOLEIRO", "Goleiro"], ["LATERAL", "Lateral"], ["ZAGUEIRO", "Zagueiro"], ["VOLANTE", "Volante"], ["MEIA", "Meia"], ["ATACANTE", "Atacante"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select value={category} onChange={(event) => { setCategory(event.target.value); updateUrl({ category: event.target.value }); }} className="min-h-10 rounded-lg border border-[#CBD5E1] px-3 text-sm"><option value="">Todas as categorias</option><option value="ADULTO">Adulto</option><option value="MASTER">Master</option></select>
      <select value={level} onChange={(event) => { setLevel(event.target.value); updateUrl({ level: event.target.value }); }} className="min-h-10 rounded-lg border border-[#CBD5E1] px-3 text-sm"><option value="">Todos os níveis</option>{["A", "B", "C", "D", "E"].map((item) => <option key={item}>{item}</option>)}</select>
      <button type="button" onClick={() => { setQuery(""); setPosition(""); setCategory(""); setLevel(""); setSort({ key: "fullName", direction: "asc" }); updateUrl({ q: "", position: "", category: "", level: "", sort: "", direction: "" }); }} className="text-left text-sm font-bold text-[#8B6914] underline xl:col-span-5">Limpar filtros · {filtered.length} de {registrations.length} inscrições exibidas</button>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] bg-white shadow-sm"><table className="min-w-full border-separate border-spacing-0 text-sm"><thead><tr>{heading("Nome", "fullName")}{heading("Apelido")}{heading("Idade", "birthDate")}{heading("Posição", "preferredPosition")}{heading("Telefone")}{heading("E-mail")}{heading("Categoria", "category")}{heading("Nível", "level")}{heading("Observações")}{heading("Inscrição", "createdAt")}{heading("Ações")}</tr></thead><tbody>{filtered.length ? filtered.map((registration) => <RegistrationRow key={registration.id} registration={registration} />) : <tr><td colSpan={11} className="px-4 py-8 text-center text-[#64748B]">Nenhuma inscrição corresponde aos filtros.</td></tr>}</tbody></table></div>
  </>;
}
