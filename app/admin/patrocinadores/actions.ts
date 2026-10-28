"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, safeExternalUrl } from "@/lib/sponsor-links";
import {
  removeManagedSponsorLogo,
  uploadSponsorLogo,
} from "@/lib/supabase/sponsor-logo-storage";

const pagePath = "/admin/patrocinadores";
const text = (value: FormDataEntryValue | null) => String(value || "").trim();

export type SponsorFormState = { error?: string };

function finish(): never {
  revalidatePath(pagePath);
  revalidatePath("/campeonatos/tio-hugo-2026");
  revalidatePath("/campeonatos/interno-campao-2026");
  revalidatePath("/campeonatos/[slug]/times/[teamSlug]", "page");
  return redirect(pagePath);
}
async function getData(formData: FormData, currentLogoUrl?: string) {
  const name = text(formData.get("name"));
  const websiteUrl = safeExternalUrl(text(formData.get("websiteUrl")));
  const instagramUrl = safeExternalUrl(text(formData.get("instagramUrl")));
  const whatsapp = normalizeWhatsapp(text(formData.get("whatsapp")));
  const description = text(formData.get("description"));
  if (!name) throw new Error("Informe o nome do patrocinador.");
  if (text(formData.get("websiteUrl")) && !websiteUrl) throw new Error("Informe uma URL válida para o site.");
  if (text(formData.get("instagramUrl")) && !instagramUrl) throw new Error("Informe uma URL válida para o Instagram.");
  if (text(formData.get("whatsapp")) && !whatsapp) throw new Error("Informe um WhatsApp válido.");

  const uploadedLogoUrl = await uploadSponsorLogo(formData);
  const logoUrl = uploadedLogoUrl || currentLogoUrl;
  if (!logoUrl) throw new Error("Envie uma logo válida.");
  return {
    data: { name, logoUrl, websiteUrl, instagramUrl, whatsapp, description: description || null, active: formData.get("active") === "on" },
    uploadedLogoUrl,
  };
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar o patrocinador agora. Tente novamente.";
}

export async function createSponsor(_: SponsorFormState, formData: FormData): Promise<SponsorFormState> {
  await requireAdmin();
  let prepared: Awaited<ReturnType<typeof getData>>;
  try {
    prepared = await getData(formData);
  } catch (error) {
    return { error: messageFromError(error) };
  }
  try {
    await prisma.sponsor.create({ data: prepared.data });
  } catch (error) {
    await removeManagedSponsorLogo(prepared.uploadedLogoUrl);
    return { error: messageFromError(error) };
  }
  finish();
}

export async function updateSponsor(_: SponsorFormState, formData: FormData): Promise<SponsorFormState> {
  await requireAdmin();
  const id = text(formData.get("id"));
  if (!id) return { error: "Patrocinador não encontrado." };

  let current: { logoUrl: string } | null;
  try {
    current = await prisma.sponsor.findUnique({ where: { id }, select: { logoUrl: true } });
  } catch (error) {
    return { error: messageFromError(error) };
  }
  if (!current) return { error: "Patrocinador não encontrado." };

  let prepared: Awaited<ReturnType<typeof getData>>;
  try {
    prepared = await getData(formData, current.logoUrl);
  } catch (error) {
    return { error: messageFromError(error) };
  }
  try {
    await prisma.sponsor.update({ where: { id }, data: prepared.data });
  } catch (error) {
    await removeManagedSponsorLogo(prepared.uploadedLogoUrl);
    return { error: messageFromError(error) };
  }

  if (prepared.uploadedLogoUrl) await removeManagedSponsorLogo(current.logoUrl);
  finish();
}
export async function toggleSponsor(formData: FormData) { await requireAdmin(); const id = text(formData.get("id")); const active = text(formData.get("active")) === "true"; if (!id) throw new Error("Patrocinador não encontrado."); await prisma.sponsor.update({ where: { id }, data: { active } }); finish(); }
