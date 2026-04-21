import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getChampionshipTeamPublicPageData } from "@/lib/championships";
import { getChampionshipBasePath, getChampionshipTeamBasePath } from "@/lib/routes";

type Params = Promise<{
  slug: string;
  teamSlug: string;
}>;

export default async function ChampionshipTeamPublicPage({
  params,
}: {
  params: Params;
}) {
  await connection();

  const { slug, teamSlug } = await params;
  const championship = await getChampionshipTeamPublicPageData(slug, teamSlug);
  const championshipTeam = championship?.teams[0];

  if (!championship || !championshipTeam) {
    notFound();
  }

  const team = championshipTeam.team;
  const standing = team.standings[0] || null;
  const matches = [
    ...team.homeMatches.map((match) => ({
      id: match.id,
      round: match.round,
      roundNumber: match.roundNumber,
      stage: match.stage,
      opponent: match.awayTeam,
      homeAwayLabel: "vs",
    })),
    ...team.awayMatches.map((match) => ({
      id: match.id,
      round: match.round,
      roundNumber: match.roundNumber,
      stage: match.stage,
      opponent: match.homeTeam,
      homeAwayLabel: "@",
    })),
  ].sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return (a.roundNumber || 0) - (b.roundNumber || 0);
  });

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium">
        <section
          className="overflow-hidden rounded-[20px] px-5 py-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor || "#171717"} 0%, ${team.secondaryColor || "#B89020"} 100%)`,
          }}
        >
          <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em]">
            Pagina base do time
          </div>
          <h1 className="mt-4 text-[2rem] font-black tracking-tight sm:text-[2.6rem]">
            {team.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-[1rem]">
            Esta pagina ja nasce pronta para ser a base publica do time dentro do
            campeonato. Agora ela mostra elenco, posicao atual e jogos da equipe;
            depois pode crescer para estatisticas e historico.
          </p>

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
              Recarregar pagina do time
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <article className="xv-card">
            <h2 className="text-[1.35rem] font-black tracking-tight text-[#101010]">
              Resumo
            </h2>
            <div className="mt-4 grid gap-3">
              <StatCard label="Posicao" value={standing?.rank ? `${standing.rank}º` : "-"} />
              <StatCard label="Pontos" value={String(standing?.points ?? 0)} />
              <StatCard label="Jogos" value={String(standing?.gamesPlayed ?? 0)} />
              <StatCard label="Elenco" value={String(team.players.length)} />
            </div>
          </article>

          <article className="xv-card">
            <h2 className="text-[1.35rem] font-black tracking-tight text-[#101010]">
              Elenco
            </h2>
            {team.players.length === 0 ? (
              <EmptyPanel
                title="Elenco em montagem"
                description="Os times-placeholder ja podem aparecer publicamente, mas o elenco real pode ser fechado depois da divisao do campeonato."
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                  >
                    <div className="text-base font-bold text-[#101010]">
                      {player.registration.nickname || player.registration.fullName}
                    </div>
                    <div className="mt-1 text-sm text-[#4B5563]">
                      {player.registration.fullName}
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                      {player.registration.preferredPosition}
                      {player.registration.level ? ` • Nivel ${player.registration.level}` : ""}
                      {player.squadNumber !== null ? ` • Camisa ${player.squadNumber}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="xv-card">
          <h2 className="text-[1.35rem] font-black tracking-tight text-[#101010]">
            Jogos do time
          </h2>
          {matches.length === 0 ? (
            <EmptyPanel
              title="Agenda ainda vazia"
              description="Quando a tabela for criada para este campeonato, os jogos deste time aparecem aqui sem precisar refazer a rota."
            />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {matches.map((match) => {
                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#3450A1]">
                      {match.stage?.name || `Rodada ${match.round}`}
                    </div>
                    <div className="mt-2 text-lg font-black text-[#101010]">
                      {match.homeAwayLabel} {match.opponent.shortName || match.opponent.name}
                    </div>
                    <div className="mt-1 text-sm text-[#4B5563]">
                      Rodada {match.round}
                      {match.roundNumber ? ` • Jogo ${match.roundNumber}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
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

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-4 py-5">
      <div className="text-base font-bold text-[#101010]">{title}</div>
      <div className="mt-1 text-sm leading-6 text-[#4B5563]">{description}</div>
    </div>
  );
}
