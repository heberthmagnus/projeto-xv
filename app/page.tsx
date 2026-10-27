import { BannerRotativo } from "./BannerRotativo";
import Link from "next/link";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { PageContainer } from "@/components/ui/PageContainer";
import { prisma } from "@/lib/prisma";
import { executePrismaWithFallback } from "@/lib/prisma-safe";

const cards = [
  {
    id: "copa-tio-hugo",
    title: "Campeonato Interno XV Campão 2026",
    text: "Acompanhe a tabela, os jogos e as informações do campeonato.",
    buttonLabel: "Ver campeonato",
    href: "/campeonatos/interno-campao-2026",
  },
  {
    id: "peladas",
    title: "Peladas",
    text: "Registre presença, acompanhe a ordem de chegada e divida os times.",
    buttonLabel: "Acessar peladas",
    href: "/peladas",
  },
];

export default async function HomePage() {
  const [{ data: openPeladas, databaseUnavailable }, { data: campao }] = await Promise.all([executePrismaWithFallback(
    () =>
      prisma.pelada.findMany({
        where: {
          status: {
            in: ["ABERTA", "EM_ANDAMENTO"],
          },
        },
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
        select: {
          type: true,
          scheduledAt: true,
        },
      }),
    [],
    "home:open-peladas",
  ), executePrismaWithFallback(() => prisma.championship.findUnique({
    where: { slug: "interno-campao-2026" },
    select: {
      teams: { select: { groupLabel: true, team: { select: { id: true } } } },
      matches: { select: { id: true, round: true, roundNumber: true, status: true, scheduledAt: true, homeTeam: { select: { id: true, name: true, shortName: true, icon: true } }, awayTeam: { select: { name: true, shortName: true, icon: true } } } },
    },
  }), null, "home:campao-rodada")]);
  const now = new Date();
  const upcoming = campao?.matches.filter((match) => match.scheduledAt && match.scheduledAt >= now && !["FINALIZADO", "CANCELADO"].includes(match.status)).sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime() || a.round - b.round)[0];
  const categoryByTeam = new Map(campao?.teams.map((entry) => [entry.team.id, entry.groupLabel === "MASTER" ? "MASTER" as const : "ADULTO" as const]));
  const nextRound = upcoming ? { round: upcoming.round, matches: (campao?.matches ?? []).filter((match) => match.round === upcoming.round && match.status !== "CANCELADO").map((match) => ({ id: match.id, round: match.round, order: match.roundNumber ?? 0, status: match.status, scheduledAt: match.scheduledAt?.toISOString() ?? null, category: categoryByTeam.get(match.homeTeam.id) ?? "ADULTO" as const, home: match.homeTeam.shortName || match.homeTeam.name, homeIcon: match.homeTeam.icon, away: match.awayTeam.shortName || match.awayTeam.name, awayIcon: match.awayTeam.icon })) } : null;
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const nextPelada =
    openPeladas.find((pelada) => {
      const peladaDayKey = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(pelada.scheduledAt);

      return peladaDayKey >= todayKey;
    }) || openPeladas[0] || null;

  return (
    <main id="inicio" className="bg-[#F5F0E8] text-[#1A1A1A]">
      <BannerRotativo nextPeladaType={nextPelada?.type ?? null} nextRound={nextRound} />

      <section className="py-8 md:py-10">
        <PageContainer className="grid gap-4 md:gap-6">
          {databaseUnavailable ? (
            <DatabaseUnavailableNotice description="A página inicial continua disponível, mas os dados ao vivo das peladas não puderam ser carregados agora." />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {cards.map((card) => (
            <article
              key={card.id}
              id={card.id}
              className="flex min-h-[216px] flex-col justify-between rounded-xl border border-[#E5D8C7] bg-white p-6 shadow-[0_18px_40px_rgba(96,72,28,0.10)] sm:p-8"
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl leading-none">
                    {card.id === "peladas" ? "⚽" : "🏆"}
                  </span>
                  <h3 className="xv-fluid-text text-[1.45rem] font-bold text-[#1A1A1A] sm:text-[2rem]">{card.title}</h3>
                </div>
                <p className="text-[0.98rem] leading-7 text-[#1A1A1A] sm:text-base">
                  {card.text}
                </p>
              </div>

              <Link
                href={card.href}
                className={`mt-7 inline-flex min-h-11 w-full items-center justify-center self-start rounded-full px-5 py-3 text-[1rem] font-semibold text-white transition sm:w-auto sm:text-[1.05rem] ${
                  card.id === "copa-tio-hugo"
                    ? "bg-gradient-to-b from-[#C49B25] to-[#8B6914] hover:from-[#D3AB35] hover:to-[#9A7618]"
                    : "bg-[#1A1A1A] hover:bg-[#B8960C]"
                }`}
              >
                {card.buttonLabel}
              </Link>
            </article>
          ))}
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
