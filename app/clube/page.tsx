import Image from "next/image";
import Link from "next/link";

const sectionLinks = [
  { href: "#historia", label: "História" },
  { href: "#estrutura", label: "Estrutura" },
];

const historyParagraphs = [
  "O Clube Quinze Veranistas foi fundado em 25 de fevereiro de 1951, a partir da união de amigos que buscavam criar um ambiente de convivência saudável, esporte e fortalecimento dos valores familiares.",
  "Inicialmente, os encontros aconteciam em forma de piqueniques, onde se discutiam temas importantes da juventude e da sociedade, sempre com o objetivo de promover uma vivência agregadora, baseada na amizade, no respeito e na construção de uma comunidade sólida.",
  "Foi na Gruta Okey, localizada na Rua dos Tamóios, em Belo Horizonte, que nasceu a ideia do clube. Embora não fossem exatamente quinze participantes, o nome simboliza o compromisso inicial com organização, continuidade e união.",
  "Ao longo das décadas, o Clube XV se consolidou como um espaço tradicional na região da Pampulha, reunindo gerações em torno do futebol, da convivência e dos eventos sociais.",
];

const warCryLines = [
  "Tudo nos une",
  "Nada nos separa",
  "Nós somos Quinze Veranistas",
  "Um por todos",
  "Todos por um",
  "",
  "Opá, companheiro",
  "Opá! Opá! Opá!",
];

const structureItems = [
  {
    title: "Campo principal",
    description:
      "Espaço central das atividades esportivas e dos encontros ligados ao futebol no clube.",
  },
  {
    title: "Campinho",
    description: "Área complementar usada na rotina esportiva e nas atividades internas.",
  },
  {
    title: "Áreas de convivência",
    description:
      "Ambientes que reforçam o encontro entre sócios, famílias, convidados e a vida social do clube.",
  },
  {
    title: "Integração com a natureza",
    description:
      "O entorno arborizado faz parte da identidade do XV e da experiência de convivência no espaço.",
  },
  {
    title: "Iluminação disponível no campinho para jogos noturnos.",
    description:
      "A estrutura esportiva contempla uso noturno no campinho, sem generalizar essa condição para todos os campos.",
  },
];

const structureImage = {
  src: "/mapa-clube-xv.webp",
  alt: "Vista geral do Clube XV",
};

export default function ClubePage() {
  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium gap-5">
        <section className="overflow-hidden rounded-[22px] border border-[#8B6914]/18 bg-[#171717] text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
          <div className="relative min-h-[360px] sm:min-h-[420px]">
            <Image
              src="/banners/banner-pelada-campao.webp"
              alt="Campo do Clube Quinze Veranistas"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/35 to-[#0E0E0E]/88" />

            <div className="relative z-10 flex min-h-[360px] flex-col justify-end px-5 py-6 sm:min-h-[420px] sm:px-7 sm:py-8">
              <div className="max-w-2xl">
                <h1 className="xv-fluid-text text-[2rem] font-black tracking-tight text-white sm:text-[2.9rem]">
                  Clube Quinze Veranistas
                </h1>
                <p className="mt-2 text-lg font-semibold text-[#F3D27A] sm:text-xl">
                  Tradição, amizade e futebol desde 1951.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/88 sm:text-base">
                  Um espaço tradicional de Belo Horizonte onde sócios, famílias e
                  convidados se encontram para viver o futebol, a convivência e os
                  eventos do clube.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/peladas" className="xv-primary-action">
                    Acompanhar peladas
                  </Link>
                  <Link href="/calendario" className="xv-secondary-action bg-white/95">
                    Ver calendário
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <nav
          aria-label="Navegação da página do clube"
          className="xv-card scroll-mt-24 px-4 py-4 sm:px-5"
        >
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#D8C7A1] bg-[#FCF7E6] px-4 py-2 text-sm font-bold text-[#8B6914] transition hover:border-[#B89020] hover:bg-[#FFF5D9] sm:w-auto"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <section id="historia" className="xv-card scroll-mt-24">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
              História do Clube
            </span>
            <h2 className="mt-3 text-[1.7rem] font-black tracking-tight text-[#101010]">
              Uma história de convivência, continuidade e união
            </h2>

            <div className="mt-5 grid gap-4 text-sm leading-7 text-[#4B5563] sm:text-base">
              {historyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-6 rounded-[18px] border border-[#E5E7EB] bg-[#171717] px-5 py-5 text-white">
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#F3D27A]">
                Nosso lema
              </div>
              <p className="mt-3 text-lg font-black leading-8">
                Recreio e esporte a bem da cultura e da verdade.
              </p>
            </div>
          </div>
        </section>

        <section className="xv-card">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#E9EEF9] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
              Nosso Grito de Guerra
            </span>
            <h2 className="mt-3 text-[1.7rem] font-black tracking-tight text-[#101010]">
              Nosso Grito de Guerra
            </h2>

            <div className="mt-5 rounded-[18px] border border-[#E5E7EB] bg-[#FAFAFA] px-5 py-5">
              <div className="space-y-1 text-lg font-black leading-8 text-[#101010]">
                {warCryLines.map((line, index) =>
                  line ? (
                    <p key={`${line}-${index}`}>{line}</p>
                  ) : (
                    <div key={`space-${index}`} className="h-3" aria-hidden="true" />
                  ),
                )}
              </div>

              <p className="mt-5 text-sm font-semibold text-[#6B7280]">
                Autoria: Sebastião Teixeira Neves
              </p>
            </div>
          </div>
        </section>

        <section id="estrutura" className="xv-card scroll-mt-24">
          <div>
            <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
              Estrutura
            </span>
            <h2 className="mt-3 text-[1.7rem] font-black tracking-tight text-[#101010]">
              Estrutura do Clube
            </h2>
          </div>

          <div className="mt-5 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-[#F3F4F6]">
            <div className="relative aspect-[16/9]">
              <Image
                src={structureImage.src}
                alt={structureImage.alt}
                fill
                sizes="(max-width: 1120px) 100vw, 1120px"
                className="object-cover"
              />
            </div>
          </div>

          <div className="mt-5 max-w-4xl">
            <h3 className="text-lg font-black text-[#101010]">Vista geral do Clube XV</h3>
            <p className="mt-3 text-sm leading-7 text-[#4B5563] sm:text-base">
              Localizado na região da Pampulha, o clube conta com campo principal,
              campinho, áreas de convivência e espaços integrados em meio à
              natureza, proporcionando um ambiente ideal para prática esportiva e
              convivência entre sócios e convidados.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {structureItems.map((item) => (
              <article
                key={item.title}
                className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
              >
                <h3 className="text-lg font-black text-[#101010]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
