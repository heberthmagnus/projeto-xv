"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/request-rate-limit";
import { isValidBrazilPhone } from "@/lib/phone";
import { createSupabaseAuthClient } from "@/lib/supabase/server-auth";

export type SignupField = "fullName" | "email" | "phone" | "password" | "confirmation";
export type SignupState = {
  message: string;
  success: boolean;
  email?: string;
  errors?: Partial<Record<SignupField, string>>;
};

type ResendConfirmationState = { message: string; done: boolean };

export async function solicitarConta(_: SignupState, data: FormData): Promise<SignupState> {
  if (await isRateLimited("account-request", 5, 15 * 60 * 1000)) return { success: false, message: "Muitas tentativas. Tente novamente mais tarde." };
  const fullName = String(data.get("fullName") ?? "").trim().replace(/\s+/g, " ");
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const phone = String(data.get("phone") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const confirmation = String(data.get("confirmation") ?? "");
  const errors: SignupState["errors"] = {};
  if (fullName.length < 3 || fullName.length > 120) errors.fullName = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "Informe um e-mail válido.";
  if (!isValidBrazilPhone(phone)) errors.phone = "Use o formato (DD) 9XXXX-XXXX.";
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) errors.password = "Use uma senha entre 12 e 72 bytes.";
  if (password !== confirmation) errors.confirmation = "As senhas não coincidem.";
  if (Object.keys(errors).length > 0) return { success: false, message: "Confira os campos destacados.", errors };
  const generic = { success: true, email, message: "Se a solicitação puder ser recebida, você receberá um e-mail de confirmação. Após confirmar, a administração verificará sua identidade e associação antes de liberar o acesso. Se precisar, entre em contato com a secretaria." };
  try {
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return generic;
    if (process.env.SUPABASE_ACCOUNT_REGISTRATION_ENABLED !== "true") return { success: false, message: "O cadastro está temporariamente indisponível." };
    const appOrigin = process.env.AUTH_APP_ORIGIN;
    if (!appOrigin || new URL(appOrigin).origin !== appOrigin || new URL(appOrigin).protocol !== "https:") throw new Error("Cadastro não configurado.");
    // Persist the request before calling the external service. If the process stops
    // after Supabase creates the identity, an administrator can reconcile it by
    // exact confirmed email; no password is stored in the club database.
    let request = await prisma.accountRequest.findFirst({ where: { email: { equals: email, mode: "insensitive" }, status: "PENDENTE" }, select: { id: true, supabaseAuthId: true } });
    if (!request) {
      try {
        request = await prisma.accountRequest.create({ data: { fullName, email, phone, passwordHash: "" }, select: { id: true, supabaseAuthId: true } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        request = await prisma.accountRequest.findFirst({ where: { email: { equals: email, mode: "insensitive" }, status: "PENDENTE" }, select: { id: true, supabaseAuthId: true } });
      }
    }
    if (!request) return generic;
    if (request.supabaseAuthId) {
      await createSupabaseAuthClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${appOrigin}/auth/confirmar` } });
      return generic;
    }
    const authClient = createSupabaseAuthClient();
    const { data: auth, error } = await authClient.auth.signUp({ email, password, options: { emailRedirectTo: `${appOrigin}/auth/confirmar` } });
    if (error) return generic;
    if (!auth.user?.id || !auth.user.identities?.length) {
      // Supabase deliberately obscures existing identities. If this is an
      // unconfirmed signup, its documented resend endpoint owns the decision.
      await authClient.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${appOrigin}/auth/confirmar` } });
      return generic;
    }
    await prisma.accountRequest.updateMany({ where: { id: request.id, status: "PENDENTE", supabaseAuthId: null }, data: { supabaseAuthId: auth.user.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return generic;
    throw error;
  }
  return generic;
}

/** Re-send only a pending signup confirmation. It never reveals account existence. */
export async function reenviarConfirmacao(_: ResendConfirmationState, data: FormData): Promise<ResendConfirmationState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const generic = { done: true, message: "Se houver uma confirmação pendente para este e-mail, enviaremos novas instruções." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return generic;
  if (await isRateLimited("account-confirmation-resend", 5, 15 * 60 * 1000)) return { done: false, message: "Muitas tentativas. Aguarde antes de solicitar outro envio." };
  try {
    if (process.env.SUPABASE_ACCOUNT_REGISTRATION_ENABLED !== "true") return { done: false, message: "O cadastro está temporariamente indisponível." };
    const appOrigin = process.env.AUTH_APP_ORIGIN;
    if (!appOrigin || new URL(appOrigin).origin !== appOrigin || new URL(appOrigin).protocol !== "https:") throw new Error("Cadastro não configurado.");
    const request = await prisma.accountRequest.findFirst({ where: { email: { equals: email, mode: "insensitive" }, status: "PENDENTE" }, select: { id: true } });
    if (request) await createSupabaseAuthClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${appOrigin}/auth/confirmar` } });
  } catch {
    // Do not reveal whether an e-mail is registered or pending.
  }
  return generic;
}
