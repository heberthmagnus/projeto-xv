"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, safeExternalUrl } from "@/lib/sponsor-links";

const pagePath = "/admin/patrocinadores";
const text = (value: FormDataEntryValue | null) => String(value || "").trim();

function finish() {
  revalidatePath(pagePath);
  revalidatePath("/campeonatos/tio-hugo-2026");
  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/campeonatos/[slug]/times/[teamSlug]", "page");
  redirect(pagePath);
}
function getData(formData: FormData) {
  const name = text(formData.get("name"));
  const logoUrl = safeExternalUrl(text(formData.get("logoUrl")));
  const websiteUrl = safeExternalUrl(text(formData.get("websiteUrl")));
  const instagramUrl = safeExternalUrl(text(formData.get("instagramUrl")));
  const whatsapp = normalizeWhatsapp(text(formData.get("whatsapp")));
  const description = text(formData.get("description"));
  if (!name || !logoUrl) throw new Error("Informe o nome e uma URL válida para o logotipo.");
  if (text(formData.get("websiteUrl")) && !websiteUrl) throw new Error("Informe uma URL válida para o site.");
  if (text(formData.get("instagramUrl")) && !instagramUrl) throw new Error("Informe uma URL válida para o Instagram.");
  if (text(formData.get("whatsapp")) && !whatsapp) throw new Error("Informe um WhatsApp válido.");
  return { name, logoUrl, websiteUrl, instagramUrl, whatsapp, description: description || null, active: formData.get("active") === "on" };
}

export async function createSponsor(formData: FormData) { await requireAdmin(); await prisma.sponsor.create({ data: getData(formData) }); finish(); }
export async function updateSponsor(formData: FormData) { await requireAdmin(); const id = text(formData.get("id")); if (!id) throw new Error("Patrocinador não encontrado."); await prisma.sponsor.update({ where: { id }, data: getData(formData) }); finish(); }
export async function toggleSponsor(formData: FormData) { await requireAdmin(); const id = text(formData.get("id")); const active = text(formData.get("active")) === "true"; if (!id) throw new Error("Patrocinador não encontrado."); await prisma.sponsor.update({ where: { id }, data: { active } }); finish(); }
