import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { requireAdmin } from "@/lib/auth";
import {
  ensureInternoCampao2026Championship,
  getInternoCampao2026AdminRegistrationsPath,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import { updateRegistrationCategory } from "./actions";

const ADULT_CAPACITY = 98;
const MASTER_CAPACITY = 70;

type SearchParams = Promise<{
  success?: string;
}>;

export default async function InternoCampaoAdminRegistrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;

  const { data, databaseUnavailable } = await executePrismaWithFallback<{
    registrations: Array<{
      id: string;
      fullName: string;
      nickname: string | null;
      phone: string;
      category: "ADULTO" | "MASTER" | null;
      createdAt: Date;
    }>;
  }>(
    async () => {
      const championship = await ensureInternoCampao2026Championship();
      const registrations = await prisma.registration.findMany({
        where: {
          championshipId: championship.id,
        },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          fullName: true,
          nickname: true,
          phone: true,
          category: true,
          createdAt: true,
        },
      });

      return { registrations };
    },
    { registrations: [] },
    "admin:interno-campao-2026:registrations",
  );

  const adultCount = data.registrations.filter((registration) => registration.category === "ADULTO").length;
  const masterCount = data.registrations.filter((registration) => registration.category === "MASTER").length;

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        {databaseUnavailable ? (
          <DatabaseUnavailableNotice description="A estrutura da lista permanece disponível, mas os dados das inscrições não puderam ser carregados agora." className="mb-4" />
        ) : null}

        <section className="xv-card">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Campeonato Interno Campão 2026
              </div>
              <h1 className="mt-2 text-[1.8rem] font-black tracking-tight text-[#101010]">
                Inscrições
              </h1>
            </div>
            <a
              href={getInternoCampao2026AdminRegistrationsPath()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D1D5DB] px-4 py-3 font-semibold text-[#101010] transition hover:border-[#B89020] hover:text-[#8B6914]"
            >
              Recarregar
            </a>
          </div>

          {params.success === "category" ? (
            <div className="mb-4 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] px-4 py-3 text-sm text-[#065F46]">
              Categoria atualizada com sucesso.
            </div>
          ) : null}

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <SummaryBox
              label="Adulto"
              value={`${adultCount} inscritos • ${Math.max(ADULT_CAPACITY - adultCount, 0)} vagas`}
            />
            <SummaryBox
              label="Master"
              value={`${masterCount} inscritos • ${Math.max(MASTER_CAPACITY - masterCount, 0)} vagas`}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[0.74rem] uppercase tracking-[0.14em] text-[#6B7280]">
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Nome</th>
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Apelido</th>
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Telefone</th>
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Categoria</th>
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Inscrição</th>
                  <th className="border-b border-[#E5E7EB] px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[#6B7280]">
                      Nenhuma inscrição recebida ainda.
                    </td>
                  </tr>
                ) : (
                  data.registrations.map((registration) => (
                    <tr key={registration.id} className="bg-white even:bg-[#FCFCFC]">
                      <td className="border-b border-[#F1F5F9] px-4 py-3 font-semibold text-[#101010]">
                        {registration.fullName}
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">
                        {registration.nickname || "-"}
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">
                        {registration.phone}
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-3">
                        <form action={updateRegistrationCategory} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={registration.id} />
                          <select
                            name="category"
                            defaultValue={registration.category || ""}
                            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#101010]"
                          >
                            <option value="" disabled>
                              Selecionar
                            </option>
                            <option value="ADULTO">Adulto</option>
                            <option value="MASTER">Master</option>
                          </select>
                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#B89020] px-3 py-2 font-semibold text-white transition hover:bg-[#9F7C18]"
                          >
                            Salvar
                          </button>
                        </form>
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">
                        {registration.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-3 text-sm text-[#6B7280]">
                        {registration.category === "ADULTO"
                          ? "Adulto"
                          : registration.category === "MASTER"
                            ? "Master"
                            : "Sem categoria"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-[#101010]">{value}</div>
    </div>
  );
}
