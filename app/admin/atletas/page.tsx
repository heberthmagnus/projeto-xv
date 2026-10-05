import { requireAdmin } from "@/lib/auth";
import { getAthleteProfileAge } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";
import { createAthlete, deleteAthlete, deleteAthleteAssumingRisk, mergeAthletes, mergeSelectedAthletes, updateAthlete } from "./actions";

type Athlete = {
  id: string;
  fullName: string;
  nickname: string | null;
  birthDate: Date | null;
  lastKnownAge: number | null;
  phone: string | null;
  email: string | null;
  preferredPosition: string | null;
  defaultLevel: string | null;
  registrations: Array<{
    championship: { slug: string; name: string; seasonLabel: string | null };
    championshipPlayer: { team: { name: string; shortName: string | null; icon: string | null } | null } | null;
  }>;
  _count: { registrations: number; peladaArrivals: number; peladaConfirmations: number; matchEvents: number; matchParticipations: number; suspensions: number };
};

type PossibleDuplicate = { first: Athlete; second: Athlete; reasons: string[] };

export default async function AthletesAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string; search?: string }> }) {
  await requireAdmin();
  const { notice, search: rawSearch } = await searchParams;
  const search = rawSearch?.trim() ?? "";

  const [athletes, campaoRegistrations, campaoLinkedProfiles] = await Promise.all([prisma.athleteProfile.findMany({
    where: search ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { nickname: { contains: search, mode: "insensitive" } }] } : undefined,
    orderBy: { fullName: "asc" },
    select: {
      id: true, fullName: true, nickname: true, birthDate: true, lastKnownAge: true,
      phone: true, email: true, preferredPosition: true, defaultLevel: true,
      registrations: { select: {
        championship: { select: { slug: true, name: true, seasonLabel: true } },
        championshipPlayer: { select: { team: { select: { name: true, shortName: true, icon: true } } } },
      } },
      _count: { select: { registrations: true, peladaArrivals: true, peladaConfirmations: true, matchEvents: true, matchParticipations: true, suspensions: true } },
    },
  }),
  prisma.registration.count({ where: { championship: { slug: "interno-campao-2026" } } }),
  prisma.registration.count({ where: { championship: { slug: "interno-campao-2026" }, athleteProfileId: { not: null } } }),
  ]);
  const possibleDuplicates = findPossibleDuplicates(athletes);

  return <main className="xv-page-shell"><div className="xv-page-container space-y-5 pb-28">
    <section className="xv-card">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Base do clube</p>
      <h1 className="mt-2 text-3xl font-black text-[#101010]">Cadastro de atletas</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Esta é a ficha principal de cada atleta. Aqui você vê se ele disputa o Campão 2026, em qual time está e todos os campeonatos já registrados.</p>
      {notice === "historico-preservado" ? <p role="status" className="mt-4 rounded-xl bg-[#FFF9EA] px-4 py-3 text-sm font-bold text-[#8B6914]">Este atleta não foi excluído porque já possui inscrição, presença ou registros de jogo. O histórico foi preservado.</p> : null}
      {notice === "exclusao-assumida" ? <p role="status" className="mt-4 rounded-xl bg-[#FFF1F2] px-4 py-3 text-sm font-bold text-[#9F1239]">Cadastro excluído por decisão administrativa. As inscrições e súmulas foram preservadas, mas os vínculos pessoais e as participações deste atleta foram removidos.</p> : null}
      {notice === "perfis-integrados" ? <p role="status" className="mt-4 rounded-xl bg-[#ECFDF3] px-4 py-3 text-sm font-bold text-[#166534]">✓ Cadastros integrados. Inscrições, presenças e estatísticas foram reunidas em uma única ficha de atleta.</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Atletas cadastrados" value={String(athletes.length)} />
        <Stat label="Vínculos no Campão 2026" value={`${campaoLinkedProfiles}/${campaoRegistrations}`} />
        <Stat label="Possíveis duplicidades" value={String(possibleDuplicates.length)} />
        <Stat label="Regra atual" value="Nome normalizado único" />
      </div>
      {campaoLinkedProfiles !== campaoRegistrations ? <p className="mt-3 text-sm font-semibold text-[#B45309]">Há {campaoRegistrations - campaoLinkedProfiles} inscrição(ões) do Campão sem ficha principal vinculada. Revise em “IDs dos jogadores”.</p> : null}
    </section>

    <section className="xv-card">
      <h2 className="text-xl font-black text-[#101010]">Novo atleta</h2>
      <AthleteForm action={createAthlete} submitLabel="Cadastrar atleta" />
    </section>

    <section className="xv-card">
      <h2 className="text-xl font-black text-[#101010]">Possíveis duplicidades para conferir</h2>
      <p className="mt-1 text-sm text-[#6B7280]">São sugestões: nenhum cadastro é unido automaticamente. A identificação considera telefone, e-mail, data de nascimento e semelhança de nome.</p>
      {possibleDuplicates.length ? <div className="mt-4 grid gap-3">{possibleDuplicates.map((pair) => <article key={`${pair.first.id}-${pair.second.id}`} className="rounded-2xl border border-[#F3D38A] bg-[#FFF9EA] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#8B6914]">{pair.reasons.join(" · ")}</p><div className="mt-2 grid gap-3 md:grid-cols-2"><AthleteDetails athlete={pair.first} /><AthleteDetails athlete={pair.second} /></div><form action={mergeAthletes} className="mt-3 flex flex-wrap items-center gap-3"><input type="hidden" name="firstId" value={pair.first.id} /><input type="hidden" name="secondId" value={pair.second.id} /><button className="rounded-xl bg-[#B89020] px-4 py-2 text-sm font-bold text-white">Confirmar: é a mesma pessoa</button><span className="text-xs text-[#6B7280]">O perfil com mais dados e histórico será mantido; os campos ausentes serão completados.</span></form></article>)}</div> : <p className="mt-4 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-3 text-sm text-[#065F46]">Nenhuma possível duplicidade foi encontrada com os dados atuais.</p>}
    </section>

    <section className="xv-card">
      <h2 className="text-xl font-black text-[#101010]">Atletas registrados</h2>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1 text-sm font-bold text-[#374151]">Pesquisar atleta<input name="search" defaultValue={search} placeholder="Nome ou apelido" className="min-h-10 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-normal text-[#101010]" /></label>
        <div className="flex gap-2"><button className="rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-bold text-white">Pesquisar</button><a href="/admin/atletas" className="rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm font-bold text-[#374151]">Limpar</a></div>
      </form>
      {search ? <p className="mt-3 text-sm text-[#6B7280]">{athletes.length} atleta(s) encontrado(s) para “{search}”.</p> : null}
      <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E5E7EB]"><table className="min-w-full text-sm"><thead className="bg-[#FAFAFA] text-left text-xs uppercase tracking-wide text-[#6B7280]"><tr>{["Integrar", "Nome", "Apelido", "Idade", "Posição", "Campão 2026", "Histórico", "Telefone", "E-mail", "Nível", "Ações"].map((label) => <th key={label} className="border-b px-4 py-3">{label}</th>)}</tr></thead><tbody>{athletes.map((athlete) => <tr key={athlete.id} className="border-b last:border-0"><td className="px-4 py-3"><input form="merge-selected-athletes" type="checkbox" name="athleteIds" value={athlete.id} aria-label={`Selecionar ${athlete.fullName} para integrar`} /></td><td className="px-4 py-3 font-semibold text-[#101010]">{athlete.fullName}</td><td className="px-4 py-3">{athlete.nickname || "-"}</td><td className="px-4 py-3">{getAthleteProfileAge(athlete) ?? "-"}</td><td className="px-4 py-3">{positionLabel(athlete.preferredPosition)}</td><td className="px-4 py-3"><CampaoStatus athlete={athlete} /></td><td className="px-4 py-3"><ChampionshipHistory athlete={athlete} /></td><td className="px-4 py-3">{athlete.phone || "-"}</td><td className="px-4 py-3">{athlete.email || "-"}</td><td className="px-4 py-3">{athlete.defaultLevel || "-"}</td><td className="px-4 py-3"><details><summary className="cursor-pointer font-bold text-[#8B6914]">Editar</summary><div className="mt-3 min-w-80"><AthleteForm action={updateAthlete} submitLabel="Salvar" athlete={athlete} /></div></details><DeleteAthleteAction athlete={athlete} /></td></tr>)}</tbody></table></div>
      <form id="merge-selected-athletes" action={mergeSelectedAthletes} className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-[#D6AE2C] bg-[#FFF9EA] p-3 shadow-xl sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 text-sm font-semibold text-[#713F12]"><input name="acknowledgeMerge" type="checkbox" value="yes" required />Confirmo que são a mesma pessoa.</label><div className="flex items-center gap-3"><span className="hidden text-xs text-[#6B7280] sm:block">As inscrições e estatísticas serão reunidas.</span><button className="rounded-lg bg-[#B89020] px-4 py-2 text-sm font-bold text-white">Integrar selecionados</button></div></form>
    </section>
  </div></main>;
}

function findPossibleDuplicates(athletes: Athlete[]) {
  const pairs: PossibleDuplicate[] = [];
  for (let index = 0; index < athletes.length; index += 1) for (let otherIndex = index + 1; otherIndex < athletes.length; otherIndex += 1) {
    const first = athletes[index]; const second = athletes[otherIndex]; const reasons: string[] = [];
    // Contatos podem pertencer a pai, mãe ou responsável. O nome e a idade
    // compatíveis são obrigatórios antes de considerar qualquer outro dado.
    if (!hasSimilarName(first.fullName, second.fullName)) continue;
    if (hasConflictingAge(first, second)) continue;
    reasons.push("nome compatível");
    if (samePhone(first.phone, second.phone)) reasons.push("mesmo telefone");
    if (sameEmail(first.email, second.email)) reasons.push("mesmo e-mail");
    if (sameBirthDate(first.birthDate, second.birthDate)) reasons.push("mesma data de nascimento");
    if (sameKnownAge(first.lastKnownAge, second.lastKnownAge)) reasons.push("mesma idade");
    if (reasons.length) pairs.push({ first, second, reasons: [...new Set(reasons)] });
  }
  return pairs;
}

function samePhone(first: string | null, second: string | null) {
  const normalizedFirst = first?.replace(/\D/g, "") ?? "";
  const normalizedSecond = second?.replace(/\D/g, "") ?? "";
  return Boolean(
    normalizedFirst &&
      normalizedSecond &&
      !isPlaceholderPhone(normalizedFirst) &&
      !isPlaceholderPhone(normalizedSecond) &&
      normalizedFirst === normalizedSecond,
  );
}
function isPlaceholderPhone(value: string) {
  // Também cobre placeholders brasileiros como (31) 99999-9999: o DDD existe,
  // mas todos os dígitos do telefone local são 9.
  return /^9+$/.test(value) || (value.length >= 10 && /^9+$/.test(value.slice(2))) || value === "0090000000";
}
function sameEmail(first: string | null, second: string | null) {
  const normalizedFirst = first?.trim().toLowerCase() ?? "";
  const normalizedSecond = second?.trim().toLowerCase() ?? "";
  return Boolean(
    normalizedFirst &&
      normalizedSecond &&
      normalizedFirst !== "caverna@com.br" &&
      normalizedSecond !== "caverna@com.br" &&
      normalizedFirst === normalizedSecond,
  );
}
function sameBirthDate(first: Date | null, second: Date | null) { return Boolean(first && second && first.toISOString().slice(0, 10) === second.toISOString().slice(0, 10)); }
function sameKnownAge(first: number | null, second: number | null) { return first !== null && second !== null && first === second; }
function hasConflictingAge(first: Athlete, second: Athlete) {
  if (first.birthDate && second.birthDate && !sameBirthDate(first.birthDate, second.birthDate)) return true;
  const firstAge = getAthleteProfileAge(first); const secondAge = getAthleteProfileAge(second);
  return firstAge !== null && secondAge !== null && Math.abs(firstAge - secondAge) > 1;
}
function hasSimilarName(first: string, second: string) {
  const parts = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().split(/\s+/).filter((part) => part.length > 2);
  const a = parts(first); const b = parts(second);
  if (!a.length || !b.length || a[0] !== b[0]) return false;
  if (a.join(" ") === b.join(" ")) return true;
  // Mesmo primeiro nome e pelo menos um sobrenome em comum. Apenas sobrenome
  // compartilhado não basta: irmãos e parentes seriam falsos positivos.
  return a.slice(1).some((part) => b.slice(1).includes(part));
}
function positionLabel(position: string | null) { return ({ GOLEIRO: "Goleiro", LATERAL: "Lateral", ZAGUEIRO: "Zagueiro", VOLANTE: "Volante", MEIA: "Meia", ATACANTE: "Atacante" } as Record<string, string>)[position || ""] || "-"; }
function CampaoStatus({ athlete }: { athlete: Athlete }) { const entry = athlete.registrations.find((item) => item.championship.slug === "interno-campao-2026"); if (!entry) return <span className="font-semibold text-[#6B7280]">Não disputa</span>; const team = entry.championshipPlayer?.team; return <span className="inline-flex max-w-48 items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-xs font-bold text-[#166534]">✓ {team ? <>{team.icon ? <span aria-hidden>{team.icon}</span> : null}<span className="truncate">{team.shortName || team.name}</span></> : "Inscrito · sem time"}</span>; }
function ChampionshipHistory({ athlete }: { athlete: Athlete }) { const championships = [...new Map(athlete.registrations.map((item) => [item.championship.slug, item.championship])).values()]; if (!championships.length) return <span className="text-[#6B7280]">Nenhum</span>; return <details><summary className="cursor-pointer font-bold text-[#8B6914]">{championships.length} campeonato(s)</summary><ul className="mt-2 grid gap-1 text-xs text-[#4B5563]">{championships.map((championship) => <li key={championship.slug}>{championship.name}{championship.seasonLabel ? ` · ${championship.seasonLabel}` : ""}</li>)}</ul></details>; }
function DeleteAthleteAction({ athlete }: { athlete: Athlete }) { const count = Object.values(athlete._count).reduce((total, value) => total + value, 0); if (!count) return <form action={deleteAthlete} className="mt-2"><input type="hidden" name="id" value={athlete.id} /><button className="text-xs font-bold text-[#B91C1C]">Excluir cadastro</button></form>; return <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-[#B91C1C]">Excluir assumindo o risco</summary><form action={deleteAthleteAssumingRisk} className="mt-2 grid max-w-64 gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-2 text-xs text-[#881337]"><input type="hidden" name="id" value={athlete.id} /><p className="font-semibold">Vai remover o cadastro e {historySummary(athlete._count)}. As inscrições e o texto das súmulas permanecem, mas participações, suspensões e o vínculo do atleta serão removidos.</p><label className="flex items-start gap-2"><input type="checkbox" name="acknowledgeRisk" value="yes" required className="mt-0.5" /><span>Entendo o risco e poderei precisar relançar os dados.</span></label><button className="w-fit rounded-lg bg-[#B91C1C] px-3 py-2 font-bold text-white">Excluir definitivamente</button></form></details>; }
function historySummary(counts: Athlete["_count"]) { const labels = [[counts.registrations, "inscrição"], [counts.matchParticipations + counts.matchEvents, "registro de jogo"], [counts.peladaArrivals + counts.peladaConfirmations, "pelada"], [counts.suspensions, "suspensão"]].filter(([value]) => value).map(([, label]) => label); return labels.join(", "); }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p><p className="mt-1 text-xl font-black text-[#101010]">{value}</p></div>; }
function AthleteDetails({ athlete }: { athlete: Athlete }) { return <div className="rounded-xl border border-[#ECDCA8] bg-white p-3"><p className="font-bold text-[#101010]">{athlete.fullName}</p><p className="mt-1 text-sm text-[#4B5563]">{athlete.nickname ? `${athlete.nickname} · ` : ""}{getAthleteProfileAge(athlete) ?? "idade não informada"}{getAthleteProfileAge(athlete) ? " anos" : ""}</p><p className="mt-1 text-xs text-[#6B7280]">{athlete.phone || "sem telefone"} · {athlete.email || "sem e-mail"}</p></div>; }
function AthleteForm({ action, submitLabel, athlete }: { action: (formData: FormData) => Promise<void>; submitLabel: string; athlete?: Athlete }) { return <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{athlete ? <input type="hidden" name="id" value={athlete.id} /> : null}<Field label="Nome completo *"><input name="fullName" required defaultValue={athlete?.fullName} className={inputClass} /></Field><Field label="Apelido"><input name="nickname" defaultValue={athlete?.nickname || ""} className={inputClass} /></Field><Field label="Nascimento"><input name="birthDate" type="date" defaultValue={athlete?.birthDate?.toISOString().slice(0, 10)} className={inputClass} /></Field><Field label="Idade conhecida"><input name="lastKnownAge" type="number" min="0" max="120" defaultValue={athlete?.lastKnownAge || ""} className={inputClass} /></Field><Field label="Posição"><select name="preferredPosition" defaultValue={athlete?.preferredPosition || ""} className={inputClass}><option value="">-</option>{[["GOLEIRO", "Goleiro"], ["LATERAL", "Lateral"], ["ZAGUEIRO", "Zagueiro"], ["VOLANTE", "Volante"], ["MEIA", "Meia"], ["ATACANTE", "Atacante"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Telefone"><input name="phone" defaultValue={athlete?.phone || ""} className={inputClass} /></Field><Field label="E-mail"><input name="email" type="email" defaultValue={athlete?.email || ""} className={inputClass} /></Field><Field label="Nível"><select name="defaultLevel" defaultValue={athlete?.defaultLevel || ""} className={inputClass}><option value="">-</option>{["A", "B", "C", "D", "E"].map((level) => <option key={level} value={level}>{level}</option>)}</select></Field><div className="sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-[#B89020] px-4 py-2 font-bold text-white">{submitLabel}</button></div></form>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-semibold text-[#374151]"><span>{label}</span>{children}</label>; }
const inputClass = "min-h-10 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-normal text-[#101010]";
