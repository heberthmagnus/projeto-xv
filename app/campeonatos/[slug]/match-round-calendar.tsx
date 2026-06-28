"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MatchStatus } from "@prisma/client";
import { getChampionshipTeamBasePath } from "@/lib/routes";

type MatchView = {
  label: string;
  order: number;
  matches: Array<{
    id: string;
    round: number;
    roundNumber: number | null;
    scheduledAt: Date | string | null;
    location: string | null;
    status: MatchStatus;
    notes: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: CalendarTeam;
    awayTeam: CalendarTeam;
    stage: {
      id: string;
      name: string;
      order: number;
      stageType: string;
    } | null;
  }>;
};

type CalendarTeam = {
  id: string;
  name: string;
  slug: string | null;
  shortName: string | null;
  icon: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export function MatchRoundCalendar({
  championshipSlug,
  matchViews,
  initialViewIndex,
  totalMatches,
}: {
  championshipSlug: string;
  matchViews: MatchView[];
  initialViewIndex: number;
  totalMatches: number;
}) {
  const [viewIndex, setViewIndex] = useState(() =>
    clampViewIndex(initialViewIndex, matchViews.length),
  );
  const currentMatchView = matchViews[viewIndex - 1] || null;
  const currentViewFinishedMatches = useMemo(
    () =>
      currentMatchView?.matches.filter((match) => match.status === "FINALIZADO")
        .length || 0,
    [currentMatchView],
  );

  const goToPrevious = () => {
    setViewIndex((current) => Math.max(1, current - 1));
  };

  const goToNext = () => {
    setViewIndex((current) => Math.min(matchViews.length, current + 1));
  };

  return (
    <article id="jogos" className="xv-card scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-[#E9EEF9] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
            Calendário do torneio
          </span>
          <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
            Jogos
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">
            Navegue pelas rodadas sem sair desta área. A troca é local, rápida e
            mantém sua posição na página.
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-right">
          <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
            Jogos cadastrados
          </div>
          <div className="text-xl font-black text-[#101010]">{totalMatches}</div>
        </div>
      </div>

      {matchViews.length > 0 && currentMatchView ? (
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-[18px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                  Rodada selecionada
                </div>
                <div className="mt-1 text-lg font-black text-[#101010]">
                  {currentMatchView.label}
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={viewIndex <= 1}
                  className="inline-flex min-h-11 min-w-[110px] flex-1 items-center justify-center rounded-full border border-[#D1D5DB] bg-white px-4 py-2.5 text-lg font-black text-[#101010] transition hover:border-[#3450A1] hover:text-[#3450A1] disabled:cursor-default disabled:border-[#E5E7EB] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] sm:min-w-11 sm:flex-none"
                  aria-label="Rodada anterior"
                >
                  <span className="md:hidden text-sm">Anterior</span>
                  <span className="hidden md:inline">{"<"}</span>
                </button>

                <div className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-full bg-[#171717] px-4 py-2.5 text-sm font-bold text-white">
                  {viewIndex} / {matchViews.length}
                </div>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={viewIndex >= matchViews.length}
                  className="inline-flex min-h-11 min-w-[110px] flex-1 items-center justify-center rounded-full border border-[#D1D5DB] bg-white px-4 py-2.5 text-lg font-black text-[#101010] transition hover:border-[#3450A1] hover:text-[#3450A1] disabled:cursor-default disabled:border-[#E5E7EB] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] sm:min-w-11 sm:flex-none"
                  aria-label="Próxima rodada"
                >
                  <span className="md:hidden text-sm">Próxima</span>
                  <span className="hidden md:inline">{">"}</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <RoundStatCard
                label="Jogos nesta vista"
                value={String(currentMatchView.matches.length)}
              />
              <RoundStatCard
                label="Finalizados"
                value={String(currentViewFinishedMatches)}
              />
              <RoundStatCard
                label="Pendentes"
                value={String(
                  currentMatchView.matches.length - currentViewFinishedMatches,
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {currentMatchView.matches.map((match) => (
              <article
                key={match.id}
                className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[#374151]">
                    {getMatchStageLabel(
                      match.stage?.name,
                      match.round,
                      match.roundNumber,
                    )}
                  </span>
                  <span className={getMatchStatusClassName(match.status)}>
                    {getMatchStatusLabel(match.status)}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <TeamFace
                    align="right"
                    name={match.homeTeam.shortName || match.homeTeam.name}
                    fullName={match.homeTeam.name}
                    icon={match.homeTeam.icon}
                    href={
                      match.homeTeam.slug
                        ? getChampionshipTeamBasePath(
                            championshipSlug,
                            match.homeTeam.slug,
                          )
                        : null
                    }
                    primaryColor={match.homeTeam.primaryColor}
                    secondaryColor={match.homeTeam.secondaryColor}
                  />

                  <div className="rounded-2xl bg-[#171717] px-4 py-3 text-center text-white sm:min-w-[106px]">
                    {match.status === "AGENDADO" ||
                    match.homeScore === null ||
                    match.awayScore === null ? (
                      <div className="text-lg font-black tracking-[0.18em] text-[#F3D27A]">
                        VS
                      </div>
                    ) : (
                      <div className="text-[1.7rem] font-black leading-none">
                        {match.homeScore}{" "}
                        <span className="text-white/[0.45]">x</span>{" "}
                        {match.awayScore}
                      </div>
                    )}
                  </div>

                  <TeamFace
                    align="left"
                    name={match.awayTeam.shortName || match.awayTeam.name}
                    fullName={match.awayTeam.name}
                    icon={match.awayTeam.icon}
                    href={
                      match.awayTeam.slug
                        ? getChampionshipTeamBasePath(
                            championshipSlug,
                            match.awayTeam.slug,
                          )
                        : null
                    }
                    primaryColor={match.awayTeam.primaryColor}
                    secondaryColor={match.awayTeam.secondaryColor}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4B5563]">
                  <span>{formatMatchDateTime(match.scheduledAt)}</span>
                  {match.location ? <span>{match.location}</span> : null}
                  {match.notes ? <span>{match.notes}</span> : null}
                  <Link
                    href={`/campeonatos/${championshipSlug}/jogos/${match.id}`}
                    className="font-bold text-[#3450A1] transition hover:text-[#263D7B]"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyPanel
          title="Jogos ainda não cadastrados"
          description="A estrutura pública já está pronta para receber calendário de rodadas, semifinais e final. Quando os confrontos entrarem no banco, esta coluna passa a refletir a agenda do campeonato."
        />
      )}
    </article>
  );
}

function clampViewIndex(value: number, max: number) {
  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }

  return Math.min(value, Math.max(max, 1));
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-7">
      <h3 className="text-lg font-black tracking-tight text-[#101010]">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4B5563]">
        {description}
      </p>
    </div>
  );
}

function TeamFace({
  align,
  name,
  fullName,
  icon,
  href,
  primaryColor,
  secondaryColor,
}: {
  align: "left" | "right";
  name: string;
  fullName: string;
  icon?: string | null;
  href?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) {
  const alignment =
    align === "right" ? "sm:text-right sm:items-end" : "sm:text-left sm:items-start";
  const nameContent = href ? (
    <Link
      href={href}
      className="font-black uppercase tracking-[0.04em] text-[#111827] transition hover:text-[#8B6914]"
    >
      {name}
    </Link>
  ) : (
    <div className="font-black uppercase tracking-[0.04em] text-[#111827]">
      {name}
    </div>
  );

  return (
    <div className={`flex flex-col items-center gap-2 text-center ${alignment}`}>
      <TeamIcon
        icon={icon}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      {nameContent}
      {shouldShowSecondaryTeamName(name, fullName) ? (
        <div className="text-xs text-[#6B7280]">{fullName}</div>
      ) : null}
    </div>
  );
}

function TeamIcon({
  icon,
  primaryColor,
  secondaryColor,
}: {
  icon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) {
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-white text-2xl"
      style={{
        background: icon ? "#FFFFFF" : buildTeamBadgeBackground(primaryColor, secondaryColor),
        borderColor: secondaryColor || primaryColor || "#E5E7EB",
      }}
    >
      {icon || null}
    </span>
  );
}

function RoundStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-3 py-3">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-[#101010]">{value}</div>
    </div>
  );
}

function getMatchStageLabel(stageName: string | undefined, round: number, roundNumber: number | null) {
  const base = stageName || `Rodada ${round}`;
  return roundNumber ? `${base} • Jogo ${roundNumber}` : base;
}

function getMatchStatusLabel(status: MatchStatus) {
  switch (status) {
    case "AGENDADO":
      return "Agendado";
    case "EM_ANDAMENTO":
      return "Em andamento";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

function getMatchStatusClassName(status: MatchStatus) {
  const base = "rounded-full px-2.5 py-1";

  switch (status) {
    case "FINALIZADO":
      return `${base} bg-[#ECFDF3] text-[#047857]`;
    case "EM_ANDAMENTO":
      return `${base} bg-[#FEF3C7] text-[#92400E]`;
    case "CANCELADO":
      return `${base} bg-[#FEE2E2] text-[#991B1B]`;
    default:
      return `${base} bg-[#E9EEF9] text-[#3450A1]`;
  }
}

function formatMatchDateTime(date: Date | string | null) {
  if (!date) {
    return "Data a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function shouldShowSecondaryTeamName(primary: string, secondary: string) {
  return normalizeTeamLabel(primary) !== normalizeTeamLabel(secondary);
}

function normalizeTeamLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildTeamBadgeBackground(primaryColor?: string | null, secondaryColor?: string | null) {
  if (primaryColor && secondaryColor) {
    return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  }

  return primaryColor || secondaryColor || "#F3F4F6";
}
