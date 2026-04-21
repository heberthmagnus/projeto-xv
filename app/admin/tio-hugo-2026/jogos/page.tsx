import { MatchStatus } from "@prisma/client";
import { buildArrivalDateTimeInput } from "@/lib/peladas";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getRequiredChampionshipBySlug,
  getTioHugoAdminMatchesPath,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import {
  applyTioHugoBaseSchedule,
  createChampionshipMatch,
  updateChampionshipMatch,
} from "./actions";

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function JogosAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const adminUser = await getAuthenticatedAdmin();
  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);

  const [teams, stages, matches] = await Promise.all([
    prisma.championshipTeam.findMany({
      where: {
        championshipId: championship.id,
      },
      orderBy: [{ displayOrder: "asc" }, { seed: "asc" }, { id: "asc" }],
      select: {
        id: true,
        displayOrder: true,
        seed: true,
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    }),
    prisma.championshipStage.findMany({
      where: {
        championshipId: championship.id,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        order: true,
        stageType: true,
      },
    }),
    prisma.match.findMany({
      where: {
        championshipId: championship.id,
      },
      orderBy: [
        { stage: { order: "asc" } },
        { round: "asc" },
        { roundNumber: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        round: true,
        roundNumber: true,
        scheduledAt: true,
        location: true,
        notes: true,
        status: true,
        homeScore: true,
        awayScore: true,
        stageId: true,
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
            stageType: true,
          },
        },
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    }),
  ]);

  const groupedMatches = groupMatchesByStageAndRound(matches);
  const finalizedMatches = matches.filter((match) => match.status === "FINALIZADO").length;

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container xv-page-container-medium">
        <section className="xv-card">
          <div className="xv-responsive-stack">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                Gestão de jogos
              </p>
              <h1 className="mt-1 text-[2rem] font-black tracking-tight text-[#101010]">
                Jogos — {championship.name}
              </h1>
              <p className="xv-muted-text mt-3 max-w-3xl">
                Aqui você ajusta rodada, fase, data, status e placar das
                partidas do campeonato. A base já foi feita para funcionar com a
                Copa Tio Hugo agora e continuar reutilizável nos próximos torneios.
              </p>
              {adminUser ? (
                <p className="mt-3 text-sm text-[#4B5563]">
                  Logado como <strong>{adminUser.email}</strong>
                </p>
              ) : null}
            </div>

            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <SummaryCard label="Times" value={String(teams.length)} />
              <SummaryCard label="Fases" value={String(stages.length)} />
              <SummaryCard label="Jogos" value={String(matches.length)} />
              <SummaryCard label="Finalizados" value={String(finalizedMatches)} />
            </div>
          </div>
        </section>

        {params.success ? (
          <div className="xv-feedback-banner xv-feedback-banner-success">
            {params.success === "apply-base-schedule" &&
              "Calendário base da Copa aplicado, com rodadas datadas e mata-mata placeholder criado."}
            {params.success === "create-match" && "Jogo criado com sucesso."}
            {params.success === "update-match" && "Jogo atualizado com sucesso."}
          </div>
        ) : null}

        {params.error ? (
          <div className="xv-feedback-banner xv-feedback-banner-error">
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <article className="xv-card">
            <div className="mb-5 rounded-[20px] border border-[#E5E7EB] bg-[#FAFAFA] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B6914]">
                Atalho da Copa
              </p>
              <h2 className="mt-1 text-[1.3rem] font-black tracking-tight text-[#101010]">
                Aplicar calendário base 2026
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                Usa as datas já existentes no calendário do clube para preencher
                Rodadas 1 a 5 e também cria ou atualiza as semifinais e a final
                como confrontos-base da Copa Tio Hugo 2026.
              </p>

              <form action={applyTioHugoBaseSchedule} className="mt-4">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#B89020] px-4 py-3 font-bold text-white transition hover:bg-[#9F7C18]"
                >
                  Aplicar calendário da Copa
                </button>
              </form>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B89020]">
              Novo jogo
            </p>
            <h2 className="mt-1 text-[1.45rem] font-black tracking-tight text-[#101010]">
              Criar partida manualmente
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Use este bloco para incluir jogo extra, semifinal, final ou
              qualquer ajuste de calendário sem depender de refazer a base.
            </p>

            <form action={createChampionshipMatch} className="mt-5 grid gap-3">
              <MatchFormFields teams={teams} stages={stages} />

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#3450A1] px-4 py-3 font-bold text-white transition hover:bg-[#263D7B]"
              >
                Criar jogo
              </button>
            </form>
          </article>

          <article className="xv-card">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857]">
                  Jogos cadastrados
                </p>
                <h2 className="mt-1 text-[1.45rem] font-black tracking-tight text-[#101010]">
                  Agenda e resultados
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                  Cada card representa um jogo já cadastrado. Você pode ajustar
                  fase, rodada, data, status e placar sem mexer na estrutura geral.
                </p>
              </div>

              <a
                href={getTioHugoAdminMatchesPath()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D1D5DB] px-4 py-3 font-semibold text-[#101010] transition hover:border-[#3450A1] hover:text-[#3450A1]"
              >
                Recarregar jogos
              </a>
            </div>

            {matches.length === 0 ? (
              <EmptyState
                title="Nenhum jogo cadastrado ainda"
                description="Assim que a tabela base ou os jogos avulsos forem criados, esta área passa a concentrar toda a operação do campeonato."
              />
            ) : (
              <div className="grid gap-4">
                {groupedMatches.map((stageGroup) => (
                  <section
                    key={stageGroup.stage.id}
                    className="rounded-[20px] border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                          {getStageTypeLabel(stageGroup.stage.stageType)}
                        </div>
                        <h3 className="mt-1 text-[1.15rem] font-black text-[#101010]">
                          {stageGroup.stage.name}
                        </h3>
                      </div>

                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#374151]">
                        {stageGroup.matches.length} jogos
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {stageGroup.matches.map((match) => (
                        <details
                          key={match.id}
                          className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
                        >
                          <summary className="cursor-pointer list-none">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                                  Rodada {match.round}
                                  {match.roundNumber ? ` • Jogo ${match.roundNumber}` : ""}
                                </div>
                                <div className="mt-1 text-lg font-black text-[#101010]">
                                  {match.homeTeam.shortName || match.homeTeam.name} x{" "}
                                  {match.awayTeam.shortName || match.awayTeam.name}
                                </div>
                                <div className="mt-1 text-sm text-[#4B5563]">
                                  {formatScheduledAt(match.scheduledAt)}
                                  {match.location ? ` • ${match.location}` : ""}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className={getStatusBadgeClassName(match.status)}>
                                  {getMatchStatusLabel(match.status)}
                                </div>
                                <div className="mt-2 text-2xl font-black text-[#101010]">
                                  {match.homeScore} x {match.awayScore}
                                </div>
                              </div>
                            </div>
                          </summary>

                          <form action={updateChampionshipMatch} className="mt-4 grid gap-3">
                            <input type="hidden" name="matchId" value={match.id} />
                            <MatchFormFields
                              teams={teams}
                              stages={stages}
                              initialValues={{
                                homeTeamId: match.homeTeam.id,
                                awayTeamId: match.awayTeam.id,
                                stageId: match.stageId || "",
                                round: match.round,
                                roundNumber: match.roundNumber ?? "",
                                scheduledAt: match.scheduledAt,
                                location: match.location || "",
                                notes: match.notes || "",
                                status: match.status,
                                homeScore: match.homeScore,
                                awayScore: match.awayScore,
                              }}
                            />

                            <button
                              type="submit"
                              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#101010] px-4 py-3 font-bold text-white transition hover:bg-[#2C2C2C]"
                            >
                              Salvar jogo
                            </button>
                          </form>
                        </details>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

function MatchFormFields({
  teams,
  stages,
  initialValues,
}: {
  teams: Array<{
    team: {
      id: string;
      name: string;
      shortName: string | null;
    };
  }>;
  stages: Array<{
    id: string;
    name: string;
    stageType: string;
  }>;
  initialValues?: {
    homeTeamId: string;
    awayTeamId: string;
    stageId: string;
    round: number | string;
    roundNumber: number | string;
    scheduledAt: Date | null;
    location: string;
    notes: string;
    status: MatchStatus;
    homeScore: number | string;
    awayScore: number | string;
  };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Mandante</span>
          <select
            name="homeTeamId"
            defaultValue={initialValues?.homeTeamId || ""}
            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
            required
          >
            <option value="" disabled>
              Selecionar time
            </option>
            {teams.map((team) => (
              <option key={team.team.id} value={team.team.id}>
                {team.team.shortName || team.team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Visitante</span>
          <select
            name="awayTeamId"
            defaultValue={initialValues?.awayTeamId || ""}
            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
            required
          >
            <option value="" disabled>
              Selecionar time
            </option>
            {teams.map((team) => (
              <option key={team.team.id} value={team.team.id}>
                {team.team.shortName || team.team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Fase</span>
          <select
            name="stageId"
            defaultValue={initialValues?.stageId || ""}
            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
            required
          >
            <option value="" disabled>
              Selecionar fase
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Rodada</span>
          <input
            type="number"
            name="round"
            min="1"
            defaultValue={initialValues?.round || 1}
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
            required
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Jogo da rodada</span>
          <input
            type="number"
            name="roundNumber"
            min="1"
            defaultValue={initialValues?.roundNumber || ""}
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Data e horário</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            defaultValue={
              initialValues?.scheduledAt
                ? buildArrivalDateTimeInput(initialValues.scheduledAt)
                : ""
            }
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Status</span>
          <select
            name="status"
            defaultValue={initialValues?.status || MatchStatus.AGENDADO}
            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          >
            {Object.values(MatchStatus).map((status) => (
              <option key={status} value={status}>
                {getMatchStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Local</span>
          <input
            type="text"
            name="location"
            defaultValue={initialValues?.location || ""}
            placeholder="Ex.: Campão XV"
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[120px_120px_minmax(0,1fr)]">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Placar casa</span>
          <input
            type="number"
            name="homeScore"
            min="0"
            defaultValue={initialValues?.homeScore ?? 0}
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Placar fora</span>
          <input
            type="number"
            name="awayScore"
            min="0"
            defaultValue={initialValues?.awayScore ?? 0}
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-[#101010]">Observações</span>
          <input
            type="text"
            name="notes"
            defaultValue={initialValues?.notes || ""}
            placeholder="Opcional"
            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#3450A1]"
          />
        </label>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-[#101010]">{value}</div>
    </div>
  );
}

function EmptyState({
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

function groupMatchesByStageAndRound(
  matches: Array<{
    id: string;
    round: number;
    roundNumber: number | null;
    scheduledAt: Date | null;
    location: string | null;
    notes: string | null;
    status: MatchStatus;
    homeScore: number;
    awayScore: number;
    stageId: string | null;
    stage: {
      id: string;
      name: string;
      order: number;
      stageType: string;
    } | null;
    homeTeam: {
      id: string;
      name: string;
      shortName: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      shortName: string | null;
    };
  }>,
) {
  const groups = new Map<
    string,
    {
      stage: {
        id: string;
        name: string;
        order: number;
        stageType: string;
      };
      matches: typeof matches;
    }
  >();

  for (const match of matches) {
    const stage =
      match.stage || {
        id: "sem-fase",
        name: "Sem fase",
        order: 999,
        stageType: "OUTRO",
      };

    const current = groups.get(stage.id) || {
      stage,
      matches: [],
    };

    current.matches.push(match);
    groups.set(stage.id, current);
  }

  return Array.from(groups.values()).sort((a, b) => a.stage.order - b.stage.order);
}

function getStageTypeLabel(stageType: string) {
  switch (stageType) {
    case "GRUPO":
      return "Fase de grupo";
    case "SEMIFINAL":
      return "Mata-mata";
    case "FINAL":
      return "Decisão";
    default:
      return "Fase";
  }
}

function getMatchStatusLabel(status: MatchStatus) {
  switch (status) {
    case MatchStatus.AGENDADO:
      return "Agendado";
    case MatchStatus.EM_ANDAMENTO:
      return "Em andamento";
    case MatchStatus.FINALIZADO:
      return "Finalizado";
    case MatchStatus.CANCELADO:
      return "Cancelado";
    default:
      return status;
  }
}

function getStatusBadgeClassName(status: MatchStatus) {
  const base =
    "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]";

  if (status === MatchStatus.FINALIZADO) {
    return `${base} bg-[#DCFCE7] text-[#166534]`;
  }

  if (status === MatchStatus.EM_ANDAMENTO) {
    return `${base} bg-[#DBEAFE] text-[#1D4ED8]`;
  }

  if (status === MatchStatus.CANCELADO) {
    return `${base} bg-[#FEE2E2] text-[#B91C1C]`;
  }

  return `${base} bg-[#F3F4F6] text-[#374151]`;
}

function formatScheduledAt(date: Date | null) {
  if (!date) {
    return "Data ainda não definida";
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
