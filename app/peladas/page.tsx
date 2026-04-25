import Link from "next/link";
import { connection } from "next/server";
import {
  getFirstGameRuleLabel,
  getPeladaStatusLabel,
  getPeladaTypeLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { CALENDARIO_XV_PATH } from "@/lib/routes";

export default async function PeladasPage() {
  await connection();
  const currentWeekRange = getCurrentClubWeekRange();

  const peladas = await prisma.pelada.findMany({
    where: {
      status: {
        in: ["ABERTA", "EM_ANDAMENTO"],
      },
      scheduledAt: {
        gte: currentWeekRange.startsAt,
        lte: currentWeekRange.endsAt,
      },
    },
    orderBy: [{ scheduledAt: "asc" }],
    include: {
      confirmations: {
        where: {
          parentConfirmationId: null,
          canceledAt: null,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium">
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
            <HeroInfo label="Peladas abertas" value={String(peladas.length)} />
            <HeroInfo
              label="Próximo horário"
              value={peladas[0] ? formatTime(peladas[0].scheduledAt) : "—"}
            />
            <HeroInfo
              label="Confirmados previstos"
              value={String(
                peladas.reduce((sum, pelada) => sum + pelada.confirmations.length, 0),
              )}
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
                Peladas disponíveis
              </span>
              <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                Escolha a pelada
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
                Mostramos apenas as peladas da semana corrente para a lista ficar
                leve no celular e rápida no dia a dia.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-left sm:w-auto sm:text-right">
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Semana
              </div>
              <div className="text-xl font-black text-[#101010]">
                {formatWeekRangeLabel(
                  currentWeekRange.startsAt,
                  currentWeekRange.endsAt,
                )}
              </div>
            </div>
          </div>

          {peladas.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-7 text-center">
              <div className="text-lg font-black tracking-tight text-[#101010]">
                Nenhuma pelada aberta nesta semana
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                As próximas datas continuam no calendário do clube. Quando houver
                pelada na semana corrente, ela aparece aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {peladas.map((pelada) => (
                <article
                  key={pelada.id}
                  className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-[#F1D68A] bg-[#FCF7E6] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#8B6914]">
                        {getPeladaStatusLabel(pelada.status)}
                      </span>
                      <h3 className="xv-fluid-text mt-3 text-[1.3rem] font-black tracking-tight text-[#101010]">
                        Pelada de {formatDate(pelada.scheduledAt)}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-[#F3F4F6] px-3 py-2 text-right">
                      <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                        Horário
                      </div>
                      <div className="text-lg font-black text-[#101010]">
                        {formatTime(pelada.scheduledAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <FactCard
                      label="Tipo"
                      value={getPeladaTypeLabel(pelada.type)}
                      tone="gold"
                    />
                    <FactCard
                      label="Primeira"
                      value={getFirstGameRuleLabel(pelada.firstGameRule)}
                      tone="neutral"
                    />
                    <FactCard
                      label="Confirmados previstos"
                      value={String(pelada.confirmations.length)}
                      tone="blue"
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/peladas/${pelada.id}`}
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
              ))}
            </div>
          )}
        </section>
      </div>
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

function formatWeekRangeLabel(startsAt: Date, endsAt: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return `${formatter.format(startsAt)} a ${formatter.format(endsAt)}`;
}

function getCurrentClubWeekRange() {
  const today = new Date();
  const parts = getClubDateParts(today);
  const anchor = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00-03:00`);
  const weekday = getMondayFirstWeekdayIndex(anchor);
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - weekday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    startsAt: weekStart,
    endsAt: weekEnd,
  };
}

function getClubDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
}

function getMondayFirstWeekdayIndex(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Math.max(0, weekdayOrder.indexOf(weekday));
}
