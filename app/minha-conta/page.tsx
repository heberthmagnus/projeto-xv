import { requireActiveMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/login/actions";

export default async function MinhaContaPage() {
  const user = await requireActiveMember();
  const member = await prisma.member.findUniqueOrThrow({ where: { userId: user.id }, select: { fullName: true, email: true, phone: true, category: true, status: true } });
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card"><h1 className="text-2xl font-black">Minha conta</h1><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt>Nome</dt><dd className="font-bold">{member.fullName}</dd></div><div><dt>E-mail</dt><dd className="font-bold">{member.email || "Não informado"}</dd></div><div><dt>Telefone</dt><dd className="font-bold">{member.phone || "Não informado"}</dd></div><div><dt>Categoria</dt><dd className="font-bold">{member.category === "PROPRIETARIO" ? "Proprietário" : "Familiar"}</dd></div><div><dt>Situação</dt><dd className="font-bold">Ativo</dd></div></dl><form action={logout} className="mt-6"><button className="rounded-lg bg-[#101010] px-4 py-2 font-bold text-white">Sair</button></form></section></div></main>;
}
