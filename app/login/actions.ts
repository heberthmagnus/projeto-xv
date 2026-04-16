"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  verifyStoredPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_REGISTRATIONS_PATH } from "@/lib/routes";
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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (!user || !(await verifyStoredPassword(user.password, password))) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createAdminSession(user.id);
  redirect(ADMIN_REGISTRATIONS_PATH);
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
