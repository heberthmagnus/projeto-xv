"use server";

import { MembershipCategory, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function decidirSolicitacao(data: FormData) {
  const actor = await requirePermission("member.account.approve");
  const id = String(data.get("requestId") ?? "").trim();
  const decision = String(data.get("decision") ?? "");
  const memberId = String(data.get("memberId") ?? "").trim();
  const category = String(data.get("category") ?? "");
  if (!id || !["APROVAR", "RECUSAR"].includes(decision)) throw new Error("Solicitação inválida.");
  if (decision === "APROVAR" && (data.get("identityVerified") !== "on" || !["PROPRIETARIO", "FAMILIAR"].includes(category))) throw new Error("Confirme a identidade e a categoria antes de aprovar.");

  // Confirmation proves control of the address; approval proves membership.
  // Check the first condition before changing any club record so the
  // administrator receives a useful, recoverable explanation.
  if (decision === "APROVAR") {
    const request = await prisma.accountRequest.findUnique({ where: { id }, select: { email: true } });
    const identities = request ? await prisma.$queryRaw<Array<{ id: string }>>`SELECT id::text AS id FROM auth.users WHERE lower(email) = ${request.email.toLowerCase()} AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL LIMIT 2` : [];
    if (identities.length !== 1) redirect("/solicitacoes?erro=email-nao-confirmado");
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.accountRequest.findUnique({ where: { id } });
    if (!request || request.status !== "PENDENTE") throw new Error("Solicitação já analisada ou inexistente.");
    const claimed = await tx.accountRequest.updateMany({ where: { id, status: "PENDENTE" }, data: { status: decision === "APROVAR" ? "APROVADO" : "RECUSADO", decidedAt: new Date(), decidedBy: actor.id, passwordHash: "" } });
    if (claimed.count !== 1) throw new Error("Solicitação já analisada.");
    if (decision === "APROVAR") {
      const identities = await tx.$queryRaw<Array<{ id: string }>>`SELECT id::text AS id FROM auth.users WHERE lower(email) = ${request.email.toLowerCase()} AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL LIMIT 2`;
      if (identities.length !== 1) throw new Error("O e-mail ainda não foi confirmado no Supabase Auth.");
      const authId = identities[0].id;
      if (request.supabaseAuthId && request.supabaseAuthId !== authId) throw new Error("Identidade divergente; concilie a solicitação antes de aprovar.");
      if (await tx.user.findUnique({ where: { email: request.email }, select: { id: true } })) throw new Error("Já existe uma conta para este e-mail; encaminhe para conciliação.");
      const matches = await tx.member.findMany({ where: { email: { equals: request.email, mode: "insensitive" } }, select: { id: true, userId: true, status: true, category: true } });
      const sameName = await tx.member.findMany({ where: { fullName: { equals: request.fullName, mode: "insensitive" } }, select: { id: true } });
      if (sameName.some((member) => !matches.some((match) => match.id === member.id))) throw new Error("Há outro cadastro com o mesmo nome; concilie os dados antes de aprovar.");
      if (matches.length && (!memberId || matches.length !== 1 || matches[0].id !== memberId)) throw new Error("Já existe associado com este e-mail; selecione o cadastro após confirmar a identidade.");
      if (memberId && (!matches.length || matches[0].id !== memberId || matches[0].userId || matches[0].status !== "ATIVO" || matches[0].category !== category)) throw new Error("Cadastro existente não está disponível, ativo ou com a categoria informada.");
      const user = await tx.user.create({ data: { name: request.fullName, email: request.email, password: "!supabase-auth-only!", supabaseAuthId: authId, roles: { create: { role: "ASSOCIADO" } } }, select: { id: true } });
      let targetMemberId = memberId;
      if (memberId) {
        const linked = await tx.member.updateMany({ where: { id: memberId, userId: null, status: "ATIVO" }, data: { userId: user.id } });
        if (linked.count !== 1) throw new Error("Cadastro já foi vinculado.");
      } else {
        const member = await tx.member.create({ data: { userId: user.id, fullName: request.fullName, email: request.email, phone: request.phone, category: category as MembershipCategory, status: "ATIVO" }, select: { id: true } });
        targetMemberId = member.id;
      }
      await tx.administrativeAudit.create({ data: { actorId: actor.id, action: "member.account.approve", target: `AccountRequest:${id}`, next: { userId: user.id, memberId: targetMemberId, category, role: "ASSOCIADO" } } });
    } else {
      await tx.administrativeAudit.create({ data: { actorId: actor.id, action: "member.account.reject", target: `AccountRequest:${id}`, next: { status: "RECUSADO" } } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/solicitacoes");
  redirect(`/solicitacoes?sucesso=${decision === "APROVAR" ? "aprovada" : "recusada"}`);
}
