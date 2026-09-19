"use server";

import { SiteBacklogStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const pagePath = "/admin/backlog";
const text = (value: FormDataEntryValue | null) => String(value || "").trim();

function dataFrom(formData: FormData) {
  const title = text(formData.get("title"));
  const description = text(formData.get("description"));
  const area = text(formData.get("area"));
  const status = text(formData.get("status"));
  if (!title || !description || !area) throw new Error("Preencha título, área e descrição.");
  if (!Object.values(SiteBacklogStatus).includes(status as SiteBacklogStatus)) throw new Error("Status inválido.");
  return { title, description, area, status: status as SiteBacklogStatus };
}

function finish() { revalidatePath(pagePath); }

export async function createBacklogItem(formData: FormData) {
  await requireAdmin();
  const data = dataFrom(formData);
  const latest = await prisma.siteBacklogItem.aggregate({ _max: { sortOrder: true } });
  await prisma.siteBacklogItem.create({ data: { ...data, sortOrder: (latest._max.sortOrder ?? 0) + 1 } });
  finish();
}

export async function updateBacklogItem(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  if (!id) throw new Error("Item não encontrado.");
  await prisma.siteBacklogItem.update({ where: { id }, data: dataFrom(formData) });
  finish();
}

export async function moveBacklogItem(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const status = text(formData.get("status"));
  if (!id) throw new Error("Item não encontrado.");
  if (!Object.values(SiteBacklogStatus).includes(status as SiteBacklogStatus)) throw new Error("Status inválido.");
  await prisma.siteBacklogItem.update({ where: { id }, data: { status: status as SiteBacklogStatus } });
  finish();
}

export async function deleteBacklogItem(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  if (!id) throw new Error("Item não encontrado.");
  await prisma.siteBacklogItem.delete({ where: { id } });
  finish();
}
