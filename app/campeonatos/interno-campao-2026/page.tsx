import { connection } from "next/server";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  ensureInternoCampao2026Championship,
  getInternoCampao2026RegistrationPath,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import Link from "next/link";

const ADULT_CAPACITY = 91;
const MASTER_CAPACITY = 65;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternoCampaoTrackingPage() {
  await connection();

  const { data, databaseUnavailable } = await executePrismaWithFallback<{
    registrations: Array<{
      category: "ADULTO" | "MASTER" | null;
      preferredPosition: string;
    }>;
  }>(
    async () => {
      const championship = await ensureInternoCampao2026Championship();
      const registrations = await prisma.registration.findMany({
        where: {
          championshipId: championship.id,
        },
        select: {
          category: true,
          preferredPosition: true,
        },
      });

      return { registrations };
    },
    { registrations: [] },
    "interno-campao-2026:tracking",
  );

  const adultRegistrations = data.registrations.filter(
    (registration) => registration.category === "ADULTO" && registration.preferredPosition !== "GOLEIRO",
  );
  const masterRegistrations = data.registrations.filter(
    (registration) => registration.category === "MASTER" && registration.preferredPosition !== "GOLEIRO",
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
                Campeonato Interno XV Campão 2026
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
          <p className="mt-4 text-sm text-[#6B7280]">
            As vagas acompanham apenas jogadores de linha. Goleiros permanecem na categoria Adulto ou Master, mas são organizados separadamente.
          </p>
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
    category: "ADULTO" | "MASTER" | null;
    preferredPosition: string;
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
        <SummaryBox label="Jogadores de linha inscritos" value={String(registrations.length)} />
        <SummaryBox label="Capacidade (linha)" value={String(capacity)} />
        <SummaryBox label="Vagas restantes" value={String(remainingSpots)} />
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
