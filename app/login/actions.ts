"use server";

import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthDatabaseUnavailableError,
  clearAdminSession,
  createAdminSession,
  canAccessAdministration,
  isActiveMember,
  userHasPermission,
  verifyStoredPassword,
} from "@/lib/auth";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import { executePrisma, getFriendlyDatabaseErrorMessage } from "@/lib/prisma-safe";
import { LoginFormState } from "./form-state";
import { isRateLimited } from "@/lib/request-rate-limit";
import { verifySupabasePassword } from "@/lib/supabase/server-auth";

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
) {
  if (await isRateLimited("login", 10, 15 * 60 * 1000)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

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
          select: { id: true, email: true, password: true, supabaseAuthId: true, role: true, roles: { select: { role: true } }, member: { select: { id: true, status: true } } },
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

  if (!user) {
    return { error: "E-mail ou senha inválidos." };
  }
  const supabaseToken = user.supabaseAuthId ? await verifySupabasePassword(email, password, user.supabaseAuthId) : null;
  if (user.supabaseAuthId ? !supabaseToken : !(await verifyStoredPassword(user.password, password))) return { error: "E-mail ou senha inválidos." };

  if (!canAccessAdministration(user) && !isActiveMember(user)) {
    return { error: "Seu usuário não possui acesso ativo à plataforma." };
  }

  try {
    await createAdminSession(user.id, supabaseToken ?? undefined);
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

  redirect(canAccessAdministration(user) ? (userHasPermission(user, "sports.manage") ? getInternoCampao2026AdminRegistrationsPath() : "/acesso") : "/minha-conta");
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
