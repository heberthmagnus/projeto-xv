import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  getFirstGameRuleLabel,
  getPeladaStatusLabel,
  getPeladaTypeLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { CALENDARIO_XV_PATH } from "@/lib/routes";

export default async function PeladasPage() {
  await connection();
  const now = new Date();

  const [nextPelada, recentPastPeladas] = await Promise.all([
    prisma.pelada.findFirst({
      where: {
        status: {
          in: ["ABERTA", "EM_ANDAMENTO"],
        },
        scheduledAt: {
          gte: now,
        },
      },
      orderBy: [{ scheduledAt: "asc" }],
      include: {
        confirmations: {
          where: {
            canceledAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.pelada.findMany({
      where: {
        scheduledAt: {
          lt: now,
        },
      },
      orderBy: [{ scheduledAt: "desc" }],
      take: 5,
      include: {
        confirmations: {
          where: {
            canceledAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="xv-page-shell-soft">
      <PageContainer className="grid gap-4 md:gap-6">
        <section className="overflow-hidden rounded-[20px] bg-[#1A1A1A] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:px-7 sm:py-8">
          <div className="inline-flex rounded-full border border-[#B89020]/35 bg-[#B89020]/16 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#F3D27A]">
            Peladas do Clube
          </div>
          <h1 className="xv-fluid-text mt-4 text-[1.8rem] font-black tracking-tight sm:text-[2.5rem]">
            Confirmação rápida para o dia de jogo
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-[1rem]">
            Escolha a pelada disponível, confirme a presença com poucos toques e siga
            para o campo sem perder tempo procurando a tela certa.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HeroInfo label="Próxima pelada" value={nextPelada ? "Disponível" : "—"} />
            <HeroInfo
              label="Próximo horário"
              value={nextPelada ? formatTime(nextPelada.scheduledAt) : "—"}
            />
            <HeroInfo
              label="Confirmados previstos"
              value={nextPelada ? String(nextPelada.confirmations.length) : "—"}
            />
          </div>

          <div className="mt-5 xv-quick-nav">
            <Link href={CALENDARIO_XV_PATH}>Ver calendário</Link>
            <Link href="/">Voltar ao início</Link>
          </div>
        </section>

        <section className="xv-card">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Próxima pelada
              </span>
              <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                Confirme sua presença
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
                A próxima pelada aberta aparece em destaque para você chegar rápido
                na confirmação.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-left sm:w-auto sm:text-right">
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Status
              </div>
              <div className="text-xl font-black text-[#101010]">
                {nextPelada ? getPeladaStatusLabel(nextPelada.status) : "Sem agenda"}
              </div>
            </div>
          </div>

          {!nextPelada ? (
            <div className="rounded-[18px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-7 text-center">
              <div className="text-lg font-black tracking-tight text-[#101010]">
                Nenhuma pelada futura disponível no momento.
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                As próximas datas continuam no calendário do clube e aparecem aqui
                quando houver uma pelada aberta.
              </p>
            </div>
          ) : (
            <article className="rounded-[20px] border border-[#E8C866] bg-white p-5 shadow-[0_12px_34px_rgba(184,144,32,0.14)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full border border-[#F1D68A] bg-[#FCF7E6] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#8B6914]">
                    {getPeladaStatusLabel(nextPelada.status)}
                  </span>
                  <h3 className="xv-fluid-text mt-3 text-[1.45rem] font-black tracking-tight text-[#101010]">
                    Pelada de {formatDate(nextPelada.scheduledAt)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-[#F3F4F6] px-3 py-2 text-right">
                  <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                    Horário
                  </div>
                  <div className="text-lg font-black text-[#101010]">
                    {formatTime(nextPelada.scheduledAt)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <FactCard
                  label="Tipo"
                  value={getPeladaTypeLabel(nextPelada.type)}
                  tone="gold"
                />
                <FactCard
                  label="Primeira"
                  value={getFirstGameRuleLabel(nextPelada.firstGameRule)}
                  tone="neutral"
                />
                <FactCard
                  label="Confirmados previstos"
                  value={String(nextPelada.confirmations.length)}
                  tone="blue"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/peladas/${nextPelada.id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.7)] transition hover:from-[#D3AB35] hover:to-[#9A7618]"
                >
                  Preencher confirmação
                </Link>
                <Link
                  href={CALENDARIO_XV_PATH}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-[#4A4A4E] to-[#2F2F33] px-5 py-3 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:from-[#55555A] hover:to-[#38383C]"
                >
                  Ver no calendário
                </Link>
              </div>
            </article>
          )}
        </section>

        <section className="xv-card">
          <div className="mb-5">
            <span className="inline-flex rounded-full bg-[#F3F4F6] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#4B5563]">
              Histórico recente
            </span>
            <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
              Últimas peladas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
              Consulta rápida das peladas que já aconteceram. Esta área é apenas
              informativa.
            </p>
          </div>

          {recentPastPeladas.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-6 text-center">
              <div className="text-base font-black tracking-tight text-[#101010]">
                Nenhuma pelada recente no histórico.
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentPastPeladas.map((pelada) => (
                <article
                  key={pelada.id}
                  className="grid gap-3 rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                        {getPeladaStatusLabel(pelada.status)}
                      </span>
                      <span className="text-sm font-semibold text-[#6B7280]">
                        {formatDate(pelada.scheduledAt)} às {formatTime(pelada.scheduledAt)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-black text-[#101010]">
                      {getPeladaTypeLabel(pelada.type)}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                    <FactCard
                      label="Primeira"
                      value={getFirstGameRuleLabel(pelada.firstGameRule)}
                      tone="neutral"
                    />
                    <FactCard
                      label="Confirmados"
                      value={String(pelada.confirmations.length)}
                      tone="blue"
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}

function HeroInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/65">
        {label}
      </div>
      <div className="mt-1 text-[1.8rem] font-black leading-none text-white">{value}</div>
    </div>
  );
}

function FactCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "neutral" | "blue";
}) {
  const tones = {
    gold: {
      background: "#FCF7E6",
      border: "#F1D68A",
      color: "#8B6914",
    },
    neutral: {
      background: "#FAFAFA",
      border: "#E5E7EB",
      color: "#374151",
    },
    blue: {
      background: "#EEF2FF",
      border: "#C7D2FE",
      color: "#3450A1",
    },
  } as const;

  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        background: tones[tone].background,
        borderColor: tones[tone].border,
      }}
    >
      <div
        className="text-[0.72rem] font-bold uppercase tracking-[0.14em]"
        style={{ color: tones[tone].color }}
      >
        {label}
      </div>
      <div className="mt-1 text-base font-black leading-6 text-[#101010]">{value}</div>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
