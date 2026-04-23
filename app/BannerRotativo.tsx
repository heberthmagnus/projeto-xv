"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PeladaBannerType = "CAMPAO" | "CAMPINHO" | null;

type BannerRotativoProps = {
  nextPeladaType: PeladaBannerType;
};

type BannerItem = {
  title: string;
  ctaLabel: string;
  href: string;
  image: string;
};

const ROTATION_INTERVAL_MS = 7000;
const TOUCH_RESUME_DELAY_MS = 7000;
export function BannerRotativo({ nextPeladaType }: BannerRotativoProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchResumeTimeoutRef = useRef<number | null>(null);

  const banners: BannerItem[] = [
    {
      title: "🏆 Copa Tio Hugo 2026",
      ctaLabel: "Me inscrever",
      href: "/campeonatos/tio-hugo-2026/inscricao",
      image: "/banners/banner-tio-hugo-2026.webp",
    },
    {
      title: "⚽ Próxima pelada",
      ctaLabel: "Ver pelada",
      href: "/peladas",
      image:
        nextPeladaType === "CAMPAO"
          ? "/banners/banner-pelada-campao.webp"
          : "/banners/banner-pelada-campinho.webp",
    },
    {
      title: "📅 Calendário XV",
      ctaLabel: "Ver calendário",
      href: "/calendario",
      image: "/banners/banner-calendarioXV.webp",
    },
  ];

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % banners.length);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [banners.length, isPaused]);

  useEffect(() => {
    return () => {
      if (touchResumeTimeoutRef.current) {
        window.clearTimeout(touchResumeTimeoutRef.current);
      }
    };
  }, []);

  const scheduleResume = () => {
    if (touchResumeTimeoutRef.current) {
      window.clearTimeout(touchResumeTimeoutRef.current);
    }

    touchResumeTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
      touchResumeTimeoutRef.current = null;
    }, TOUCH_RESUME_DELAY_MS);
  };

  const handleIndicatorClick = (index: number) => {
    setActiveIndex(index);
    setIsPaused(true);
    scheduleResume();
  };

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    scheduleResume();
  };

  const activeBanner = banners[activeIndex];
  const heroCopy = getHeroCopy(activeBanner.href);

  return (
    <section className="w-full px-0 py-0">
      <div className="w-full overflow-hidden border-y border-black/20">
        <div
          className="relative h-[220px] overflow-hidden bg-black md:h-[300px] lg:h-[360px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0">
            <Image
              src={activeBanner.image}
              alt={activeBanner.title}
              fill
              priority={activeIndex === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

          <div className="mx-auto flex h-full w-full max-w-6xl items-center px-6 py-8 md:px-12 md:py-12 lg:px-16">
            <div className="relative z-10 max-w-[600px]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] md:text-xs">
                {activeBanner.title}
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] md:text-3xl lg:text-4xl">
                {heroCopy.heading}
              </h2>
              <p className="mt-2 max-w-[32rem] text-xs leading-5 text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] md:text-sm md:leading-6 lg:text-base">
                {heroCopy.description}
              </p>
              <Link
                href={activeBanner.href}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_rgba(73,54,9,0.75),0_12px_22px_rgba(0,0,0,0.24)] transition hover:scale-[1.01] hover:from-[#D3AB35] hover:to-[#9A7618] md:text-base"
              >
                {activeBanner.ctaLabel}
              </Link>
            </div>
          </div>

          <div className="absolute bottom-4 left-6 z-10 flex items-center gap-2 md:bottom-6 md:left-12 lg:left-16">
            {banners.map((banner, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={banner.href}
                  type="button"
                  aria-label={`Ir para banner ${index + 1}`}
                  aria-pressed={isActive}
                  onClick={() => handleIndicatorClick(index)}
                  className={`h-2.5 rounded-full border border-white/20 transition ${
                    isActive
                      ? "w-7 bg-[#F2C76B]"
                      : "w-2.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function getHeroCopy(href: string) {
  if (href === "/campeonatos/tio-hugo-2026/inscricao") {
    return {
      heading: "Participe da disputa mais tradicional do nosso calendário",
      description:
        "Garanta sua vaga na Copa Tio Hugo 2026 e entre em campo em um campeonato que movimenta o XV do início ao fim.",
    };
  }

  if (href === "/peladas") {
    return {
      heading: "Organize sua presença no futebol do dia sem perder tempo",
      description:
        "Veja a próxima pelada, confirme presença e acompanhe o movimento da rodada com clareza e rapidez.",
    };
  }

  return {
    heading: "Acompanhe o que vem por aí no clube com mais organização",
    description:
      "Consulte os próximos eventos, datas importantes e a agenda esportiva do XV em um só lugar.",
  };
}
