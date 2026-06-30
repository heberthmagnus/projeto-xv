import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  ensureInternoCampao2026Championship,
  getInternoCampao2026RegistrationPath,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import Link from "next/link";

const ADULT_CAPACITY = 98;
const MASTER_CAPACITY = 70;

export default async function InternoCampaoTrackingPage() {
  const { data, databaseUnavailable } = await executePrismaWithFallback<{
    registrations: Array<{
      id: string;
      fullName: string;
      nickname: string | null;
      category: "ADULTO" | "MASTER" | null;
    }>;
  }>(
    async () => {
      const championship = await ensureInternoCampao2026Championship();
      const registrations = await prisma.registration.findMany({
        where: {
          championshipId: championship.id,
        },
        orderBy: [{ category: "asc" }, { fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          nickname: true,
          category: true,
        },
      });

      return { registrations };
    },
    { registrations: [] },
    "interno-campao-2026:tracking",
  );

  const adultRegistrations = data.registrations.filter(
    (registration) => registration.category === "ADULTO",
  );
  const masterRegistrations = data.registrations.filter(
    (registration) => registration.category === "MASTER",
  );

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        {databaseUnavailable ? (
          <DatabaseUnavailableNotice description="O acompanhamento continua disponível, mas os dados de inscrições não puderam ser carregados agora." />
        ) : null}

        <section className="xv-card">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Campeonato Interno Campão 2026
              </div>
              <h1 className="mt-2 text-[1.8rem] font-black tracking-tight text-[#101010]">
                Acompanhamento das inscrições
              </h1>
            </div>
            <Link
              href={getInternoCampao2026RegistrationPath()}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#B89020] px-5 py-3 font-bold text-white transition hover:bg-[#9F7C18]"
            >
              Fazer inscrição
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <CategoryCard
              title="Categoria Adulto"
              registrations={adultRegistrations}
              capacity={ADULT_CAPACITY}
            />
            <CategoryCard
              title="Categoria Master"
              registrations={masterRegistrations}
              capacity={MASTER_CAPACITY}
            />
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

function CategoryCard({
  title,
  registrations,
  capacity,
}: {
  title: string;
  registrations: Array<{
    id: string;
    fullName: string;
    nickname: string | null;
  }>;
  capacity: number;
}) {
  const remainingSpots = Math.max(capacity - registrations.length, 0);

  return (
    <article className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
        {title}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryBox label="Inscritos" value={String(registrations.length)} />
        <SummaryBox label="Capacidade" value={String(capacity)} />
        <SummaryBox label="Vagas restantes" value={String(remainingSpots)} />
      </div>

      <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="text-base font-black text-[#101010]">Lista de inscritos</h2>

        {registrations.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">Nenhum inscrito até o momento.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-3 py-2"
              >
                <div className="font-semibold text-[#101010]">
                  {registration.fullName}
                </div>
                {registration.nickname ? (
                  <div className="text-sm text-[#6B7280]">{registration.nickname}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-[#101010]">{value}</div>
    </div>
  );
}
