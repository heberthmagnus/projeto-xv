"use server";

import { MembershipCategory, MembershipStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = new Set<MembershipStatus>(["ATIVO", "INATIVO", "SUSPENSO"]);
const categories = new Set<MembershipCategory>(["PROPRIETARIO", "FAMILIAR"]);

function memberInput(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "") as MembershipCategory;
  const membershipCode = String(formData.get("membershipCode") ?? "").trim() || null;
  if (!fullName || !categories.has(category)) throw new Error("Informe nome e categoria válidos.");
  return { fullName, email, phone, category, membershipCode };
}

export async function createMember(formData: FormData) {
  const actor = await requirePermission("member.create");
  const data = memberInput(formData);
  const created = await prisma.member.create({ data });
  await prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "member.create", target: `Member:${created.id}`, next: data } });
  revalidatePath("/admin/associados");
}

export async function updateMember(formData: FormData) {
  const actor = await requirePermission("member.update");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Associado inválido.");
  const data = memberInput(formData);
  const before = await prisma.member.findUnique({ where: { id }, select: { fullName: true, email: true, phone: true, category: true, membershipCode: true } });
  if (!before) throw new Error("Associado não encontrado.");
  await prisma.$transaction([prisma.member.update({ where: { id }, data }), prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "member.update", target: `Member:${id}`, previous: before, next: data } })]);
  revalidatePath("/admin/associados");
}

export async function linkMemberAthlete(formData: FormData) {
  const actor = await requirePermission("member.player.link");
  const memberId = String(formData.get("memberId") ?? "").trim();
  const athleteId = String(formData.get("athleteId") ?? "").trim();
  if (!memberId || !athleteId) throw new Error("Selecione associado e atleta.");
  const [member, athlete] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId }, select: { id: true, athleteProfile: { select: { id: true } } } }),
    prisma.athleteProfile.findUnique({ where: { id: athleteId }, select: { memberId: true } }),
  ]);
  if (!member || !athlete || athlete.memberId || member.athleteProfile) throw new Error("O associado ou atleta já possui um vínculo.");
  await prisma.$transaction([prisma.athleteProfile.update({ where: { id: athleteId }, data: { memberId } }), prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "member.player.link", target: `Member:${memberId}`, previous: { athleteMemberId: null }, next: { athleteId } } })]);
  revalidatePath("/admin/associados");
}

export async function unlinkMemberAthlete(formData: FormData) {
  const actor = await requirePermission("member.player.link");
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) throw new Error("Associado inválido.");
  const athlete = await prisma.athleteProfile.findFirst({ where: { memberId }, select: { id: true, fullName: true } });
  if (!athlete) throw new Error("Este associado não possui atleta vinculado.");
  await prisma.$transaction([
    prisma.athleteProfile.update({ where: { id: athlete.id }, data: { memberId: null } }),
    prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "member.player.unlink", target: `Member:${memberId}`, previous: { athleteId: athlete.id, athleteName: athlete.fullName }, next: { athleteMemberId: null } } }),
  ]);
  revalidatePath("/admin/associados");
}

export async function updateMemberStatus(formData: FormData) {
  const actor = await requirePermission("member.status.manage");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "") as MembershipStatus;
  if (!id || !statuses.has(status)) throw new Error("Situação de associado inválida.");

  const before = await prisma.member.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!before) throw new Error("Associado não encontrado.");
  if (before.status !== status) {
    await prisma.$transaction([
      prisma.member.update({ where: { id }, data: { status } }),
      prisma.administrativeAudit.create({ data: { actorId: actor.id, action: "member.status.update", target: `Member:${id}`, previous: { status: before.status }, next: { status } } }),
    ]);
  }
  revalidatePath("/admin/associados");
  revalidatePath("/minha-conta");
}
