"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const suggestionStatuses = new Set([
  "NOVO",
  "EM_ANALISE",
  "EM_ANDAMENTO",
  "RESOLVIDO",
]);

export async function updateSuggestion(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = String(formData.get("adminNotes") || "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Sugestão inválida.");
  }

  if (!suggestionStatuses.has(status) || adminNotes.length > 4000) {
    throw new Error("Dados da sugestão inválidos.");
  }

  await prisma.siteSuggestion.update({
    where: { id },
    data: { status, adminNotes: adminNotes || null },
  });
  revalidatePath("/admin/interno-campao-2026/sugestoes");
}
