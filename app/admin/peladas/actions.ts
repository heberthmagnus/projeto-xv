"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PELADAS_PATH } from "@/lib/routes";
import { parsePeladaFormData } from "./pelada-form-values";

export async function createPelada(formData: FormData) {
  await requireAdmin();

  const data = parsePeladaFormData(formData);

  await prisma.pelada.create({
    data,
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=create`);
}

export async function updatePelada(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Pelada não encontrada.");
  }

  const data = parsePeladaFormData(formData);

  await prisma.pelada.update({
    where: { id },
    data,
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=update`);
}

export async function deletePelada(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Pelada não encontrada.");
  }

  await prisma.pelada.delete({
    where: { id },
  });

  redirect(`${ADMIN_PELADAS_PATH}?success=delete`);
}

function getPeladaDetailsPath(peladaId: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params);
  const query = search.toString();

  return `${ADMIN_PELADAS_PATH}/${peladaId}${query ? `?${query}` : ""}`;
}

function parseConfirmationFormData(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const preferredPosition = String(
    formData.get("preferredPosition") || "",
  ).trim();
  const age = Number.parseInt(String(formData.get("age") || "").trim(), 10);
  const guestCount = Number.parseInt(
    String(formData.get("guestCount") || "0").trim(),
    10,
  );
  const goalkeeperSide = String(formData.get("goalkeeperSide") || "").trim();

  if (!fullName) {
    throw new Error("Informe o nome completo do confirmado.");
  }

  if (!preferredPosition) {
    throw new Error("Selecione a posição do confirmado.");
  }

  if (!Number.isInteger(age) || age <= 0 || age > 99) {
    throw new Error("Informe uma idade válida para o confirmado.");
  }

  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 5) {
    throw new Error("A quantidade de convidados deve ficar entre 0 e 5.");
  }

  if (
    goalkeeperSide &&
    goalkeeperSide !== "GOLEIRO_A" &&
    goalkeeperSide !== "GOLEIRO_B"
  ) {
    throw new Error("Selecione um goleiro válido.");
  }

  return {
    fullName,
    preferredPosition: preferredPosition as
      | "GOLEIRO"
      | "LATERAL"
      | "ZAGUEIRO"
      | "VOLANTE"
      | "MEIA"
      | "ATACANTE",
    age,
    guestCount,
    goalkeeperSide: goalkeeperSide
      ? (goalkeeperSide as "GOLEIRO_A" | "GOLEIRO_B")
      : null,
  };
}

export async function createAdminPeladaConfirmation(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();

  if (!peladaId) {
    throw new Error("Pelada não encontrada.");
  }

  let data;

  try {
    data = parseConfirmationFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível adicionar o confirmado.";
    redirect(
      getPeladaDetailsPath(peladaId, {
        error: message,
      }),
    );
  }

  await prisma.peladaConfirmation.create({
    data: {
      pelada: {
        connect: {
          id: peladaId,
        },
      },
      ...data,
      createdByAdmin: true,
    },
  });

  redirect(
    getPeladaDetailsPath(peladaId, {
      success: "confirmed-add",
    }),
  );
}

export async function updateAdminPeladaConfirmation(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  let data;

  try {
    data = parseConfirmationFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o confirmado.";
    redirect(
      getPeladaDetailsPath(peladaId, {
        error: message,
      }),
    );
  }

  await prisma.peladaConfirmation.update({
    where: { id: confirmationId },
    data,
  });

  redirect(
    getPeladaDetailsPath(peladaId, {
      success: "confirmed-update",
    }),
  );
}

export async function deleteAdminPeladaConfirmation(formData: FormData) {
  await requireAdmin();

  const peladaId = String(formData.get("peladaId") || "").trim();
  const confirmationId = String(formData.get("confirmationId") || "").trim();

  if (!peladaId || !confirmationId) {
    throw new Error("Confirmado não encontrado.");
  }

  await prisma.peladaConfirmation.delete({
    where: { id: confirmationId },
  });

  redirect(
    getPeladaDetailsPath(peladaId, {
      success: "confirmed-delete",
    }),
  );
}
