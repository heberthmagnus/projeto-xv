"use server";
import { revalidatePath } from "next/cache";
import { SiteBacklogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/request-rate-limit";

export async function submitSiteSuggestion(formData: FormData) {
  if (await isRateLimited("site-suggestion", 5, 60 * 60 * 1000)) {
    throw new Error("Muitas mensagens enviadas. Tente novamente mais tarde.");
  }

  // Honeypot: humans never fill this field. Silently accepting avoids giving
  // automated senders feedback that can help them tune an attack.
  if (String(formData.get("website") || "").trim()) {
    return;
  }

  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!subject || !message) throw new Error("Informe o assunto e a mensagem.");
  if (name.length > 120 || contact.length > 160 || subject.length > 80 || message.length > 2000) {
    throw new Error("Uma das informações excede o tamanho permitido.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.siteSuggestion.create({
      data: {
        name: name || null,
        contact: contact || null,
        subject,
        message,
        allowContact: formData.get("allowContact") === "on",
      },
    });
    const latest = await tx.siteBacklogItem.aggregate({ _max: { sortOrder: true } });
    await tx.siteBacklogItem.create({
      data: {
        title: subject === "Sugestão para o site" ? message.slice(0, 100) : subject,
        description: message,
        area: "Ideias enviadas pelo site",
        status: SiteBacklogStatus.IDEIAS,
        sortOrder: (latest._max.sortOrder ?? 0) + 1,
      },
    });
  });
  revalidatePath("/admin/interno-campao-2026/sugestoes");
  revalidatePath("/admin/backlog");
}
