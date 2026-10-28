"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TeamFlag } from "@/components/championship/TeamFlag";
import type { PosterGame } from "./campeonatos/interno-campao-2026/round-poster";

type PeladaBannerType = "CAMPAO" | "CAMPINHO" | null;

type BannerRotativoProps = {
  nextPeladaType: PeladaBannerType;
  nextRound: { round: number; matches: PosterGame[] } | null;
};

type BannerItem = {
  title: string;
  ctaLabel: string;
  href: string;
  image: string;
};

const ROTATION_INTERVAL_MS = 7000;
const TOUCH_RESUME_DELAY_MS = 7000;
export function BannerRotativo({ nextPeladaType, nextRound }: BannerRotativoProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchResumeTimeoutRef = useRef<number | null>(null);

  const banners: BannerItem[] = [
    {
      title: "🏆 Campeonato Interno XV Campão 2026",
      ctaLabel: "Acessar campeonato",
      href: "/campeonatos/interno-campao-2026",
      image: nextRound ? "/banners/folder-rodada-estadio.png" : "/banners/banner-tio-hugo-2026.webp",
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
  const heroCopy = getHeroCopy(activeBanner.href, activeIndex === 0 ? nextRound?.round : undefined);
  const showRound = activeIndex === 0 && nextRound;
  const roundGames = showRound ? [...nextRound.matches].sort((a, b) => (a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity) - (b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity) || a.order - b.order).slice(0, 6) : [];
  const gamesByDay = Array.from(roundGames.reduce((days, game) => {
    const date = game.scheduledAt ? new Date(game.scheduledAt) : null;
    const key = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) : "sem-data";
    const games = days.get(key) ?? [];
    games.push(game);
    days.set(key, games);
    return days;
  }, new Map<string, PosterGame[]>()).entries());

  return (
    <section className="w-full px-0 py-0">
      <div className="w-full overflow-hidden border-y border-black/20">
        <div
          className={`relative overflow-hidden bg-black ${showRound ? "min-h-[390px] md:min-h-[340px] lg:min-h-[370px]" : "h-[260px] md:h-[300px] lg:h-[360px]"}`}
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

          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/55" />

          <div className={`relative z-10 mx-auto flex h-full w-full max-w-6xl px-4 sm:px-6 md:px-12 lg:px-16 ${showRound ? "flex-col gap-4 pb-8 pt-8 md:min-h-[340px] md:flex-row md:items-center md:gap-8 md:py-9 lg:min-h-[370px]" : "items-center py-6 sm:py-8 md:py-12"}`}>
            <div className={`w-full ${showRound ? "md:w-[42%]" : "max-w-[600px]"}`}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] md:text-xs">
                {activeBanner.title}
              </p>
              <h2 className="xv-fluid-text mt-2 text-[1.65rem] font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] md:mt-3 md:text-3xl lg:text-4xl">
                {heroCopy.heading}
              </h2>
              <p className="mt-2 max-w-[32rem] text-xs leading-5 text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] md:text-sm md:leading-6 lg:text-base">
                {heroCopy.description}
              </p>
              <Link
                href={activeBanner.href}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.75),0_12px_22px_rgba(0,0,0,0.24)] transition hover:from-[#D3AB35] hover:to-[#9A7618] md:mt-5 md:text-base"
              >
                {activeBanner.ctaLabel}
              </Link>
            </div>
            {showRound ? <Link href="/campeonatos/interno-campao-2026" aria-label={`Ver jogos da ${nextRound.round}ª rodada no campeonato`} className="block min-w-0 flex-1 rounded-2xl border border-[#f1ca67]/40 bg-black/55 p-3 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-4"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.15em] text-[#f4d575] sm:text-xs">Próximos confrontos</span><span className="text-[10px] font-bold text-white/70 sm:text-xs">Adulto + Master</span></div><div className="grid grid-cols-2 items-start gap-1.5">{gamesByDay.map(([day, games]) => <div key={day} className="grid min-w-0 gap-1.5">{games.map((game) => <div key={game.id} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.08] px-2 py-1.5 sm:px-3 sm:py-2"><div className="text-[10px] font-bold uppercase tracking-wide text-[#eac873]">{formatBannerDate(game.scheduledAt)} · {game.category === "MASTER" ? "Master" : "Adulto"}</div><div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] font-bold text-white sm:text-sm"><TeamFlag icon={game.homeIcon} className="w-4 shrink-0 sm:w-5" /><span className="min-w-0 truncate">{game.home}</span><span className="mx-0.5 text-[#eac873]">×</span><TeamFlag icon={game.awayIcon} className="w-4 shrink-0 sm:w-5" /><span className="min-w-0 truncate">{game.away}</span></div></div>)}</div>)}</div></Link> : null}
          </div>

          <div className="absolute right-4 top-3 z-10 flex items-center gap-2 sm:bottom-4 sm:left-6 sm:right-auto sm:top-auto md:bottom-6 md:left-12 lg:left-16">
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

function getHeroCopy(href: string, round?: number) {
  if (href.startsWith("/campeonatos/interno-campao-2026")) {
    if (round) return { heading: `${round}ª rodada da Copa do Mundo XV`, description: "Acompanhe os confrontos, a classificação e tudo sobre o campeonato." };
    return {
      heading: "Acompanhe o Campeonato Interno XV Campão 2026",
      description:
        "Veja a tabela, os jogos e as atualizações do Campeonato Interno XV Campão 2026.",
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

function formatBannerDate(value: string | null) {
  if (!value) return "Data a definir";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date).replace(",", " ·");
}
