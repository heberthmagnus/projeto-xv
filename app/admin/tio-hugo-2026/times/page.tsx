import { ChampionshipPlayerStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import {
  getChampionshipTeamsWithPlayersBySlug,
  getRequiredChampionshipBySlug,
  getTioHugoAdminTeamsPath,
  TIO_HUGO_2026_SLUG,
} from "@/lib/championships";
import {
  assignRegistrationToTeam,
  createPlaceholderTeamsAndBaseTable,
  createChampionshipTeam,
  generateBaseTableFromExistingTeams,
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
  const adminUser = await requireAdmin();
  const championship = await getRequiredChampionshipBySlug(TIO_HUGO_2026_SLUG);
  const championshipWithTeams = await getChampionshipTeamsWithPlayersBySlug(
    TIO_HUGO_2026_SLUG,
  );

  if (!championshipWithTeams) {
    throw new Error("Campeonato não encontrado.");
  }

  const teams = championshipWithTeams.teams;
  const allRegistrations = championshipWithTeams.registrations;
  const unassignedRegistrations = allRegistrations.filter(
    (registration) => !registration.championshipPlayer?.teamId,
  );
  const assignedPlayersCount = teams.reduce(
    (total, championshipTeam) => total + championshipTeam.team.players.length,
    0,
  );

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container xv-page-container-medium">
        <section className="xv-card">
          <div className="xv-responsive-stack">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B89020]">
                Elencos do campeonato
              </p>
              <h1 className="mt-1 text-[2rem] font-black tracking-tight text-[#101010]">
                Times — {championship.name}
              </h1>
              <p className="xv-muted-text mt-3 max-w-3xl">
                Esta tela organiza a transição entre inscrição individual e
                montagem real dos times. Aqui você já consegue criar os times da
                edição, alocar cada inscrito e ajustar número, ordem do elenco e
                status do jogador.
              </p>
              <p className="mt-3 text-sm text-[#4B5563]">
                Logado como <strong>{adminUser.email}</strong>
              </p>
            </div>

            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <SummaryCard label="Inscritos" value={String(allRegistrations.length)} />
              <SummaryCard label="Sem time" value={String(unassignedRegistrations.length)} />
              <SummaryCard label="Times criados" value={String(teams.length)} />
              <SummaryCard label="Jogadores alocados" value={String(assignedPlayersCount)} />
            </div>
          </div>
        </section>

        {params.success ? (
          <div className="xv-feedback-banner xv-feedback-banner-success">
            {params.success === "create-team" && "Time criado com sucesso."}
            {params.success === "create-placeholder-base" &&
              "Times-placeholder, fases e tabela base criados com sucesso."}
            {params.success === "create-base-table" &&
              "Fases, classificação base e tabela geradas com sucesso."}
            {params.success === "update-team" && "Dados do time atualizados com sucesso."}
            {params.success === "assign-player" &&
              "Jogador alocado ou atualizado com sucesso."}
            {params.success === "unassign-player" &&
              "Jogador removido do time com sucesso."}
          </div>
        ) : null}

        {params.error ? (
          <div className="xv-feedback-banner xv-feedback-banner-error">
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <article className="xv-card">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B89020]">
                Passo 1
              </p>
              <h2 className="mt-1 text-[1.45rem] font-black tracking-tight text-[#101010]">
                Criar time
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                Cadastre cada equipe da edição. Este bloco já cria o `Team` e
                faz o vínculo no campeonato.
              </p>
            </div>

            <form action={createChampionshipTeam} className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-[#101010]">Nome do time</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Ex.: Time Preto"
                  className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                  required
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-[#101010]">Nome curto</span>
                <input
                  type="text"
                  name="shortName"
                  placeholder="Ex.: Preto"
                  className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-[#101010]">Cor principal</span>
                  <input
                    type="color"
                    name="primaryColor"
                    defaultValue="#101010"
                    className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-2"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-[#101010]">Cor secundária</span>
                  <input
                    type="color"
                    name="secondaryColor"
                    defaultValue="#B89020"
                    className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-2"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#B89020] px-4 py-3 font-bold text-white transition hover:bg-[#9F7C18]"
              >
                Criar time
              </button>
            </form>
          </article>

          <article className="xv-card">
            <div className="mb-5 rounded-[20px] border border-[#E5E7EB] bg-[#FAFAFA] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                Atalho recomendado
              </p>
              <h2 className="mt-1 text-[1.35rem] font-black tracking-tight text-[#101010]">
                Criar base padrão da Copa
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                Se você quiser acelerar, este botão cria os 5 times-placeholder
                (`Time A` até `Time E`), prepara as fases e gera a tabela da
                fase classificatória em todos contra todos. Depois você só troca
                os nomes dos times reais e fecha os elencos.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniInfo label="Times padrão" value="5" />
                <MiniInfo label="Rodadas base" value="5" />
                <MiniInfo label="Jogos gerados" value="10" />
              </div>

              <form action={createPlaceholderTeamsAndBaseTable} className="mt-4">
                <button
                  type="submit"
                  disabled={teams.length > 0}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#3450A1] px-4 py-3 font-bold text-white transition hover:bg-[#263D7B] disabled:cursor-default disabled:bg-[#9CA3AF]"
                >
                  Criar base padrão da Copa
                </button>
              </form>

              {teams.length > 0 ? (
                <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                  Este atalho só fica disponível quando ainda não existem times no campeonato.
                </p>
              ) : null}

              <form action={generateBaseTableFromExistingTeams} className="mt-3">
                <button
                  type="submit"
                  disabled={teams.length !== 5 || championshipWithTeams.matches.length > 0}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#3450A1] bg-white px-4 py-3 font-bold text-[#3450A1] transition hover:bg-[#EFF4FF] disabled:cursor-default disabled:border-[#D1D5DB] disabled:text-[#9CA3AF]"
                >
                  Gerar tabela com os times atuais
                </button>
              </form>
              <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                Use este segundo botão se você preferir criar os 5 times primeiro e só depois gerar a fase classificatória.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                  Passo 2
                </p>
                <h2 className="mt-1 text-[1.45rem] font-black tracking-tight text-[#101010]">
                  Inscritos sem time
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                  Assim que os times existirem, você já consegue puxar os
                  inscritos para dentro dos elencos.
                </p>
              </div>

              <div className="rounded-full bg-[#F3F4F6] px-3 py-1 text-sm font-semibold text-[#374151]">
                {unassignedRegistrations.length} pendentes
              </div>
            </div>

            {teams.length === 0 ? (
              <EmptyState
                title="Nenhum time criado ainda"
                description="Crie os times da edição primeiro. A lista de inscritos sem time fica pronta logo abaixo para começar a alocação."
              />
            ) : unassignedRegistrations.length === 0 ? (
              <EmptyState
                title="Todos os inscritos já têm time"
                description="Ótimo sinal: a base do elenco já está totalmente distribuída entre os times do campeonato."
              />
            ) : (
              <div className="grid gap-3">
                {unassignedRegistrations.map((registration) => (
                  <form
                    key={registration.id}
                    action={assignRegistrationToTeam}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                  >
                    <input type="hidden" name="registrationId" value={registration.id} />

                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#101010]">
                          {registration.fullName}
                        </h3>
                        <p className="mt-1 text-sm text-[#4B5563]">
                          {registration.nickname ? `${registration.nickname} • ` : ""}
                          {getPreferredPositionLabel(registration.preferredPosition)}
                          {registration.level ? ` • Nível ${registration.level}` : ""}
                        </p>
                      </div>

                      <div className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#92400E]">
                        Sem time
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_110px_110px_150px_auto]">
                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-[#101010]">Time</span>
                        <select
                          name="teamId"
                          defaultValue=""
                          className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                          required
                        >
                          <option value="" disabled>
                            Selecionar time
                          </option>
                          {teams.map((championshipTeam) => (
                            <option
                              key={championshipTeam.team.id}
                              value={championshipTeam.team.id}
                            >
                              {championshipTeam.team.shortName || championshipTeam.team.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-[#101010]">Camisa</span>
                        <input
                          type="number"
                          name="squadNumber"
                          min="0"
                          className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-[#101010]">Ordem</span>
                        <input
                          type="number"
                          name="rosterOrder"
                          min="0"
                          className="rounded-xl border border-[#D1D5DB] px-3 py-2.5 outline-none transition focus:border-[#B89020]"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-[#101010]">Status</span>
                        <select
                          name="status"
                          defaultValue="ATIVO"
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
                          Alocar
                        </button>
                      </div>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid gap-4">
          <div className="xv-card">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857]">
              Passo 3
            </p>
            <h2 className="mt-1 text-[1.45rem] font-black tracking-tight text-[#101010]">
              Elencos montados
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Cada card representa um time já vinculado ao campeonato. Aqui você
              pode mover jogadores entre equipes, ajustar camisa e ordem do
              elenco ou retirar alguém do grupo.
            </p>
          </div>

          {teams.length === 0 ? (
            <EmptyState
              title="Ainda não há times vinculados"
              description="Assim que você criar os primeiros times acima, esta seção passa a exibir os elencos do campeonato."
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
                          className="h-12 w-12 rounded-full border"
                          style={{
                            background: buildTeamBadgeBackground(
                              team.primaryColor,
                              team.secondaryColor,
                            ),
                            borderColor:
                              team.secondaryColor || team.primaryColor || "#E5E7EB",
                          }}
                        />
                        <div>
                          <h3 className="text-[1.2rem] font-black tracking-tight text-[#101010]">
                            {team.shortName || team.name}
                          </h3>
                          <p className="text-sm text-[#4B5563]">{team.name}</p>
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

        <section className="xv-card">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <MiniInfo label="Fases preparadas" value={String(championshipWithTeams.stages.length)} />
            <MiniInfo label="Jogos base" value={String(championshipWithTeams.matches.length)} />
            <MiniInfo label="Linhas da tabela" value={String(championshipWithTeams.standings.length)} />
          </div>

          <h2 className="text-[1.25rem] font-black tracking-tight text-[#101010]">
            Próximo efeito prático deste bloco
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#4B5563]">
            Com os times e jogadores vinculados aqui, o próximo passo fica muito
            mais simples: alimentar jogos, classificação e detalhes públicos do
            campeonato usando a mesma base genérica que já criamos.
          </p>
          {championshipWithTeams.matches.length > 0 ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {groupMatchesByRound(championshipWithTeams.matches).map(([round, matches]) => (
                <div
                  key={round}
                  className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                    Rodada {round}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151]"
                      >
                        <strong className="text-[#101010]">
                          {match.homeTeam.shortName || match.homeTeam.name}
                        </strong>{" "}
                        x{" "}
                        <strong className="text-[#101010]">
                          {match.awayTeam.shortName || match.awayTeam.name}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <a
            href={getTioHugoAdminTeamsPath()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D1D5DB] px-4 py-3 font-semibold text-[#101010] transition hover:border-[#B89020] hover:text-[#8B6914]"
          >
            Recarregar tela de elencos
          </a>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-[1.7rem] font-black leading-none text-[#101010]">
        {value}
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-[#101010]">{value}</div>
    </div>
  );
}

function groupMatchesByRound(
  matches: Array<{
    id: string;
    round: number;
    homeTeam: { name: string; shortName: string | null };
    awayTeam: { name: string; shortName: string | null };
  }>,
) {
  const grouped = new Map<number, typeof matches>();

  for (const match of matches) {
    const current = grouped.get(match.round) || [];
    current.push(match);
    grouped.set(match.round, current);
  }

  return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
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
