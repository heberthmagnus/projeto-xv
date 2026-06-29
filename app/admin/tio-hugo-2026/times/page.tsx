import { ChampionshipPlayerStatus } from "@prisma/client";
import { PostActionFeedbackBanner } from "@/app/post-action-feedback-banner";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { requireAdmin } from "@/lib/auth";
import {
  getChampionshipTeamsWithPlayersBySlug,
  getRequiredChampionshipBySlug,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import { ADMIN_TEAMS_PATH } from "@/lib/routes";
import {
  assignRegistrationToTeam,
  unassignChampionshipPlayer,
  updateChampionshipTeamSettings,
} from "./actions";

type SearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function TimesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  await requireAdmin();
  const { data, databaseUnavailable } = await executePrismaWithFallback<{
    championship: Awaited<ReturnType<typeof getRequiredChampionshipBySlug>> | null;
    championshipWithTeams: any;
  }>(
    async () => {
      const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
      const championshipWithTeams = await getChampionshipTeamsWithPlayersBySlug(
        TIO_HUGO_2026_SLUG,
      );

      return { championship, championshipWithTeams };
    },
    { championship: null, championshipWithTeams: null },
    "admin:championship-teams:list",
  );
  const championship = data.championship;
  const championshipWithTeams =
    data.championshipWithTeams as NonNullable<
      Awaited<ReturnType<typeof getChampionshipTeamsWithPlayersBySlug>>
    > | null;

  if (!championship || !championshipWithTeams) {
    return (
      <main className="xv-page-shell">
        <div className="xv-page-container xv-page-container-medium">
          <DatabaseUnavailableNotice description="Os times e elencos do campeonato não puderam ser carregados agora. Tente novamente em alguns instantes." />
        </div>
      </main>
    );
  }

  const teams = championshipWithTeams.teams;

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container xv-page-container-medium">
        {databaseUnavailable ? (
          <DatabaseUnavailableNotice description="A estrutura da tela permanece disponível, mas os dados atuais de times e jogadores não puderam ser carregados agora." className="mb-4" />
        ) : null}

        <PostActionFeedbackBanner pathname={ADMIN_TEAMS_PATH} searchParams={params} />

        <section className="grid gap-4">
          {teams.length === 0 ? (
            <EmptyState
              title="Ainda não há times vinculados"
              description="Nenhum elenco foi vinculado a este campeonato ainda."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {teams.map((championshipTeam) => {
                const team = championshipTeam.team;

                return (
                  <article
                    key={championshipTeam.id}
                    className="xv-card"
                    style={{
                      borderTop: `4px solid ${team.primaryColor || "#B89020"}`,
                    }}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-12 w-12 place-items-center rounded-full border bg-white text-2xl"
                          style={{
                            background: team.icon
                              ? "#FFFFFF"
                              : buildTeamBadgeBackground(
                                  team.primaryColor,
                                  team.secondaryColor,
                                ),
                            borderColor:
                              team.secondaryColor || team.primaryColor || "#E5E7EB",
                          }}
                        >
                          {team.icon || null}
                        </div>
                        <div>
                          <h3 className="text-[1.2rem] font-black tracking-tight text-[#101010]">
                            {team.shortName || team.name}
                          </h3>
                          {shouldShowSecondaryTeamName(team.shortName || team.name, team.name) ? (
                            <p className="text-sm text-[#4B5563]">{team.name}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-full bg-[#F3F4F6] px-3 py-1 text-sm font-semibold text-[#374151]">
                        {team.players.length} jogadores
                      </div>
                    </div>

                    <details className="mb-4 rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4">
                      <summary className="cursor-pointer text-sm font-bold text-[#3450A1]">
                        Ajustar dados do time
                      </summary>

                      <form
                        action={updateChampionshipTeamSettings}
                        className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_120px_110px_110px_120px_auto]"
                      >
                        <input type="hidden" name="teamId" value={team.id} />

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-[#101010]">Nome</span>
                          <input
                            type="text"
                            name="name"
                            defaultValue={team.name}
                            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                            required
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-[#101010]">Curto</span>
                          <input
                            type="text"
                            name="shortName"
                            defaultValue={team.shortName ?? ""}
                            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-[#101010]">Ordem</span>
                          <input
                            type="number"
                            min="1"
                            name="displayOrder"
                            defaultValue={championshipTeam.displayOrder ?? ""}
                            className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-[#101010]">Cor 1</span>
                          <input
                            type="color"
                            name="primaryColor"
                            defaultValue={team.primaryColor || "#101010"}
                            className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-2"
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-[#101010]">Cor 2</span>
                          <input
                            type="color"
                            name="secondaryColor"
                            defaultValue={team.secondaryColor || "#B89020"}
                            className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-2"
                          />
                        </label>

                        <div className="flex items-end">
                          <button
                            type="submit"
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#3450A1] px-4 py-3 font-bold text-white transition hover:bg-[#263D7B]"
                          >
                            Salvar time
                          </button>
                        </div>
                      </form>
                    </details>

                    {team.players.length === 0 ? (
                      <EmptyState
                        title="Time criado, elenco vazio"
                        description="Use a lista de inscritos sem time para começar a preencher este elenco."
                      />
                    ) : (
                      <div className="grid gap-3">
                        {team.players.map((player) => (
                          <div
                            key={player.id}
                            className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                          >
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-bold text-[#101010]">
                                  {player.registration.fullName}
                                </h4>
                                <p className="mt-1 text-sm text-[#4B5563]">
                                  {player.registration.nickname
                                    ? `${player.registration.nickname} • `
                                    : ""}
                                  {getPreferredPositionLabel(
                                    player.registration.preferredPosition,
                                  )}
                                  {player.registration.level
                                    ? ` • Nível ${player.registration.level}`
                                    : ""}
                                </p>
                              </div>

                              <div className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#4338CA]">
                                {getPlayerStatusLabel(player.status)}
                              </div>
                            </div>

                            <form
                              action={assignRegistrationToTeam}
                              className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_110px_110px_150px_auto]"
                            >
                              <input
                                type="hidden"
                                name="registrationId"
                                value={player.registration.id}
                              />

                              <label className="grid gap-1.5">
                                <span className="text-sm font-semibold text-[#101010]">
                                  Time
                                </span>
                                <select
                                  name="teamId"
                                  defaultValue={team.id}
                                  className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                                  required
                                >
                                  {teams.map((teamOption) => (
                                    <option
                                      key={teamOption.team.id}
                                      value={teamOption.team.id}
                                    >
                                      {teamOption.team.shortName || teamOption.team.name}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="grid gap-1.5">
                                <span className="text-sm font-semibold text-[#101010]">
                                  Camisa
                                </span>
                                <input
                                  type="number"
                                  name="squadNumber"
                                  min="0"
                                  defaultValue={player.squadNumber ?? ""}
                                  className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                                />
                              </label>

                              <label className="grid gap-1.5">
                                <span className="text-sm font-semibold text-[#101010]">
                                  Ordem
                                </span>
                                <input
                                  type="number"
                                  name="rosterOrder"
                                  min="0"
                                  defaultValue={player.rosterOrder ?? ""}
                                  className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                                />
                              </label>

                              <label className="grid gap-1.5">
                                <span className="text-sm font-semibold text-[#101010]">
                                  Status
                                </span>
                                <select
                                  name="status"
                                  defaultValue={player.status}
                                  className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                                >
                                  {PLAYER_STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <div className="flex items-end">
                                <button
                                  type="submit"
                                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#101010] px-4 py-3 font-bold text-white transition hover:bg-[#2C2C2C]"
                                >
                                  Salvar
                                </button>
                              </div>
                            </form>

                            <form
                              action={unassignChampionshipPlayer}
                              className="mt-3 flex justify-end"
                            >
                              <input
                                type="hidden"
                                name="championshipPlayerId"
                                value={player.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#F3C4C4] bg-[#FFF5F5] px-4 py-2.5 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                              >
                                Remover do time
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
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
    <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-5 py-6">
      <h3 className="text-base font-black tracking-tight text-[#101010]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#4B5563]">{description}</p>
    </div>
  );
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

function getPreferredPositionLabel(position: string) {
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

function getPlayerStatusLabel(status: ChampionshipPlayerStatus) {
  switch (status) {
    case "RESERVA":
      return "Reserva";
    case "INATIVO":
      return "Inativo";
    case "ATIVO":
    default:
      return "Ativo";
  }
}

function buildTeamBadgeBackground(
  primaryColor?: string | null,
  secondaryColor?: string | null,
) {
  const primary = primaryColor || "#D1D5DB";
  const secondary = secondaryColor || "#F9FAFB";

  return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;
}

const PLAYER_STATUS_OPTIONS: Array<{
  value: ChampionshipPlayerStatus;
  label: string;
}> = [
  { value: "ATIVO", label: "Ativo" },
  { value: "RESERVA", label: "Reserva" },
  { value: "INATIVO", label: "Inativo" },
];
