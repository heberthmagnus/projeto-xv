import Link from "next/link";

const cards = [
  {
    id: "copa-tio-hugo",
    title: "Copa Tio Hugo",
    text: "Saiba tudo sobre o campeonato, regulamento e inscrições.",
    buttonLabel: "Saiba mais",
    href: "/campeonatos/tio-hugo-2026/inscricao",
  },
  {
    id: "peladas",
    title: "Peladas",
    text: "Registre presença, acompanhe a ordem de chegada e divida os times.",
    buttonLabel: "Acessar peladas",
    href: "/peladas",
  },
];

export default function HomePage() {
  return (
    <main id="inicio" className="bg-[#F5F0E8] text-[#1A1A1A]">
      <section className="w-full px-0 py-0">
        <div className="w-full overflow-hidden border-y border-black/20">
          <div
            className="relative min-h-[320px] bg-[#1A1A1A] bg-cover bg-center sm:min-h-[380px] md:min-h-[440px]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(24,19,14,0.78) 0%, rgba(24,19,14,0.58) 32%, rgba(24,19,14,0.24) 60%, rgba(24,19,14,0.52) 100%), url('/banner-copa-tio-hugo.webp')",
            }}
          >
            <div className="mx-auto flex min-h-[320px] w-full max-w-6xl items-center px-4 py-8 sm:min-h-[380px] md:min-h-[440px] md:px-10">
              <div className="max-w-3xl">
                <h2 className="mb-4 text-[2.15rem] font-black uppercase leading-none tracking-tight text-[#F2C76B] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] sm:text-[2.6rem] md:mb-5 md:text-[3.5rem]">
                  Copa Tio Hugo 2026
                </h2>
                <p className="mb-4 max-w-3xl text-base font-light leading-[1.65] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.82)] sm:text-[1.08rem] md:mb-5 md:text-[1.35rem]">
                  <span className="font-extrabold">Inscrições abertas</span> para mais uma edição da tradicional{" "}
                  <span className="font-extrabold">Copa Tio Hugo.</span> Participe e acompanhe a organização das equipes.
                </p>
                <p className="mb-6 text-[1.45rem] font-extrabold text-[#F2C76B] drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] sm:text-[1.7rem] md:mb-8 md:text-[1.95rem]">
                  Início do campeonato: 07/05/2026
                </p>
                <Link
                  href="/campeonatos/tio-hugo-2026/inscricao"
                  className="inline-flex min-h-11 rounded-sm border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-6 py-3 text-[0.96rem] font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.75),0_12px_22px_rgba(0,0,0,0.24)] transition hover:from-[#D3AB35] hover:to-[#9A7618] sm:px-7 sm:py-3.5 sm:text-[1rem]"
                >
                  Fazer inscrição
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-4 md:px-6 md:pb-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
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
                  <h3 className="text-[1.7rem] font-bold text-[#1A1A1A] sm:text-[2rem]">{card.title}</h3>
                </div>
                <p className="text-[0.98rem] leading-7 text-[#1A1A1A] sm:text-base">
                  {card.text}
                </p>
              </div>

              <Link
                href={card.href}
                className={`mt-7 inline-flex self-start rounded-full px-5 py-3 text-[1.05rem] font-semibold text-white transition ${
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
      </section>
    </main>
  );
}
