"use server";
import { createSupabaseAuthClient } from "@/lib/supabase/server-auth";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/request-rate-limit";

export type RecoveryState = { message: string; done: boolean };
export async function solicitarRecuperacao(_: RecoveryState, form: FormData): Promise<RecoveryState> {
  if (await isRateLimited("password-recovery", 5, 15 * 60 * 1000)) return { done: false, message: "Muitas tentativas. Aguarde antes de tentar novamente." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { done: false, message: "Informe um e-mail válido." };
  if (process.env.SUPABASE_PASSWORD_RECOVERY_ENABLED !== "true") return { done: false, message: "A recuperação está temporariamente indisponível. Fale com a secretaria." };
  const origin = process.env.AUTH_APP_ORIGIN;
  if (!origin || new URL(origin).origin !== origin || new URL(origin).protocol !== "https:") throw new Error("Recuperação não configurada.");
  const user = await prisma.user.findUnique({ where: { email }, select: { supabaseAuthId: true } });
  if (user?.supabaseAuthId) await createSupabaseAuthClient().auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` });
  return { done: true, message: "Se a conta estiver habilitada para recuperação, você receberá instruções por e-mail." };
}
