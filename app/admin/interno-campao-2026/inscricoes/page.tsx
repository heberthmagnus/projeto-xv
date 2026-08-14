import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { requireAdmin } from "@/lib/auth";
import { ensureInternoCampao2026Championship, getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import { RegistrationTable, type RegistrationTableItem } from "./registration-table";

const ADULT_CAPACITY = 91;
const MASTER_CAPACITY = 65;
type SearchParams = Promise<{ success?: string }>;
type Registration = RegistrationTableItem;

export default async function InternoCampaoAdminRegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const { data, databaseUnavailable } = await executePrismaWithFallback<{ registrations: Registration[] }>(
    async () => {
      const championship = await ensureInternoCampao2026Championship();
      const registrations = await prisma.registration.findMany({
        where: { championshipId: championship.id }, orderBy: [{ createdAt: "desc" }],
        select: { id: true, fullName: true, nickname: true, preferredPosition: true, birthDate: true, phone: true, email: true, category: true, level: true, adminNotes: true, createdAt: true },
      });
      return { registrations };
    }, { registrations: [] }, "admin:interno-campao-2026:registrations",
  );
  const goalkeepers = data.registrations.filter((r) => r.preferredPosition === "GOLEIRO");
  const adult = data.registrations.filter((r) => r.category === "ADULTO" && r.preferredPosition !== "GOLEIRO");
  const master = data.registrations.filter((r) => r.category === "MASTER" && r.preferredPosition !== "GOLEIRO");
  const uncategorized = data.registrations.filter((r) => r.category == null);

  return <main className="xv-page-shell"><div className="xv-page-container">
    {databaseUnavailable ? <DatabaseUnavailableNotice description="A estrutura da lista permanece disponível, mas os dados das inscrições não puderam ser carregados agora." className="mb-4" /> : null}
    <section className="xv-card">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">Campeonato Interno XV Campão 2026</div><h1 className="mt-2 text-[1.8rem] font-black tracking-tight text-[#101010]">Inscrições</h1></div>
        <div className="flex flex-wrap gap-3"><a href={getInternoCampao2026AdminRegistrationsPath()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D1D5DB] px-4 py-3 font-semibold text-[#101010]">Recarregar</a></div>
      </header>
      {params.success === "save" ? <Success>Categoria e nível atualizados com sucesso.</Success> : null}
      {params.success === "edit" ? <Success>Inscrição atualizada com sucesso.</Success> : null}
      {params.success === "delete" ? <Success>Inscrição excluída com sucesso.</Success> : null}
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><SummaryBox label="Adulto — linha" value={`${adult.length}/91 jogadores • ${Math.max(ADULT_CAPACITY - adult.length, 0)} vagas`} /><SummaryBox label="Master — linha" value={`${master.length}/65 jogadores • ${Math.max(MASTER_CAPACITY - master.length, 0)} vagas`} /><SummaryBox label="Goleiros" value={`${goalkeepers.length} inscritos • fora da contagem de linha`} /></div>
      <div className="grid gap-5"><RegistrationSection title="Categoria Adulto — jogadores de linha" tone="adult" registrations={adult} exportCategory="ADULTO" /><RegistrationSection title="Categoria Master — jogadores de linha" tone="master" registrations={master} exportCategory="MASTER" /><RegistrationSection title="Goleiros (Adulto e Master)" tone="neutral" registrations={goalkeepers} /><RegistrationSection title="Categoria Undefined" tone="neutral" registrations={uncategorized} /></div>
    </section>
  </div></main>;
}

function RegistrationSection({ title, tone, registrations, exportCategory }: { title: string; tone: "adult" | "master" | "neutral"; registrations: Registration[]; exportCategory?: "ADULTO" | "MASTER" }) {
  const toneClasses = tone === "adult" ? "border-[#D6C087] bg-[#FFF9EA]" : tone === "master" ? "border-[#C9D6F8] bg-[#F5F8FF]" : "border-[#E5E7EB] bg-[#FAFAFA]";
  return <section className={`rounded-2xl border p-4 ${toneClasses}`}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#101010]">{title}</h2><p className="text-sm text-[#6B7280]">{registrations.length} inscrito{registrations.length === 1 ? "" : "s"}</p></div>{exportCategory ? <a href={`${getInternoCampao2026AdminRegistrationsPath()}/export?category=${exportCategory}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#B89020] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9F7C18]">Exportar CSV</a> : null}</div><RegistrationTable registrations={registrations} /></section>;
}

function Success({ children }: { children: React.ReactNode }) { return <div className="mb-4 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] px-4 py-3 text-sm text-[#065F46]">{children}</div>; }
function SummaryBox({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3"><div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{label}</div><div className="mt-1 text-lg font-black text-[#101010]">{value}</div></div>; }
