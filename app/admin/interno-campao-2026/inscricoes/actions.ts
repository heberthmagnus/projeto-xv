"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";

export async function updateRegistrationCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const rawCategory = String(formData.get("category") || "").trim();

  if (!id) {
    throw new Error("Inscrição não encontrada.");
  }

  if (!["ADULTO", "MASTER"].includes(rawCategory)) {
    throw new Error("Categoria inválida.");
  }

  await prisma.registration.update({
    where: { id },
    data: {
      category: rawCategory as "ADULTO" | "MASTER",
    },
  });

  redirect(`${getInternoCampao2026AdminRegistrationsPath()}?success=category`);
}
