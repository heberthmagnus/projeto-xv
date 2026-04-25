import Image from "next/image";
import { PageContainer } from "@/components/ui/PageContainer";

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

const historyImages = [
  {
    src: "/historia-praca-sao-pelagio-xv.webp",
    alt: "Registro histórico ligado à fundação e aos primeiros encontros do Clube Quinze Veranistas",
    title: "Origens do Clube XV",
    description:
      "Imagem histórica conectada ao início da trajetória do clube e ao espírito de convivência que marcou sua fundação.",
  },
  {
    src: "/inauguracao-campo-camarao-xv.webp",
    alt: "Imagem histórica da inauguração do campo do Clube Quinze Veranistas",
    title: "Estreia do Campão — 1982",
    description:
      "Em 7 de março de 1982, o Clube Quinze Veranistas viveu um marco importante com a inauguração do novo campo gramado, carinhosamente conhecido como “Canarão”. A imagem registra esse momento histórico de alegria e continuidade da vida esportiva do clube.",
  },
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
      <PageContainer className="grid gap-5">
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-start lg:gap-10">
            <div className="flex min-w-0 flex-col">
              <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                História do Clube
              </span>
              <h2 className="mt-3 text-[1.7rem] font-black tracking-tight text-[#101010]">
                Uma história de convivência, continuidade e união
              </h2>

              <div className="mt-5 grid gap-4 text-sm leading-7 text-[#4B5563] sm:text-base lg:gap-5">
                {historyParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-6 rounded-[18px] border border-[#B89020]/30 bg-[#171717] px-5 py-5 text-white shadow-[0_14px_30px_rgba(16,16,16,0.12)]">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#F3D27A]">
                  Nosso lema
                </div>
                <p className="mt-3 text-lg font-black leading-8">
                  Recreio e esporte a bem da cultura e da verdade.
                </p>
              </div>
            </div>

            <div className="grid w-full min-w-0 gap-4">
              <figure className="w-full max-w-none overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-[#F8F5EC] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <div className="relative aspect-[4/3] lg:aspect-[16/10]">
                  <Image
                    src={historyImages[0].src}
                    alt={historyImages[0].alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="px-4 py-4">
                  <div className="text-sm font-black text-[#101010]">
                    {historyImages[0].title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                    {historyImages[0].description}
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>

          <article className="mt-6 grid overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-[#F8F5EC] shadow-[0_10px_24px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-stretch">
            <div className="flex min-w-0 flex-col justify-center px-5 py-5 sm:px-6 lg:py-7">
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                Marco esportivo
              </div>
              <h3 className="mt-2 text-xl font-black tracking-tight text-[#101010]">
                {historyImages[1].title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#4B5563] sm:text-base">
                {historyImages[1].description}
              </p>
            </div>

            <div className="relative aspect-[4/3] min-w-0 lg:aspect-auto lg:min-h-[280px]">
              <Image
                src={historyImages[1].src}
                alt={historyImages[1].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
              />
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#B89020]/25 bg-[#171717] px-5 py-6 text-white shadow-[0_10px_30px_rgba(16,16,16,0.10)] sm:px-7 sm:py-7">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-[#F3D27A]/30 bg-[#F3D27A]/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#F3D27A]">
              Nosso Grito de Guerra
            </span>
            <h2 className="mt-3 text-[1.7rem] font-black tracking-tight text-white">
              Nosso Grito de Guerra
            </h2>

            <div className="mx-auto mt-5 w-full max-w-xl rounded-[16px] border border-[#F3D27A]/18 bg-[#201D16] px-5 py-5 sm:px-7">
              <div className="space-y-1 text-balance text-lg font-black leading-8 text-white sm:text-xl sm:leading-9">
                {warCryLines.map((line, index) =>
                  line ? (
                    <p key={`${line}-${index}`}>{line}</p>
                  ) : (
                    <div key={`space-${index}`} className="h-4" aria-hidden="true" />
                  ),
                )}
              </div>

              <p className="mt-6 border-t border-[#F3D27A]/20 pt-4 text-sm font-semibold text-[#F3D27A]">
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

          <div className="mt-5 max-w-none">
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
      </PageContainer>
    </main>
  );
}
