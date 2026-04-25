import { BannerRotativo } from "./BannerRotativo";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { prisma } from "@/lib/prisma";
import { getChampionshipBasePath } from "@/lib/routes";

const cards = [
  {
    id: "copa-tio-hugo",
    title: "Copa Tio Hugo",
    text: "Saiba tudo sobre o campeonato, regulamento e inscrições.",
    buttonLabel: "Saiba mais",
    href: getChampionshipBasePath("tio-hugo-2026"),
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
  const openPeladas = await prisma.pelada.findMany({
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
  });
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
      <BannerRotativo nextPeladaType={nextPelada?.type ?? null} />

      <section className="py-8 md:py-10">
        <PageContainer className="grid gap-4 md:grid-cols-2 md:gap-6">
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
        </PageContainer>
      </section>
    </main>
  );
}
