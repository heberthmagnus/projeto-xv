import { requireAdmin } from "@/lib/auth";
import { getAthleteProfileAge } from "@/lib/athlete-profiles";
import { prisma } from "@/lib/prisma";
import { createAthlete, deleteAthlete, mergeAthletes, updateAthlete } from "./actions";

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
};

type PossibleDuplicate = { first: Athlete; second: Athlete; reasons: string[] };

export default async function AthletesAdminPage() {
  await requireAdmin();

  const athletes = await prisma.athleteProfile.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true, fullName: true, nickname: true, birthDate: true, lastKnownAge: true,
      phone: true, email: true, preferredPosition: true, defaultLevel: true,
    },
  });
  const possibleDuplicates = findPossibleDuplicates(athletes);

  return <main className="xv-page-shell"><div className="xv-page-container space-y-5">
    <section className="xv-card">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Base do clube</p>
      <h1 className="mt-2 text-3xl font-black text-[#101010]">Cadastro de atletas</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Esta é a identidade única de cada atleta. Novas inscrições e confirmações aproveitam esse cadastro para reduzir duplicidades.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Atletas cadastrados" value={String(athletes.length)} />
        <Stat label="Possíveis duplicidades" value={String(possibleDuplicates.length)} />
        <Stat label="Regra atual" value="Nome normalizado único" />
      </div>
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
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E5E7EB]"><table className="min-w-full text-sm"><thead className="bg-[#FAFAFA] text-left text-xs uppercase tracking-wide text-[#6B7280]"><tr>{["Nome", "Apelido", "Idade", "Posição", "Telefone", "E-mail", "Nível", "Ações"].map((label) => <th key={label} className="border-b px-4 py-3">{label}</th>)}</tr></thead><tbody>{athletes.map((athlete) => <tr key={athlete.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold text-[#101010]">{athlete.fullName}</td><td className="px-4 py-3">{athlete.nickname || "-"}</td><td className="px-4 py-3">{getAthleteProfileAge(athlete) ?? "-"}</td><td className="px-4 py-3">{positionLabel(athlete.preferredPosition)}</td><td className="px-4 py-3">{athlete.phone || "-"}</td><td className="px-4 py-3">{athlete.email || "-"}</td><td className="px-4 py-3">{athlete.defaultLevel || "-"}</td><td className="px-4 py-3"><details><summary className="cursor-pointer font-bold text-[#8B6914]">Editar</summary><div className="mt-3 min-w-80"><AthleteForm action={updateAthlete} submitLabel="Salvar" athlete={athlete} /></div></details><form action={deleteAthlete} className="mt-2"><input type="hidden" name="id" value={athlete.id} /><button className="text-xs font-bold text-[#B91C1C]">Excluir sem histórico</button></form></td></tr>)}</tbody></table></div>
    </section>
  </div></main>;
}

function findPossibleDuplicates(athletes: Athlete[]) {
  const pairs: PossibleDuplicate[] = [];
  for (let index = 0; index < athletes.length; index += 1) for (let otherIndex = index + 1; otherIndex < athletes.length; otherIndex += 1) {
    const first = athletes[index]; const second = athletes[otherIndex]; const reasons: string[] = [];
    if (samePhone(first.phone, second.phone)) reasons.push("mesmo telefone");
    if (sameEmail(first.email, second.email)) reasons.push("mesmo e-mail");
    if (sameBirthDate(first.birthDate, second.birthDate) && hasSimilarName(first.fullName, second.fullName)) reasons.push("mesma data de nascimento e nome parecido");
    if (hasSimilarName(first.fullName, second.fullName)) reasons.push("nome muito parecido");
    if (reasons.length) pairs.push({ first, second, reasons: [...new Set(reasons)] });
  }
  return pairs;
}

function samePhone(first: string | null, second: string | null) { return Boolean(first && second && first.replace(/\D/g, "") === second.replace(/\D/g, "")); }
function sameEmail(first: string | null, second: string | null) { return Boolean(first && second && first.trim().toLowerCase() === second.trim().toLowerCase()); }
function sameBirthDate(first: Date | null, second: Date | null) { return Boolean(first && second && first.toISOString().slice(0, 10) === second.toISOString().slice(0, 10)); }
function hasSimilarName(first: string, second: string) { const a = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().split(/\s+/); const b = second.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().split(/\s+/); const shared = a.filter((part) => part.length > 2 && b.includes(part)); return shared.length >= 2 || (a.length > 1 && b.length > 1 && a[0] === b[0] && a.at(-1) === b.at(-1)); }
function positionLabel(position: string | null) { return ({ GOLEIRO: "Goleiro", LATERAL: "Lateral", ZAGUEIRO: "Zagueiro", VOLANTE: "Volante", MEIA: "Meia", ATACANTE: "Atacante" } as Record<string, string>)[position || ""] || "-"; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p><p className="mt-1 text-xl font-black text-[#101010]">{value}</p></div>; }
function AthleteDetails({ athlete }: { athlete: Athlete }) { return <div className="rounded-xl border border-[#ECDCA8] bg-white p-3"><p className="font-bold text-[#101010]">{athlete.fullName}</p><p className="mt-1 text-sm text-[#4B5563]">{athlete.nickname ? `${athlete.nickname} · ` : ""}{getAthleteProfileAge(athlete) ?? "idade não informada"}{getAthleteProfileAge(athlete) ? " anos" : ""}</p><p className="mt-1 text-xs text-[#6B7280]">{athlete.phone || "sem telefone"} · {athlete.email || "sem e-mail"}</p></div>; }
function AthleteForm({ action, submitLabel, athlete }: { action: (formData: FormData) => Promise<void>; submitLabel: string; athlete?: Athlete }) { return <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{athlete ? <input type="hidden" name="id" value={athlete.id} /> : null}<Field label="Nome completo *"><input name="fullName" required defaultValue={athlete?.fullName} className={inputClass} /></Field><Field label="Apelido"><input name="nickname" defaultValue={athlete?.nickname || ""} className={inputClass} /></Field><Field label="Nascimento"><input name="birthDate" type="date" defaultValue={athlete?.birthDate?.toISOString().slice(0, 10)} className={inputClass} /></Field><Field label="Idade conhecida"><input name="lastKnownAge" type="number" min="0" max="120" defaultValue={athlete?.lastKnownAge || ""} className={inputClass} /></Field><Field label="Posição"><select name="preferredPosition" defaultValue={athlete?.preferredPosition || ""} className={inputClass}><option value="">-</option>{[["GOLEIRO", "Goleiro"], ["LATERAL", "Lateral"], ["ZAGUEIRO", "Zagueiro"], ["VOLANTE", "Volante"], ["MEIA", "Meia"], ["ATACANTE", "Atacante"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Telefone"><input name="phone" defaultValue={athlete?.phone || ""} className={inputClass} /></Field><Field label="E-mail"><input name="email" type="email" defaultValue={athlete?.email || ""} className={inputClass} /></Field><Field label="Nível"><select name="defaultLevel" defaultValue={athlete?.defaultLevel || ""} className={inputClass}><option value="">-</option>{["A", "B", "C", "D", "E"].map((level) => <option key={level} value={level}>{level}</option>)}</select></Field><div className="sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-[#B89020] px-4 py-2 font-bold text-white">{submitLabel}</button></div></form>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-semibold text-[#374151]"><span>{label}</span>{children}</label>; }
const inputClass = "min-h-10 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-normal text-[#101010]";
