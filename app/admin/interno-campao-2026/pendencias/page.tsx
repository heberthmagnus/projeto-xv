import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";

const championshipSlug = "interno-campao-2026";

export default async function ChampionshipPendingPage() {
  await requireAdmin();
  const [registrations, profiles] = await Promise.all([
    prisma.registration.findMany({
      where: { championship: { slug: championshipSlug } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, nickname: true, phone: true, birthDate: true, athleteProfileId: true, athleteProfile: { select: { fullName: true, nickname: true, phone: true, birthDate: true } } },
    }),
    prisma.athleteProfile.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, nickname: true, phone: true, birthDate: true, registrations: { where: { championship: { slug: championshipSlug } }, select: { id: true } } },
    }),
  ]);
  const profileUseCount = new Map<string, number>();
  registrations.forEach((registration) => { if (registration.athleteProfileId) profileUseCount.set(registration.athleteProfileId, (profileUseCount.get(registration.athleteProfileId) ?? 0) + 1); });
  const withoutProfile = registrations.filter((registration) => !registration.athleteProfileId);
  const incomplete = registrations.filter((registration) => !registration.phone?.trim() || !registration.birthDate || !registration.athleteProfile?.phone?.trim() || !registration.athleteProfile?.birthDate);
  const shared = registrations.filter((registration) => registration.athleteProfileId && (profileUseCount.get(registration.athleteProfileId) ?? 0) > 1);
  const nameMismatch = registrations.filter((registration) => registration.athleteProfile && normalize(registration.fullName) !== normalize(registration.athleteProfile.fullName));
  const notRegistered = profiles.filter((profile) => profile.registrations.length === 0);
  const total = withoutProfile.length + incomplete.length + shared.length + nameMismatch.length;

  return <main className="xv-page-shell"><div className="xv-page-container space-y-5">
    <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Campeonato Interno 2026</p><h1 className="mt-1 text-3xl font-black">Pendências de cadastro</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Revise estes pontos antes da divisão dos times e do lançamento dos resultados. O mesmo atleta pode aparecer em mais de uma lista.</p><div className="mt-5 grid gap-3 sm:grid-cols-4"><Stat label="Pendências" value={total} warning={total > 0}/><Stat label="Sem ID" value={withoutProfile.length} warning={withoutProfile.length > 0}/><Stat label="Dados incompletos" value={incomplete.length} warning={incomplete.length > 0}/><Stat label="IDs compartilhados" value={shared.length} warning={shared.length > 0}/></div></section>
    <PendingSection title="Inscrições sem ID de atleta" description="Esses jogadores podem ter estatísticas e participações difíceis de consolidar até receberem um ID individual." rows={withoutProfile.map((item) => ({ name: playerName(item), detail: "Sem vínculo com o cadastro de atletas" }))} actionHref="/admin/interno-campao-2026/ids-jogadores" actionLabel="Revisar IDs" />
    <PendingSection title="Dados essenciais pendentes" description="Telefone e data de nascimento são conferidos na inscrição e no cadastro geral do atleta." rows={incomplete.map((item) => ({ name: playerName(item), detail: [!item.phone?.trim() || !item.athleteProfile?.phone?.trim() ? "telefone pendente" : null, !item.birthDate || !item.athleteProfile?.birthDate ? "nascimento pendente" : null].filter(Boolean).join(" · ") }))} actionHref="/admin/atletas" actionLabel="Abrir cadastro de atletas" />
    <PendingSection title="IDs compartilhados" description="Cada atleta deve possuir seu próprio ID. Revise para confirmar se são homônimos ou um vínculo indevido." rows={shared.map((item) => ({ name: playerName(item), detail: `ID utilizado por ${profileUseCount.get(item.athleteProfileId!) ?? 0} inscrições` }))} actionHref="/admin/interno-campao-2026/ids-jogadores?status=REVISAR" actionLabel="Corrigir vínculos" />
    <PendingSection title="Nome da inscrição diferente do cadastro" description="Pode ser apenas uma atualização de nome, mas vale conferir se o vínculo aponta para a pessoa correta." rows={nameMismatch.map((item) => ({ name: playerName(item), detail: `Cadastro: ${item.athleteProfile?.fullName}` }))} actionHref="/admin/interno-campao-2026/ids-jogadores" actionLabel="Revisar IDs" />
    <PendingSection title="Cadastros gerais ainda fora do Campão" description="Atletas existentes no cadastro do clube que não possuem inscrição neste campeonato. Use esta lista para evitar criar duplicidades." rows={notRegistered.map((item) => ({ name: getPreferredPlayerName(item.nickname, item.fullName), detail: [item.phone ? null : "telefone pendente", item.birthDate ? null : "nascimento pendente"].filter(Boolean).join(" · ") || "Sem inscrição no Campão" }))} actionHref="/admin/interno-campao-2026/elencos" actionLabel="Vincular ao elenco" />
  </div></main>;
}

function PendingSection({ title, description, rows, actionHref, actionLabel }: { title: string; description: string; rows: Array<{ name: string; detail: string }>; actionHref: string; actionLabel: string }) {
  return <section className="xv-card"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-[#6B7280]">{description}</p></div><Link href={actionHref} className="w-fit rounded-xl border border-[#B89020] px-4 py-2 text-sm font-bold text-[#8B6914] no-underline">{actionLabel}</Link></div>{rows.length ? <ul className="mt-4 divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB]">{rows.map((row, index) => <li key={`${row.name}-${index}`} className="px-4 py-3"><p className="font-bold text-[#101010]">{row.name}</p><p className="mt-0.5 text-sm text-[#6B7280]">{row.detail}</p></li>)}</ul> : <p className="mt-4 rounded-xl bg-[#ECFDF3] px-4 py-3 text-sm font-bold text-[#166534]">✓ Nenhuma pendência encontrada.</p>}</section>;
}

function Stat({ label, value, warning }: { label: string; value: number; warning?: boolean }) { return <div className={`rounded-xl border p-3 ${warning ? "border-[#F3D38A] bg-[#FFF9EA]" : "border-[#D1FAE5] bg-[#ECFDF5]"}`}><p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p><p className={`mt-1 text-2xl font-black ${warning ? "text-[#8B6914]" : "text-[#166534]"}`}>{value}</p></div>; }
function playerName(item: { nickname: string | null; fullName: string }) { return getPreferredPlayerName(item.nickname, item.fullName); }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"); }
