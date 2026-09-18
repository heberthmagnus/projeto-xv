import { requireAdmin } from "@/lib/auth";
import { getPreferredPlayerName } from "@/lib/player-display-name";
import { prisma } from "@/lib/prisma";
import { DATABASE_UNAVAILABLE_MESSAGE, isPrismaConnectionError } from "@/lib/prisma-safe";
import { addRosterPlayer, setRegistrationTeam } from "./actions";

const championshipSlug = "interno-campao-2026";

type SearchParams = { search?: string; success?: string };

export default async function RostersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  let data: Awaited<ReturnType<typeof loadRosterData>>;
  try {
    data = await loadRosterData(searchParams);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Campeonato Interno 2026</p><h1 className="mt-1 text-3xl font-black">Gerenciar elencos</h1><p role="status" className="mt-4 rounded-xl bg-[#FFF9EA] px-4 py-3 text-sm font-bold text-[#8B6914]">{DATABASE_UNAVAILABLE_MESSAGE}</p><p className="mt-2 text-sm text-[#6B7280]">Nenhuma alteração foi feita. Atualize a página em alguns instantes.</p></section></div></main>;
    }
    throw error;
  }
  const { filters, championship, registrations } = data;
  const teams = championship.teams.map(({ groupLabel, team }) => ({ ...team, groupLabel }));
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const matchingRegistrations = registrations.filter((registration) => !search || `${registration.fullName} ${registration.nickname ?? ""}`.toLocaleLowerCase("pt-BR").includes(search));
  const successMessage = filters.success === "jogador-adicionado" ? "Jogador incluído no elenco com um ID individual." : filters.success === "jogador-sem-time" ? "Jogador retirado do elenco e mantido no cadastro do campeonato." : filters.success === "time-atualizado" ? "Time do jogador atualizado com sucesso." : null;

  return <main className="xv-page-shell"><div className="xv-page-container space-y-5">
    <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Campeonato Interno 2026</p><h1 className="mt-1 text-3xl font-black">Gerenciar elencos</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Pesquise qualquer inscrição, confira o cadastro e defina o time atual. “Sem time” retira o atleta do elenco, mas mantém seu cadastro e todo o histórico já lançado.</p>{successMessage ? <p role="status" className="mt-4 rounded-xl bg-[#ECFDF3] px-4 py-3 text-sm font-bold text-[#166534]">✓ {successMessage}</p> : null}</section>
    <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Buscar cadastro</p><h2 className="mt-1 text-xl font-black">Localizar e definir o time</h2><form className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="grid flex-1 gap-1 text-sm font-bold">Nome ou apelido<input name="search" defaultValue={filters.search ?? ""} placeholder="Ex.: Bocão" className="rounded-xl border border-[#D4D4D8] px-3 py-2.5 font-normal" /></label><div className="flex gap-2 sm:self-end"><button className="rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-bold text-white">Pesquisar</button><a href="/admin/interno-campao-2026/elencos" className="rounded-xl border border-[#D4D4D8] px-4 py-2.5 text-sm font-bold">Limpar</a></div></form>{search ? <div className="mt-5 space-y-3"><p className="text-sm text-[#6B7280]">{matchingRegistrations.length} cadastro(s) encontrado(s).</p>{matchingRegistrations.map((registration) => <article key={registration.id} className="rounded-2xl border border-[#E5E7EB] p-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end"><div><h3 className="text-lg font-black">{getPreferredPlayerName(registration.nickname, registration.fullName)}</h3><p className="text-sm text-[#6B7280]">{registration.fullName}</p><dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2"><div><dt className="inline font-bold">Posição: </dt><dd className="inline">{registration.preferredPosition}</dd></div><div><dt className="inline font-bold">Categoria: </dt><dd className="inline">{registration.category}</dd></div><div><dt className="inline font-bold">Nascimento: </dt><dd className="inline">{registration.birthDate.toLocaleDateString("pt-BR")}</dd></div><div><dt className="inline font-bold">Time atual: </dt><dd className="inline">{registration.championshipPlayer?.team ? `${registration.championshipPlayer.team.icon ?? ""} ${registration.championshipPlayer.team.shortName || registration.championshipPlayer.team.name}` : "Sem time"}</dd></div></dl></div><form action={setRegistrationTeam} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="registrationId" value={registration.id}/><label className="grid gap-1 text-xs font-bold">Colocar em<select name="teamId" defaultValue={registration.championshipPlayer?.team?.id ?? "SEM_TIME"} className="min-w-52 rounded-xl border border-[#D4D4D8] bg-white px-3 py-2.5 text-sm font-normal"><option value="SEM_TIME">Sem time</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.icon} {team.shortName || team.name}</option>)}</select></label><button className="rounded-xl bg-[#B89020] px-4 py-2.5 text-sm font-bold text-white sm:self-end">Salvar</button></form></div></article>)}</div> : <p className="mt-4 text-sm text-[#6B7280]">Digite um nome para conferir o cadastro e alterar o time do jogador.</p>}</section>
    <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Substituição</p><h2 className="mt-1 text-xl font-black">Adicionar jogador ao elenco</h2><p className="mt-1 text-sm text-[#6B7280]">Use para registrar um substituto, como em caso de lesão. O atleta já entra no time selecionado.</p><form action={addRosterPlayer} className="mt-4 grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Nome completo<input name="fullName" className="rounded-xl border border-[#D4D4D8] px-3 py-2.5 font-normal" required /></label><label className="grid gap-1 text-sm font-bold">Apelido<input name="nickname" className="rounded-xl border border-[#D4D4D8] px-3 py-2.5 font-normal" /></label><label className="grid gap-1 text-sm font-bold">Time<select name="teamId" className="rounded-xl border border-[#D4D4D8] bg-white px-3 py-2.5 font-normal" required>{teams.map((team) => <option key={team.id} value={team.id}>{team.icon} {team.shortName || team.name}</option>)}</select></label><label className="grid gap-1 text-sm font-bold">Posição<select name="preferredPosition" defaultValue="" className="rounded-xl border border-[#D4D4D8] bg-white px-3 py-2.5 font-normal" required><option value="" disabled>Selecione</option>{["GOLEIRO", "LATERAL", "ZAGUEIRO", "VOLANTE", "MEIA", "ATACANTE"].map((position) => <option key={position} value={position}>{position[0]}{position.slice(1).toLowerCase()}</option>)}</select></label><label className="grid gap-1 text-sm font-bold">Data de nascimento<input name="birthDate" type="date" className="rounded-xl border border-[#D4D4D8] px-3 py-2.5 font-normal" required /></label><label className="grid gap-1 text-sm font-bold">Telefone<input name="phone" type="tel" className="rounded-xl border border-[#D4D4D8] px-3 py-2.5 font-normal" required /></label><div className="md:col-span-2"><button className="rounded-xl bg-[#B89020] px-5 py-3 text-sm font-bold text-white">Adicionar ao elenco</button></div></form></section>
    <section className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Conferência</p><h2 className="mt-1 text-xl font-black">Elencos atuais</h2></div><div className="grid gap-4 lg:grid-cols-2">{teams.map((team) => <article key={team.id} className="xv-card"><h3 className="text-lg font-black">{team.icon} {team.shortName || team.name}</h3><p className="mt-1 text-sm text-[#6B7280]">{team.groupLabel || "Sem categoria"} · {team.players.length} jogador(es)</p><ul className="mt-4 divide-y divide-[#E5E7EB]">{team.players.map((player) => <li key={player.id} className="py-2 text-sm font-semibold text-[#374151]">{getPreferredPlayerName(player.registration.nickname, player.registration.fullName)}</li>)}</ul></article>)}</div></section>
  </div></main>;
}

async function loadRosterData(searchParams: Promise<SearchParams>) {
  const [filters, championship, registrations] = await Promise.all([
    searchParams,
    prisma.championship.findUniqueOrThrow({
      where: { slug: championshipSlug },
      select: {
        teams: {
          orderBy: [{ groupLabel: "asc" }, { displayOrder: "asc" }],
          select: {
            groupLabel: true,
            team: {
              select: {
                id: true, name: true, shortName: true, icon: true,
                players: {
                  where: { championship: { slug: championshipSlug } },
                  orderBy: { registration: { fullName: "asc" } },
                  select: { id: true, registration: { select: { fullName: true, nickname: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.registration.findMany({
      where: { championship: { slug: championshipSlug } },
      orderBy: { fullName: "asc" },
      select: {
        id: true, fullName: true, nickname: true, preferredPosition: true, birthDate: true, category: true,
        championshipPlayer: { select: { team: { select: { id: true, name: true, shortName: true, icon: true } } } },
      },
    }),
  ]);
  return { filters, championship, registrations };
}
