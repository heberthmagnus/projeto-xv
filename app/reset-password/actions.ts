"use server";
import { createSupabaseAuthClient } from "@/lib/supabase/server-auth";
import { prisma } from "@/lib/prisma";

export async function verifyRecoveryAccount(accessToken: string) {
  if (process.env.SUPABASE_PASSWORD_RECOVERY_ENABLED !== "true" || !accessToken || accessToken.length > 8192) return false;
  const { data, error } = await createSupabaseAuthClient().auth.getUser(accessToken);
  if (error || !data.user?.id || !data.user.email_confirmed_at) return false;
  const user = await prisma.user.findUnique({ where: { supabaseAuthId: data.user.id }, select: { id: true } });
  return Boolean(user);
}
