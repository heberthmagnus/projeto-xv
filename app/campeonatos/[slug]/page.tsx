import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ChampionshipFormat, ChampionshipRegistrationMode, ChampionshipStatus, MatchStatus, StandingMovement } from "@prisma/client";
import { getChampionshipPublicPageDataBySlug } from "@/lib/championships";
import { getChampionshipRegistrationPath } from "@/lib/routes";

type Params = Promise<{
  slug: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const championship = await getChampionshipPublicPageDataBySlug(slug);

  if (!championship) {
    return {
      title: "Campeonato não encontrado | Clube Quinze Veranistas",
    };
  }

  return {
    title: `${championship.name} | Clube Quinze Veranistas`,
    description:
      championship.description ||
      `Acompanhe classificação, jogos e novidades de ${championship.name}.`,
  };
}

export default async function ChampionshipPublicPage({
  params,
}: {
  params: Params;
}) {
  await connection();

  const { slug } = await params;
  const championship = await getChampionshipPublicPageDataBySlug(slug);

  if (!championship) {
    notFound();
  }

  const registrationPath = getChampionshipRegistrationPath(championship.slug);
  const showRegistrationAction =
    championship.registrationMode === "INDIVIDUAL" ||
    championship.registrationMode === "POR_EQUIPES";
  const heroDescription =
    championship.description ||
    "Esta é a nova base pública do campeonato. Ela já nasce pronta para concentrar classificação, jogos e evolução do torneio sem quebrar o fluxo atual.";

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium">
        <section className="overflow-hidden rounded-[20px] bg-[#171717] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8">
          <div className="mb-4 inline-flex rounded-full border border-[#B89020]/40 bg-[#B89020]/15 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#F3D27A]">
            Campeonato do Clube Quinze Veranistas
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-[2rem] font-black leading-none tracking-tight sm:text-[2.6rem]">
                {championship.name}
              </h1>
              <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-white/[0.82] sm:text-[1.05rem]">
                {heroDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <InfoPill label="Formato" value={getFormatLabel(championship.format)} />
                <InfoPill label="Status" value={getStatusLabel(championship.status)} />
                <InfoPill
                  label="Inscrição"
                  value={getRegistrationModeLabel(championship.registrationMode)}
                />
                <InfoPill
                  label="Período"
                  value={formatChampionshipWindow(
                    championship.startsAt,
                    championship.endsAt,
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {showRegistrationAction ? (
                <Link
                  href={registrationPath}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.7)] transition hover:from-[#D3AB35] hover:to-[#9A7618]"
                >
                  {championship.slug === "tio-hugo-2026"
                    ? "Fazer inscrição"
                    : "Acessar inscrição"}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroStat label="Inscritos" value={String(championship._count.registrations)} />
            <HeroStat label="Times" value={String(championship._count.teams)} />
            <HeroStat label="Jogos" value={String(championship._count.matches)} />
            <HeroStat label="Elencos montados" value={String(championship._count.players)} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <article className="xv-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Coluna esquerda
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Classificação
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#4B5563]">
                  A base já está preparada para receber a tabela definitiva do campeonato.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-right">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Registros
                </div>
                <div className="text-xl font-black text-[#101010]">
                  {championship.standings.length}
                </div>
              </div>
            </div>

            {championship.standings.length > 0 ? (
              <div className="xv-table-scroll">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-[0.74rem] uppercase tracking-[0.14em] text-[#6B7280]">
                      <th className="border-b border-[#E5E7EB] px-3 py-3">#</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3">Time</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">Pts</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">J</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">V</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">E</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">D</th>
                      <th className="border-b border-[#E5E7EB] px-3 py-3 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championship.standings.map((standing) => (
                      <tr key={standing.id} className="bg-white even:bg-[#FCFCFC]">
                        <td className="border-b border-[#F1F5F9] px-3 py-3 font-black text-[#101010]">
                          <div className="flex items-center gap-2">
                            <span>{standing.rank ?? "-"}</span>
                            <span className="text-xs">
                              {getMovementIcon(standing.movement)}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3">
                          <div className="font-semibold text-[#101010]">
                            {standing.team.shortName || standing.team.name}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {standing.team.name}
                          </div>
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center font-bold text-[#101010]">
                          {standing.points}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.gamesPlayed}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.wins}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.draws}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center text-[#374151]">
                          {standing.losses}
                        </td>
                        <td className="border-b border-[#F1F5F9] px-3 py-3 text-center font-semibold text-[#374151]">
                          {formatGoalDifference(standing.goalDifference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyPanel
                title="Tabela ainda em preparação"
                description="Quando os times forem definidos e a classificação começar a ser alimentada, esta coluna já recebe a tabela do campeonato sem precisar refazer a estrutura da página."
              />
            )}
          </article>

          <article className="xv-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#E9EEF9] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
                  Coluna direita
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Jogos
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
                  Aqui entram rodadas, mata-mata e o acompanhamento cronológico das partidas.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-right">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
                  Partidas
                </div>
                <div className="text-xl font-black text-[#101010]">
                  {championship.matches.length}
                </div>
              </div>
            </div>

            {championship.matches.length > 0 ? (
              <div className="grid gap-3">
                {championship.matches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[#374151]">
                        {getMatchStageLabel(match.stage?.name, match.round, match.roundNumber)}
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
                        primaryColor={match.homeTeam.primaryColor}
                        secondaryColor={match.homeTeam.secondaryColor}
                      />

                      <div className="min-w-[106px] rounded-2xl bg-[#171717] px-4 py-3 text-center text-white">
                        {match.status === "AGENDADO" ? (
                          <div className="text-lg font-black tracking-[0.18em] text-[#F3D27A]">
                            VS
                          </div>
                        ) : (
                          <div className="text-[1.7rem] font-black leading-none">
                            {match.homeScore} <span className="text-white/[0.45]">x</span>{" "}
                            {match.awayScore}
                          </div>
                        )}
                      </div>

                      <TeamFace
                        align="left"
                        name={match.awayTeam.shortName || match.awayTeam.name}
                        fullName={match.awayTeam.name}
                        primaryColor={match.awayTeam.primaryColor}
                        secondaryColor={match.awayTeam.secondaryColor}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4B5563]">
                      <span>{formatMatchDateTime(match.scheduledAt)}</span>
                      {match.location ? <span>{match.location}</span> : null}
                      {match.notes ? <span>{match.notes}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="Jogos ainda não cadastrados"
                description="A estrutura pública já está pronta para receber calendário de rodadas, semifinais e final. Quando os confrontos entrarem no banco, esta coluna passa a refletir a agenda do campeonato."
              />
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/[0.6]">
        {label}
      </div>
      <div className="mt-1 text-[1.8rem] font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-2 text-sm text-white/[0.88]">
      <span className="font-bold text-white">{label}:</span> {value}
    </div>
  );
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
  primaryColor,
  secondaryColor,
}: {
  align: "left" | "right";
  name: string;
  fullName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) {
  const alignment = align === "right" ? "sm:text-right sm:items-end" : "sm:text-left sm:items-start";

  return (
    <div className={`flex flex-col items-center gap-2 text-center ${alignment}`}>
      <div
        className="h-11 w-11 rounded-full border"
        style={{
          background: buildTeamBadgeBackground(primaryColor, secondaryColor),
          borderColor: secondaryColor || primaryColor || "#E5E7EB",
        }}
      />
      <div className="font-black uppercase tracking-[0.04em] text-[#111827]">
        {name}
      </div>
      <div className="text-xs text-[#6B7280]">{fullName}</div>
    </div>
  );
}

function getFormatLabel(format: ChampionshipFormat) {
  switch (format) {
    case "PONTOS_CORRIDOS":
      return "Pontos corridos";
    case "MATA_MATA":
      return "Mata-mata";
    case "MISTO":
      return "Misto";
    default:
      return format;
  }
}

function getStatusLabel(status: ChampionshipStatus) {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    case "RASCUNHO":
    default:
      return "Em preparação";
  }
}

function getRegistrationModeLabel(mode: ChampionshipRegistrationMode) {
  switch (mode) {
    case "INDIVIDUAL":
      return "Individual";
    case "POR_EQUIPES":
      return "Por equipes";
    case "FECHADO":
      return "Fechado";
    default:
      return mode;
  }
}

function getMatchStatusLabel(status: MatchStatus) {
  switch (status) {
    case "EM_ANDAMENTO":
      return "Ao vivo";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    case "AGENDADO":
    default:
      return "Agendado";
  }
}

function getMatchStatusClassName(status: MatchStatus) {
  switch (status) {
    case "FINALIZADO":
      return "rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[#047857]";
    case "EM_ANDAMENTO":
      return "rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[#92400E]";
    case "CANCELADO":
      return "rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[#B91C1C]";
    case "AGENDADO":
    default:
      return "rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[#4338CA]";
  }
}

function getMovementIcon(movement: StandingMovement) {
  switch (movement) {
    case "SUBIU":
      return "▲";
    case "CAIU":
      return "▼";
    case "MANTEVE":
    default:
      return "•";
  }
}

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatChampionshipWindow(startsAt?: Date | null, endsAt?: Date | null) {
  if (startsAt && endsAt) {
    return `${formatDate(startsAt)} a ${formatDate(endsAt)}`;
  }

  if (startsAt) {
    return `A partir de ${formatDate(startsAt)}`;
  }

  if (endsAt) {
    return `Até ${formatDate(endsAt)}`;
  }

  return "A definir";
}

function formatMatchDateTime(date?: Date | null) {
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
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getMatchStageLabel(
  stageName?: string | null,
  round?: number | null,
  roundNumber?: number | null,
) {
  if (stageName) {
    return stageName;
  }

  if (roundNumber) {
    return `Rodada ${roundNumber}`;
  }

  if (round) {
    return `Rodada ${round}`;
  }

  return "Partida";
}

function buildTeamBadgeBackground(
  primaryColor?: string | null,
  secondaryColor?: string | null,
) {
  const primary = primaryColor || "#D1D5DB";
  const secondary = secondaryColor || "#F9FAFB";

  return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;
}
