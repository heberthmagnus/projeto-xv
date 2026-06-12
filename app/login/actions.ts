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
import { getTioHugoAdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
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
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Login failed: database unavailable.");
      return { error: "Banco de dados indisponível no momento. Tente novamente em instantes." };
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

  redirect(getTioHugoAdminRegistrationsPath());
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}

function isDatabaseConnectionError(error: unknown) {
  if (error instanceof AuthDatabaseUnavailableError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001";
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.message.includes("Can't reach database server");
  }

  if (error instanceof Error) {
    return error.message.includes("Can't reach database server");
  }

  return false;
}
