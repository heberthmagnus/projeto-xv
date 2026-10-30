import { requirePermission, userHasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReprocessPoolForm } from "./reprocess-pool-form";

function formatDate(value: Date | null) {
  return value?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) ?? "Sem horário";
}

const pageSize = 20;

function pageFrom(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function PageNavigation({ label, page, total, param, otherPage }: { label: string; page: number; total: number; param: "participantsPage" | "matchesPage"; otherPage: number }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (last === 1) return null;
  const href = (next: number) => `/admin/bolao?${param}=${next}&${param === "participantsPage" ? "matchesPage" : "participantsPage"}=${otherPage}`;
  return <nav className="mt-3 flex items-center justify-between gap-3 text-sm" aria-label={`Paginação de ${label}`}><span className="text-[#6B7280]">Página {page} de {last} · {total} no total</span><span className="flex gap-2">{page > 1 ? <Link href={href(page - 1)} className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-bold text-[#374151] no-underline">Anterior</Link> : null}{page < last ? <Link href={href(page + 1)} className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-bold text-[#374151] no-underline">Próxima</Link> : null}</span></nav>;
}

export default async function BolaoAdminPage({ searchParams }: { searchParams: Promise<{ participantsPage?: string; matchesPage?: string }> }) {
  const user = await requirePermission("pool.read");
  const params = await searchParams;
  const participantsPage = pageFrom(params.participantsPage);
  const matchesPage = pageFrom(params.matchesPage);
  const canRecalculate = userHasPermission(user, "pool.recalculate");
  const canReadAudit = userHasPermission(user, "audit.read");
  const [pools, audits] = await Promise.all([
    prisma.predictionPool.findMany({
      where: { championship: { slug: "interno-campao-2026" } },
      orderBy: { category: "asc" },
      include: {
        _count: { select: { participants: true, matches: true } },
        participants: { orderBy: { joinedAt: "asc" }, skip: (participantsPage - 1) * pageSize, take: pageSize, select: { id: true, joinedAt: true, member: { select: { fullName: true, status: true } }, _count: { select: { predictions: true } } } },
        matches: { orderBy: [{ match: { round: "asc" } }, { match: { roundNumber: "asc" } }], skip: (matchesPage - 1) * pageSize, take: pageSize, select: { id: true, lockAt: true, lockedAt: true, eligible: true, _count: { select: { predictions: true } }, match: { select: { round: true, scheduledAt: true, status: true, homeScore: true, awayScore: true, homeTeam: { select: { shortName: true, name: true } }, awayTeam: { select: { shortName: true, name: true } } } } } },
      },
    }),
    canReadAudit ? prisma.administrativeAudit.findMany({ where: { action: "prediction_pool.reprocess" }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, target: true, actorId: true, createdAt: true, next: true } }) : Promise.resolve([]),
  ]);
  const now = new Date();

  return <main className="xv-page-shell"><div className="xv-page-container grid gap-4"><section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Campeonato Interno XV Campão 2026</p><h1 className="mt-1 text-3xl font-black">Gestão do Bolão</h1><p className="mt-2 text-sm leading-6 text-[#4B5563]">Participantes, participação por rodada, bloqueios e reprocessamentos auditáveis.</p></section>{pools.map((pool) => { const closed = pool.matches.filter((match) => match.lockedAt || match.lockAt <= now).length; const finalized = pool.matches.filter((match) => match.match.status === "FINALIZADO" && match.match.homeScore !== null && match.match.awayScore !== null).length; const rounds = [...new Set(pool.matches.map((match) => match.match.round))].sort((a, b) => a - b); return <section key={pool.id} className="xv-card"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">Bolão {pool.category === "ADULTO" ? "Adulto" : "Master"}</p><h2 className="mt-1 text-2xl font-black">{pool._count.participants} participante(s)</h2><p className="mt-1 text-sm text-[#4B5563]">{pool._count.matches} jogos · nesta página: {closed} bloqueados · {finalized} com resultado oficial</p></div>{canRecalculate ? <ReprocessPoolForm poolId={pool.id}/> : null}</div><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{rounds.map((round) => { const matches = pool.matches.filter((match) => match.match.round === round && match.eligible); const submitted = matches.reduce((total, match) => total + match._count.predictions, 0); const possible = pool._count.participants * matches.length; const rate = possible ? Math.round((submitted / possible) * 100) : 0; return <div key={round} className="min-w-32 rounded-xl bg-[#F7F7F7] p-3 text-sm"><p className="font-bold">Rodada {round}</p><p className="mt-1 text-[#4B5563]">{submitted}/{possible} palpites</p><p className="font-black text-[#8B6914]">{rate}%</p></div>; })}</div><div className="mt-5 grid gap-4 xl:grid-cols-2"><section><h3 className="text-sm font-black uppercase tracking-[.1em] text-[#4B5563]">Participantes</h3><ul className="mt-2 divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB]">{pool.participants.map((participant) => <li key={participant.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"><div><p className="font-bold">{participant.member.fullName}</p><p className="text-xs text-[#6B7280]">Entrou em {formatDate(participant.joinedAt)} · {participant._count.predictions} palpite(s)</p></div><span className={participant.member.status === "ATIVO" ? "text-xs font-bold text-[#166534]" : "text-xs font-bold text-[#B42318]"}>{participant.member.status}</span></li>)}</ul><PageNavigation label="participantes" page={participantsPage} total={pool._count.participants} param="participantsPage" otherPage={matchesPage}/></section><section><h3 className="text-sm font-black uppercase tracking-[.1em] text-[#4B5563]">Partidas vinculadas</h3><ul className="mt-2 divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB]">{pool.matches.map((item) => { const locked = item.lockedAt || item.lockAt <= now; return <li key={item.id} className="px-3 py-2.5 text-sm"><p className="font-bold">R{item.match.round} · {item.match.homeTeam.shortName || item.match.homeTeam.name} × {item.match.awayTeam.shortName || item.match.awayTeam.name}</p><p className="mt-1 text-xs text-[#6B7280]">{item.eligible ? locked ? "Bloqueado" : "Aberto" : "Inelegível"} · Fecha: {formatDate(item.lockAt)} · {item._count.predictions} palpite(s)</p></li>; })}</ul><PageNavigation label="partidas" page={matchesPage} total={pool._count.matches} param="matchesPage" otherPage={participantsPage}/></section></div></section>; })}{canReadAudit ? <section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">Auditoria</p><h2 className="mt-1 text-xl font-black">Reprocessamentos recentes</h2>{audits.length ? <ul className="mt-3 divide-y divide-[#E5E7EB]">{audits.map((audit) => <li key={audit.id} className="py-3 text-sm"><p className="font-bold">{audit.target}</p><p className="text-[#4B5563]">{formatDate(audit.createdAt)} · responsável: {audit.actorId}</p><p className="text-xs text-[#6B7280]">{JSON.stringify(audit.next)}</p></li>)}</ul> : <p className="mt-3 text-sm text-[#6B7280]">Nenhum reprocessamento registrado.</p>}</section> : null}</div></main>;
}
import Link from "next/link";
