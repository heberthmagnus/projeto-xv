import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getChampionshipTeamPublicPageData } from "@/lib/championships";
import { getChampionshipBasePath, getChampionshipTeamBasePath } from "@/lib/routes";

type Params = Promise<{
  slug: string;
  teamSlug: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, teamSlug } = await params;
  const championship = await getChampionshipTeamPublicPageData(slug, teamSlug);

  if (!championship) {
    return {
      title: "Time não encontrado | Clube Quinze Veranistas",
    };
  }

  return {
    title: `${championship.teamEntry.team.name} | ${championship.name}`,
    description: `Elenco, jogos e acompanhamento público do ${championship.teamEntry.team.name} em ${championship.name}.`,
  };
}

export default async function ChampionshipTeamPublicPage({
  params,
}: {
  params: Params;
}) {
  await connection();

  const { slug, teamSlug } = await params;
  const championship = await getChampionshipTeamPublicPageData(slug, teamSlug);

  if (!championship) {
    notFound();
  }

  const team = championship.teamEntry.team;
  const standing = championship.currentStanding;

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium">
        <section
          className="overflow-hidden rounded-[24px] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor || "#171717"} 0%, ${team.secondaryColor || "#B89020"} 100%)`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em]">
                Time no campeonato
              </div>
              <h1 className="mt-4 text-[2rem] font-black tracking-tight sm:text-[2.6rem]">
                {team.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border border-white/40"
                    style={{ backgroundColor: team.primaryColor || "#171717" }}
                  />
                  Cor do time
                </span>
                {team.shortName ? (
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold">
                    Sigla: {team.shortName}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                {championship.name}
                {championship.seasonLabel ? ` • ${championship.seasonLabel}` : ""}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-[1rem]">
                Pagina publica do time com elenco atual, agenda de jogos e espaco pronto
                para as estatisticas que vao crescer nas proximas etapas.
              </p>
            </div>

            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <HeaderStat
                label="Posicao"
                value={standing?.rank ? `${standing.rank}º` : "-"}
              />
              <HeaderStat label="Pontos" value={String(standing?.points ?? 0)} />
              <HeaderStat label="Elenco" value={String(team.players.length)} />
              <HeaderStat
                label="Jogos"
                value={String(championship.teamMatches.length)}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={getChampionshipBasePath(championship.slug)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Voltar ao campeonato
            </Link>
            <Link
              href={getChampionshipTeamBasePath(championship.slug, team.slug || teamSlug)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Atualizar pagina
            </Link>
          </div>

          <div className="mt-5 xv-quick-nav">
            <Link href="#elenco">Elenco</Link>
            <Link href="#jogos">Jogos</Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <article id="elenco" className="xv-card overflow-hidden scroll-mt-28">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#F6E8BD] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Elenco atual
                </span>
                <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                  Jogadores do time
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
                  Base publica montada em cima do que ja existe em{" "}
                  <strong>ChampionshipPlayer</strong> e nas inscricoes do campeonato.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-right">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
                  Jogadores
                </div>
                <div className="text-xl font-black text-[#101010]">{team.players.length}</div>
              </div>
            </div>

            {team.players.length === 0 ? (
              <EmptyPanel
                title="Elenco em montagem"
                description="Os times placeholder ja podem existir publicamente, e o elenco real entra depois da divisao final do campeonato."
              />
            ) : (
              <>
                <div className="xv-mobile-card-grid md:hidden">
                  {team.players.map((player) => (
                    <article
                      key={`${player.id}-mobile`}
                      className="rounded-[18px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black text-[#101010]">
                            {player.registration.nickname || player.registration.fullName}
                          </div>
                          {player.registration.nickname ? (
                            <div className="mt-1 text-sm text-[#6B7280]">
                              {player.registration.fullName}
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-2xl bg-[#171717] px-3 py-2 text-center text-white">
                          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/60">
                            Camisa
                          </div>
                          <div className="text-lg font-black">{player.squadNumber ?? "-"}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <MobilePlayerStat
                          label="Posição"
                          value={getPositionLabel(player.registration.preferredPosition)}
                        />
                        <MobilePlayerStat
                          label="Nível"
                          value={player.registration.level || "-"}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden md:block xv-table-scroll">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="text-left text-[0.74rem] uppercase tracking-[0.14em] text-[#6B7280]">
                        <th className="border-b border-[#E5E7EB] px-3 py-3">Camisa</th>
                        <th className="border-b border-[#E5E7EB] px-3 py-3">Jogador</th>
                        <th className="border-b border-[#E5E7EB] px-3 py-3">Posicao</th>
                        <th className="border-b border-[#E5E7EB] px-3 py-3">Nivel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.players.map((player) => (
                        <tr key={player.id} className="bg-white even:bg-[#FCFCFC]">
                          <td className="border-b border-[#F1F5F9] px-3 py-3 font-black text-[#101010]">
                            {player.squadNumber ?? "-"}
                          </td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">
                            <div className="font-bold text-[#101010]">
                              {player.registration.nickname || player.registration.fullName}
                            </div>
                            {player.registration.nickname ? (
                              <div className="mt-0.5 text-xs text-[#6B7280]">
                                {player.registration.fullName}
                              </div>
                            ) : null}
                          </td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3 text-[#374151]">
                            {getPositionLabel(player.registration.preferredPosition)}
                          </td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3 text-[#374151]">
                            {player.registration.level || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </article>

          <div className="grid gap-4">
            <article className="xv-card">
              <span className="inline-flex rounded-full bg-[#E9EEF9] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
                Momento atual
              </span>
              <h2 className="mt-3 text-[1.35rem] font-black tracking-tight text-[#101010]">
                Resumo do time
              </h2>
              <div className="mt-4 grid gap-3">
                <StatCard label="Posicao" value={standing?.rank ? `${standing.rank}º` : "-"} />
                <StatCard label="Pontos" value={String(standing?.points ?? 0)} />
                <StatCard
                  label="Saldo"
                  value={String(standing?.goalDifference ?? 0)}
                />
                <StatCard label="Gols pro" value={String(standing?.goalsFor ?? 0)} />
              </div>
            </article>

            <article className="xv-card">
              <span className="inline-flex rounded-full bg-[#F3F4F6] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#4B5563]">
                Proximo bloco
              </span>
              <h2 className="mt-3 text-[1.35rem] font-black tracking-tight text-[#101010]">
                Estatisticas do time
              </h2>
              <div className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-4 py-5">
                <div className="text-base font-bold text-[#101010]">Em preparacao</div>
                <div className="mt-1 text-sm leading-6 text-[#4B5563]">
                  Aqui entram artilharia, desempenho por jogo, historico e outros
                  indicadores do time sem precisar refazer a estrutura da pagina.
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="jogos" className="xv-card scroll-mt-28">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-[#E9EEF9] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
                Agenda e resultados
              </span>
              <h2 className="mt-3 text-[1.55rem] font-black tracking-tight text-[#101010]">
                Jogos do time
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B5563]">
                Lista unica montada a partir dos jogos em que o time aparece como
                mandante ou visitante, sem criar regra paralela.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-right">
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#3450A1]">
                Partidas
              </div>
              <div className="text-xl font-black text-[#101010]">
                {championship.teamMatches.length}
              </div>
            </div>
          </div>

          {championship.teamMatches.length === 0 ? (
            <EmptyPanel
              title="Agenda ainda vazia"
              description="Quando a tabela do campeonato existir para este time, os confrontos aparecem aqui automaticamente."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {championship.teamMatches.map((match) => (
                <article
                  key={match.id}
                  className="rounded-[22px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                        {getStageLabel(match.stage?.name, match.round)}
                      </div>
                      <div className="mt-2 text-lg font-black text-[#101010]">
                        {match.isHome ? "vs" : "@"}{" "}
                        {match.opponent.slug ? (
                          <Link
                            href={getChampionshipTeamBasePath(
                              championship.slug,
                              match.opponent.slug,
                            )}
                            className="transition hover:text-[#8B6914]"
                          >
                            {match.opponent.shortName || match.opponent.name}
                          </Link>
                        ) : (
                          <span>{match.opponent.shortName || match.opponent.name}</span>
                        )}
                      </div>
                    </div>

                    <MatchStatusBadge status={match.status} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-[#4B5563] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong className="text-[#101010]">Fase/Rodada:</strong>{" "}
                          {getStageRoundLabel(match.stage?.name, match.round, match.roundNumber)}
                        </span>
                        <span>
                          <strong className="text-[#101010]">Mando:</strong>{" "}
                          {match.isHome ? "Mandante" : "Visitante"}
                        </span>
                      </div>
                      <div>
                        <strong className="text-[#101010]">Data:</strong>{" "}
                        {formatMatchDateTime(match.scheduledAt)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-center">
                      <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                        Placar
                      </div>
                      <div className="mt-1 text-xl font-black text-[#101010]">
                        {getScoreLabel(match.status, match.teamScore, match.opponentScore)}
                      </div>
                    </div>
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

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-[#101010]">{value}</div>
    </div>
  );
}

function MobilePlayerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-3 py-3">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-[#101010]">{value}</div>
    </div>
  );
}

function MatchStatusBadge({
  status,
}: {
  status: "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO";
}) {
  const tone =
    status === "FINALIZADO"
      ? "border-[#D1FAE5] bg-[#ECFDF5] text-[#047857]"
      : status === "EM_ANDAMENTO"
        ? "border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]"
        : status === "CANCELADO"
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
          : "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]";

  return (
    <div className={`rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] ${tone}`}>
      {getStatusLabel(status)}
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
    <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-4 py-5">
      <div className="text-base font-bold text-[#101010]">{title}</div>
      <div className="mt-1 text-sm leading-6 text-[#4B5563]">{description}</div>
    </div>
  );
}

function getPositionLabel(position: string) {
  switch (position) {
    case "GOLEIRO":
      return "Goleiro";
    case "LATERAL":
      return "Lateral";
    case "ZAGUEIRO":
      return "Zagueiro";
    case "VOLANTE":
      return "Volante";
    case "MEIA":
      return "Meia";
    case "ATACANTE":
      return "Atacante";
    default:
      return position;
  }
}

function getStageLabel(stageName: string | undefined, round: number) {
  return stageName || `Rodada ${round}`;
}

function getStageRoundLabel(
  stageName: string | undefined,
  round: number,
  roundNumber: number | null,
) {
  const base = getStageLabel(stageName, round);

  if (!roundNumber) {
    return base;
  }

  return `${base} • Jogo ${roundNumber}`;
}

function getStatusLabel(status: string) {
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

function getScoreLabel(status: string, teamScore: number, opponentScore: number) {
  if (status === "AGENDADO") {
    return "-";
  }

  return `${teamScore} x ${opponentScore}`;
}

function formatMatchDateTime(date: Date | null) {
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
