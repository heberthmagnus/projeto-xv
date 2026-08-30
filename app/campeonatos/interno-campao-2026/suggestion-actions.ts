"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function submitSiteSuggestion(formData: FormData) {
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!subject || !message) throw new Error("Informe o assunto e a mensagem.");
  await prisma.siteSuggestion.create({ data: { name: String(formData.get("name") || "").trim() || null, contact: String(formData.get("contact") || "").trim() || null, subject, message, allowContact: formData.get("allowContact") === "on" } });
  revalidatePath("/admin/interno-campao-2026/sugestoes");
}
