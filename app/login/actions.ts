"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthDatabaseUnavailableError,
  clearAdminSession,
  createAdminSession,
  isAdminRole,
  verifyStoredPassword,
} from "@/lib/auth";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrisma, getFriendlyDatabaseErrorMessage } from "@/lib/prisma-safe";
import { LoginFormState } from "./form-state";

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha para acessar." };
  }

  let user;

  try {
    user = await executePrisma(
      () =>
        prisma.user.findUnique({
          where: { email },
          select: { id: true, password: true, role: true },
        }),
      "login:find-user",
    );
  } catch (error) {
    const databaseMessage = getFriendlyDatabaseErrorMessage(error);

    if (databaseMessage) {
      return { error: databaseMessage };
    }

    throw error;
  }

  if (
    !user ||
    !(await verifyStoredPassword(user.password, password))
  ) {
    return { error: "E-mail ou senha inválidos." };
  }

  if (!isAdminRole(user.role)) {
    console.warn(`Login denied for non-admin user: ${email}`);
    return { error: "Seu usuário não tem permissão para acessar a área administrativa." };
  }

  try {
    await createAdminSession(user.id);
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      console.error("Login failed: auth secret missing in production.");
      return {
        error:
          "A autenticação da área administrativa está temporariamente indisponível. Tente novamente em instantes.",
      };
    }

    throw error;
  }

  redirect(getInternoCampao2026AdminRegistrationsPath());
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
